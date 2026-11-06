import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {Hono} from 'hono';
import {installMerchantPerks} from '../../../supabase/functions/make-server-3bd0ade8/merchant-perks.ts';
import {createAdminGuard} from '../../../supabase/functions/make-server-3bd0ade8/admin-auth.ts';
const pg=new PGlite();await pg.exec('create role anon;create role authenticated;create role service_role;create table kv_store_3bd0ade8(key text primary key,value jsonb);');
await pg.exec(await readFile(new URL('../../../supabase/migrations/20261105010000_merchant_perks.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../../../supabase/migrations/20261105013000_staff_access_profiles.sql',import.meta.url),'utf8'));
const m=crypto.randomUUID(),other=crypto.randomUUID(),single=crypto.randomUUID(),unlimited=crypto.randomUUID(),foreign=crypto.randomUUID(),bid='CC-'+crypto.randomUUID().toUpperCase();
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
await pg.query('insert into merchants(id,name) values($1,$2),($3,$4)',[m,'Cafe',other,'Other']);
await pg.query('insert into merchant_access(email,merchant_id) values($1,$2)',['merchant@example.invalid',m]);
await pg.query('insert into deals(id,merchant_id,title,is_single_use) values($1,$2,$3,true),($4,$2,$5,false),($6,$7,$8,true)',[single,m,'One coffee',unlimited,'Discount',foreign,other,'Other offer']);
let booking={id:bid,product:'city-card-v1',selectedDate:today,paymentStatus:'paid',status:'confirmed',contactInfo:{email:'owner@example.invalid'},transportHours:{opens:'00:00',closes:'00:01'},passengers:[{name:'Full A',ageBand:'full'},{name:'Half',ageBand:'half'},{name:'Free',ageBand:'free'},{name:'Full B',ageBand:'full'}]};
const save=()=>pg.query('insert into kv_store_3bd0ade8 values($1,$2) on conflict(key) do update set value=excluded.value',[bid,JSON.stringify(booking)]);await save();
const use=async({deal=single,index=0,id=crypto.randomUUID(),commit=true,email='merchant@example.invalid'}={})=>(await pg.query('select use_city_perk($1,$2,$3,$4,$5,$6) as result',[email,deal,bid,index,id,commit])).rows[0].result;
test('checking does not redeem; single use is per card and retry-safe',async()=>{
 assert.equal((await use({commit:false})).redeemed,false);const id=crypto.randomUUID();await use({id});assert.equal((await use({id})).alreadyRecorded,true);await assert.rejects(use(),/already been used/);await use({index:3});assert.equal((await pg.query('select count(*)::int n from city_perk_redemptions')).rows[0].n,2);
});
test('unlimited offers allow separate visits but deduplicate the same request',async()=>{
 const id=crypto.randomUUID();await use({deal:unlimited,id});await use({deal:unlimited,id});await use({deal:unlimited});assert.equal((await pg.query('select count(*)::int n from city_perk_redemptions where deal_id=$1',[unlimited])).rows[0].n,2);
});
test('only the approved merchant can redeem its active offers',async()=>{
 await assert.rejects(use({email:'other@example.invalid'}),/Approved/);await assert.rejects(use({deal:foreign}),/unavailable/);
 await pg.query('update merchant_access set is_active=false');await assert.rejects(use({deal:unlimited}),/Approved/);await pg.query('update merchant_access set is_active=true');
 await pg.query('update deals set is_active=false where id=$1',[unlimited]);await assert.rejects(use({deal:unlimited}),/unavailable/);await pg.query('update deals set is_active=true where id=$1',[unlimited]);
});
test('half/free/cancelled/unpaid/wrong-date cards fail; perk hours are separate from transport',async()=>{
 for(const index of [1,2])await assert.rejects(use({deal:unlimited,index}),/full-price/);
 booking.passengers[0].cancelledAt=new Date().toISOString();await save();await assert.rejects(use({deal:unlimited}),/full-price/);delete booking.passengers[0].cancelledAt;
 booking.paymentStatus='unpaid';await save();await assert.rejects(use({deal:unlimited}),/not active/);booking.paymentStatus='paid';booking.selectedDate='2099-01-01';await save();await assert.rejects(use({deal:unlimited}),/visit date/);booking.selectedDate=today;await save();await use({deal:unlimited});
});
test('customer history is owned and public roles have no redemption privileges',async()=>{
 assert.equal((await pg.query("select * from customer_perk_history('stranger@example.invalid')")).rows.length,0);assert.ok((await pg.query("select * from customer_perk_history('owner@example.invalid')")).rows.length);
 await pg.exec('set role authenticated');await assert.rejects(pg.query('select * from merchant_access'),/permission denied/);await assert.rejects(use({deal:unlimited}),/permission denied/);await pg.exec('reset role');
});
test('API requires verified identity and merchants cannot grant access',async()=>{
 const db={auth:{getUser:async token=>({data:{user:token==='merchant'?{email:'merchant@example.invalid',email_confirmed_at:'2026-01-01',app_metadata:{}}:null},error:null})}};
 const app=new Hono();app.use('/make-server-3bd0ade8/*',createAdminGuard(token=>db.auth.getUser(token)));installMerchantPerks(app,db);
 assert.equal((await app.request('/make-server-3bd0ade8/merchant/redeem',{method:'POST',body:'{}'})).status,401);
 assert.equal((await app.request('/make-server-3bd0ade8/admin/merchant-access',{method:'POST',headers:{Authorization:'Bearer merchant'},body:'{}'})).status,403);
});
test('customer offers exclude hidden training businesses',async()=>{
 const rows={merchants:[{id:'live',is_active:true,is_test:false},{id:'test',is_active:true,is_test:true}],deals:[{id:'real-offer',merchant_id:'live',is_active:true},{id:'test-offer',merchant_id:'test',is_active:true}]};
 const db={from(table){let data=rows[table];return {select(){return this;},eq(key,value){data=data.filter(row=>row[key]===value);return this;},then(resolve){return Promise.resolve({data,error:null}).then(resolve);}};}};
 const app=new Hono();installMerchantPerks(app,db);
 const body=await (await app.request('/make-server-3bd0ade8/perks/offers')).json();
 assert.deepEqual(body.offers.map(o=>o.id),['real-offer']);
});
test('merchant API redeems a paid card once, rejects a second scan, and records owned usage',async()=>{
 const dealId=crypto.randomUUID();
 await pg.query('insert into deals(id,merchant_id,title,is_single_use) values($1,$2,$3,true)',[dealId,m,'Single-use bakery test']);
 const db={
  auth:{getUser:async token=>({data:{user:['merchant','owner'].includes(token)?{email:token==='merchant'?'merchant@example.invalid':'owner@example.invalid',email_confirmed_at:'2026-01-01'}:null},error:null})},
  async rpc(name,p){try{
   if(name==='use_city_perk')return {data:(await pg.query('select use_city_perk($1,$2,$3,$4,$5,$6) result',[p.p_email,p.p_deal,p.p_booking,p.p_index,p.p_request,p.p_commit])).rows[0].result,error:null};
   if(name==='customer_perk_history')return {data:(await pg.query('select customer_perk_history($1) result',[p.p_email])).rows.map(r=>r.result),error:null};
   throw Error('Unexpected RPC');
  }catch(error){return {data:null,error};}}
 };
 const app=new Hono();installMerchantPerks(app,db);
 const post=(action,body)=>app.request('/make-server-3bd0ade8/merchant/'+action,{method:'POST',headers:{Authorization:'Bearer merchant','Content-Type':'application/json'},body:JSON.stringify(body)});
 const payload={dealId,qr:bid+'|0',requestId:crypto.randomUUID()};
 assert.equal((await (await post('check',payload)).json()).receipt.redeemed,false);
 assert.equal((await pg.query('select count(*)::int n from city_perk_redemptions where deal_id=$1',[dealId])).rows[0].n,0);
 const first=await post('redeem',payload);assert.equal(first.status,200);assert.equal((await first.json()).receipt.redeemed,true);
 const retry=await post('redeem',payload);assert.equal((await retry.json()).receipt.alreadyRecorded,true);
 const second=await post('redeem',{...payload,requestId:crypto.randomUUID()});assert.equal(second.status,409);assert.match((await second.json()).error,/already been used/);
 const history=await app.request('/make-server-3bd0ade8/customer/perks',{headers:{Authorization:'Bearer owner'}});
 assert.deepEqual((await history.json()).usage.filter(u=>u.dealId===dealId),[{cardId:bid+':0',dealId,uses:1}]);
 const otherCard=await post('redeem',{...payload,qr:bid+'|3',requestId:crypto.randomUUID()});assert.equal(otherCard.status,200);
});
test('sales-only profile cannot scan or redeem; revocation takes effect in the database',async()=>{
 await pg.query('update merchant_access set can_scan=false');
 await assert.rejects(use({deal:unlimited,commit:false}),/Approved/);
 await assert.rejects(use({deal:unlimited}),/Approved/);
 await pg.query('update merchant_access set can_scan=true');
 assert.equal((await use({deal:unlimited,commit:false})).redeemed,false);
});
test.after(()=>pg.close());
test('admin updates preserve omitted permissions and explicitly change selected functions',async()=>{
 let row={can_scan:false,can_sell:false,display_name:'Staff'};
 const db={from(){return {select(){return this;},eq(){return this;},maybeSingle:async()=>({data:row,error:null}),upsert:async value=>{row={...row,...value};return {data:row,error:null};}};}};
 const app=new Hono();app.use('/make-server-3bd0ade8/*',createAdminGuard(async token=>({data:{user:token==='admin'?{app_metadata:{role:'admin'}}:null},error:null})));installMerchantPerks(app,db);
 const update=async changes=>app.request('/make-server-3bd0ade8/admin/merchant-access',{method:'POST',headers:{Authorization:'Bearer admin'},body:JSON.stringify({email:'staff@example.invalid',merchantId:m,active:true,...changes})});
 assert.equal((await update({canSell:true})).status,200);assert.equal(row.can_scan,false);assert.equal(row.can_sell,true);
 await update({canScan:true,canSell:false,name:'New name'});assert.equal(row.can_scan,true);assert.equal(row.can_sell,false);assert.equal(row.display_name,'New name');
});


