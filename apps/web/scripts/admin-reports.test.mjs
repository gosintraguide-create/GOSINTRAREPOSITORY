import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {Hono} from 'hono';
import {installAdminOperations} from '../../../supabase/functions/make-server-3bd0ade8/admin-operations.ts';
const pg=new PGlite();
await pg.exec('create role anon;create role authenticated;create role service_role;create table kv_store_3bd0ade8(key text primary key,value jsonb);');
for(const f of ['20260918010000_atomic_day_pass_booking','20260918011000_atomic_tour_sunset','20260918013000_checkout_holds','20261103010000_city_card_daily_inventory','20261104010000_city_card_cancellations','20261105010000_merchant_perks','20261105011000_hidden_test_merchants','20261105012000_staff_city_card_sales','20261105014000_admin_operations','20261106010000_admin_reports']) await pg.exec(await readFile(new URL('../../../supabase/migrations/'+f+'.sql',import.meta.url),'utf8'));
const report=async(kind,filters={})=>(await pg.query(`select admin_${kind}_report($1) report`,[JSON.stringify(filters)])).rows[0].report;
const partner=crypto.randomUUID(),offer=crypto.randomUUID();
await pg.query('insert into merchants(id,name,is_active) values($1,$2,false)',[partner,'Archived partner']);
await pg.query('insert into deals(id,merchant_id,title,is_single_use) values($1,$2,$3,false)',[offer,partner,'Coffee offer']);
for(let i=0;i<31;i++){
 const id=crypto.randomUUID(),bid='CC-fixture-'+i,purchase={selectedDate:'2026-07-10',passengers:[{name:'Adult',ageBand:'full',priceCents:1500},{name:'Child',ageBand:'free',priceCents:0}],paymentQuote:{amountCents:1500}};
 await pg.query("insert into city_card_orders(id,owner_id,email,purchase,state,created_at,booking_id) values($1,$2,$3,$4,$5,$6,$7)",[id,crypto.randomUUID(),'customer@example.invalid',JSON.stringify(purchase),i===30?'expired':'paid','2026-06-30T23:30:00Z',bid]);
 await pg.query('insert into kv_store_3bd0ade8 values($1,$2)',[bid,JSON.stringify({passengers:purchase.passengers.map((p,n)=>i===0&&n===0?{...p,cancelledAt:'2026-08-01'}:p)})]);
 if(i<4)await pg.query('insert into staff_card_sales(id,seller_id,seller,payment_method) values($1,$2,$3,$4)',[id,crypto.randomUUID(),JSON.stringify(i<2?{role:'driver',driverId:'driver-1',name:'Driver One'}:{role:'merchant',merchantId:partner,name:'Partner Sales'}),i===0?'cash':'terminal']);
 if(i===0)for(const [amount,state] of [[300,'succeeded'],[200,'review']]){const cancellation=crypto.randomUUID();await pg.query('insert into city_card_cancellations values($1,$2,$3,now())',[cancellation,'customer@example.invalid','fingerprint']);await pg.query('insert into city_card_refunds(id,cancellation_id,booking_id,email,amount_cents,state,created_at) values($1,$2,$3,$4,$5,$6,$7)',[crypto.randomUUID(),cancellation,bid,'customer@example.invalid',amount,state,'2026-08-01']);}
}
for(let i=0;i<3;i++)await pg.query('insert into city_perk_redemptions values($1,$2,$3,$4,$5,$6,$7,false,$8)',[crypto.randomUUID(),partner,offer,'CC-fixture-'+(i===2?1:0),0,'staff@example.invalid','Coffee offer','2026-06-30T23:30:00Z']);
test('full-set financial totals do not multiply orders for multiple refunds and ignore unpaid orders',async()=>{
 const r=await report('sales');assert.equal(r.total,30);assert.equal(r.rows.length,25);assert.equal(r.summary.gross,45000);assert.equal(r.summary.refunded,300);assert.equal(r.summary.outstanding,200);assert.equal(r.summary.net,44700);assert.equal(r.summary.cards,60);assert.equal(r.summary.cancelled,1);
 assert.equal(r.channels.reduce((n,c)=>n+c.gross,0),r.summary.gross);assert.equal(r.sellers.reduce((n,c)=>n+c.gross,0),r.summary.gross);
 const second=await report('sales',{page:1});assert.equal(second.rows.length,5);assert.equal(second.summary.gross,45000);assert.equal(new Set([...r.rows,...second.rows].map(r=>r.id)).size,30);
});
test('Lisbon date boundaries, visit dates, search and later attributed refunds are explicit',async()=>{
 assert.equal((await report('sales',{from:'2026-07-01',to:'2026-07-01'})).total,30);
 assert.equal((await report('sales',{to:'2026-06-30'})).total,0);
 assert.equal((await report('sales',{basis:'visit',from:'2026-07-10',to:'2026-07-10'})).total,30);
 const r=await report('sales',{role:'driver',seller:'driver:driver-1',channel:'cash',from:'2026-07-01',to:'2026-07-01'});assert.equal(r.total,1);assert.equal(r.summary.refunded,300);
 assert.equal((await report('sales',{q:'CC-fixture-29'})).total,1);
 await assert.rejects(report('sales',{from:'2026-07-10',to:'2026-07-01'}),/Invalid/);
});
test('driver identity and merchant business group sales across staff identities',async()=>{
 const drivers=await report('sales',{role:'driver'});assert.equal(drivers.sellers.length,1);assert.equal(drivers.sellers[0].cards,4);
 const merchants=await report('sales',{role:'merchant'});assert.equal(merchants.sellers.length,1);assert.equal(merchants.sellers[0].gross,3000);
});
test('perk reports count repeat uses separately from unique cards and retain archived partners',async()=>{
 const r=await report('perks',{from:'2026-07-01',to:'2026-07-01',partner});assert.equal(r.summary.uses,3);assert.equal(r.summary.unique_cards,2);assert.equal(r.partners[0].name,'Archived partner');assert.equal(r.offers[0].uses,3);assert.equal(r.daily[0].date,'2026-07-01');
 assert.equal((await report('perks',{to:'2026-06-30'})).total,0);assert.equal((await report('perks',{q:'nonexistent'})).total,0);
});
test('report routes enforce verified admins and invoke actual report SQL',async()=>{
 const app=new Hono();installAdminOperations(app,{db:{auth:{getUser:async t=>({data:{user:t==='admin'?{id:'admin',app_metadata:{role:'admin'}}:null}})},rpc:async(name,args)=>({data:await report(name==='admin_sales_report'?'sales':'perks',args.p_filters)})}});
 for(const kind of ['sales','perks']){const path='/make-server-3bd0ade8/admin/operations/reports?kind='+kind;assert.notEqual((await app.request(path)).status,200);const r=await app.request(path,{headers:{Authorization:'Bearer admin'}});assert.equal(r.status,200);assert.equal((await r.json()).report.total,kind==='sales'?30:3);}
 await pg.exec('set role authenticated');await assert.rejects(report('sales'),/permission denied/);await assert.rejects(report('perks'),/permission denied/);await pg.exec('reset role');
});
test.after(()=>pg.close());
