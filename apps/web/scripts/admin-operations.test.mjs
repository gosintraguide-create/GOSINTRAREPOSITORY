import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Hono} from 'hono';
import {PGlite} from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {installStaffCardSales} from '../../../supabase/functions/make-server-3bd0ade8/staff-card-sales.ts';
import {installAdminOperations} from '../../../supabase/functions/make-server-3bd0ade8/admin-operations.ts';
import {installCityCards} from '../../../supabase/functions/make-server-3bd0ade8/city-cards.ts';
const pg=new PGlite();await pg.exec('create role anon;create role authenticated;create role service_role;create table kv_store_3bd0ade8(key text primary key,value jsonb);');
for(const file of ['20260918010000_atomic_day_pass_booking.sql','20260918011000_atomic_tour_sunset.sql','20260918013000_checkout_holds.sql','20261103010000_city_card_daily_inventory.sql','20261104010000_city_card_cancellations.sql','20261105010000_merchant_perks.sql','20261105011000_hidden_test_merchants.sql','20261105012000_staff_city_card_sales.sql','20261105014000_admin_operations.sql'])await pg.exec(await readFile(new URL('../../../supabase/migrations/'+file,import.meta.url),'utf8'));
const get=async key=>key==='pricing_config'?{basePrice:15}:(await pg.query('select value from kv_store_3bd0ade8 where key=$1',[key])).rows[0]?.value;
const callRpc=async(name,args)=>{const values=Object.values(args);return (await pg.query(`select ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values.map(v=>v&&typeof v==='object'?JSON.stringify(v):v))).rows.map(r=>r.result);};
const users=Object.fromEntries(['driver','other','merchant','customer'].map(role=>[role,{id:crypto.randomUUID(),email:role+'@example.invalid',email_confirmed_at:'2026-01-01'}]));
users.admin={id:crypto.randomUUID(),app_metadata:{role:'admin'}};
const db={auth:{getUser:async token=>({data:{user:users[token]||null},error:null})},rpc:async(name,args)=>{try{const rows=await callRpc(name,args);return {data:name==='customer_day_passes'?rows:rows[0],error:null};}catch(error){return {data:null,error};}},
 from(table){assert.ok(['staff_card_sales','city_card_orders','merchant_access','merchants','city_card_refunds'].includes(table));let filters=[],args=[],sort='',limit='',update,single=false;
  const b={select(){return b;},eq(k,v){filters.push(`${k}=$${args.push(v)}`);return b;},lte(k,v){filters.push(`${k}<=$${args.push(v)}`);return b;},order(k,o){sort=` order by ${k} ${o?.ascending===false?'desc':'asc'}`;return b;},limit(n){limit=` limit ${n}`;return b;},single(){single=true;return b;},maybeSingle(){single=true;return b;},update(v){update=v;return b;},async then(resolve){try{const sql=update?`update ${table} set ${Object.entries(update).map(([k,v])=>`${k}=$${args.push(v)}`).join(',')} where ${filters.join(' and ')} returning *`:`select * from ${table} where ${filters.join(' and ')||'true'}${sort}${limit}`;const rows=(await pg.query(sql,args)).rows;resolve({data:single?rows[0]:rows,error:null});}catch(error){resolve({data:null,error});}}};return b;
 }};
let failEmail=true,sends=0;const app=new Hono();
installStaffCardSales(app,{db,get,staff:async token=>['driver','other'].includes(token)?{role:'driver',driverId:token,name:token}:null,qr:async(id,i)=>`QR:${id}|${i}`,send:async()=>{sends++;return failEmail?{success:false,error:'Temporary email failure'}:{success:true};}});
installCityCards(app,{db,get,stripe:{checkout:{sessions:{create(){throw Error('Offline sale must never create Stripe checkout');}}}},qr:async()=>'',returnUrl:'https://example.invalid'});
installAdminOperations(app,{db,get,stripe:{},send:async()=>({success:true}),reconcile:async()=>{throw Error('Unexpected reconciliation');}});
const call=async(path,body,token='driver')=>{const r=await app.request('/make-server-3bd0ade8'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
const date='2099-07-01',travellers=[{name:'Full',ageBand:'full'},{name:'Half',ageBand:'half'},{name:'Free',ageBand:'free'}];
let bookingId,requestId,quote;
test('admin cancellation handles all cards and creates refund obligations, without generic status bypass',async()=>{
 requestId=crypto.randomUUID();const reserved=await call('/staff/cards/reserve',{requestId,date,timeSlot:'9:00',email:users.customer.email,travellers,expectedAmountCents:2250});assert.equal(reserved.status,200);
 const paid=await call(`/staff/cards/${requestId}/confirm`,{paymentReceived:true,method:'cash'});assert.equal(paid.status,200);bookingId=paid.sale.bookingId;
 await assert.rejects(callRpc('set_day_pass_status',{id:bookingId,status:'cancelled'}),/cancellation and refund/);
 await assert.rejects(callRpc('set_day_pass_status',{id:bookingId,status:'completed'}),/cancellation and refund/);
 const response=await call('/admin/operations/quote',{bookingId,index:-1,serviceFailure:false},'admin');assert.equal(response.status,200);quote=response.quote;assert.equal(quote.cards.length,3);assert.equal(quote.totalCents,2250);
 const args={id:crypto.randomUUID(),email:users.customer.email,booking:bookingId,index:-1,fingerprint:quote.fingerprint,actor:users.driver.id,reason:'Customer requested cancellation',override:false};
 const body={requestId:args.id,bookingId,index:-1,fingerprint:quote.fingerprint,reason:args.reason,serviceFailure:false};
 assert.equal((await call('/admin/operations/cancel',body,'customer')).success,false);
 assert.equal((await call('/admin/operations/cancel',body,'admin')).status,200);
 assert.equal((await call('/admin/operations/cancel',body,'admin')).status,200);
 assert.equal((await pg.query('select actor from admin_activity')).rows[0].actor,users.admin.id);
 assert.equal((await pg.query('select count(*)::int n from city_card_refunds')).rows[0].n,1);
 assert.equal((await pg.query('select count(*)::int n from admin_activity')).rows[0].n,1);
 const finance=(await callRpc('admin_city_card_finances',{}))[0];assert.equal(finance.grossCents,2250);assert.equal(finance.refundedCents,0);assert.equal(finance.outstandingCents,2250);
});
test('manual settlement records the refund once and updates net receipts',async()=>{
 const job=(await pg.query('select * from city_card_refunds')).rows[0];
 await assert.rejects(callRpc('settle_offline_refund',{id:job.id,actor:users.driver.id,reference:''}),/reference/);
 const body={action:'settle',paid:true,reference:'Cash receipt 123'};
 assert.equal((await call('/admin/operations/refund/'+job.id,body,'admin')).status,200);
 assert.equal((await call('/admin/operations/refund/'+job.id,body,'admin')).status,200);
 assert.equal((await pg.query('select settled_by from city_card_refunds where id=$1',[job.id])).rows[0].settled_by,users.admin.id);
 const finance=(await callRpc('admin_city_card_finances',{}))[0];assert.equal(finance.refundedCents,2250);assert.equal(finance.outstandingCents,0);
 assert.equal((await pg.query("select count(*)::int n from admin_activity where action='settle_offline_refund'")).rows[0].n,1);
});
test('service failure override is explicit; normal customer and admin cutoffs remain',async()=>{
 const id=crypto.randomUUID(),bid='CC-'+id.toUpperCase(),purchase={product:'city-card-v1',selectedDate:'2000-01-01',timeSlot:'9:00',contactInfo:{email:users.customer.email},passengers:[{name:'Past visit',ageBand:'full',priceCents:1500,type:'Adult'}],paymentQuote:{amountCents:1500}};
 await pg.query("insert into city_card_orders(id,owner_id,email,purchase,state,booking_id) values($1,$2,$3,$4,'paid',$5)",[id,users.customer.id,users.customer.email,JSON.stringify(purchase),bid]);
 await pg.query('insert into kv_store_3bd0ade8 values($1,$2)',[bid,JSON.stringify({...purchase,id:bid,status:'confirmed',paymentStatus:'paid',paymentIntentId:'pi_fixture'})]);
 await assert.rejects(callRpc('city_card_cancel_quote',{email:users.customer.email,booking:bid,index:0}),/23:59/);
 await assert.rejects(callRpc('admin_city_card_quote',{email:users.customer.email,booking:bid,index:0,override:false}),/23:59/);
 const q=(await callRpc('admin_city_card_quote',{email:users.customer.email,booking:bid,index:0,override:true}))[0];
 const args={id:crypto.randomUUID(),email:users.customer.email,booking:bid,index:0,fingerprint:q.fingerprint,actor:users.driver.id,reason:'Service could not be provided',override:true};await callRpc('admin_cancel_city_cards',args);
 const job=(await pg.query('select * from city_card_refunds where booking_id=$1',[bid])).rows[0];assert.equal(job.state,'pending');assert.equal(job.amount_cents,1500);
 await assert.rejects(callRpc('settle_offline_refund',{id:job.id,actor:users.driver.id,reference:'Wrong channel'}),/Only offline/);
});
test('public database roles cannot call admin override or read audit records',async()=>{
 await pg.exec('set role authenticated');await assert.rejects(callRpc('admin_city_card_finances',{}),/permission denied/);await assert.rejects(pg.query('select * from admin_activity'),/permission denied/);await assert.rejects(callRpc('admin_city_card_quote',{email:users.customer.email,booking:bookingId,index:0,override:true}),/permission denied/);await pg.exec('reset role');
});
test.after(()=>pg.close());

