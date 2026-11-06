import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Hono} from 'hono';
import {PGlite} from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {installStaffCardSales} from '../../../supabase/functions/make-server-3bd0ade8/staff-card-sales.ts';
import {installCityCards} from '../../../supabase/functions/make-server-3bd0ade8/city-cards.ts';
const pg=new PGlite();await pg.exec('create role anon;create role authenticated;create role service_role;create table kv_store_3bd0ade8(key text primary key,value jsonb);');
for(const file of ['20260918010000_atomic_day_pass_booking.sql','20260918011000_atomic_tour_sunset.sql','20260918013000_checkout_holds.sql','20261103010000_city_card_daily_inventory.sql','20261104010000_city_card_cancellations.sql','20261105010000_merchant_perks.sql','20261105011000_hidden_test_merchants.sql','20261105012000_staff_city_card_sales.sql'])await pg.exec(await readFile(new URL('../../../supabase/migrations/'+file,import.meta.url),'utf8'));
const get=async key=>key==='pricing_config'?{basePrice:15}:(await pg.query('select value from kv_store_3bd0ade8 where key=$1',[key])).rows[0]?.value;
const callRpc=async(name,args)=>{const values=Object.values(args);return (await pg.query(`select ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values.map(v=>v&&typeof v==='object'?JSON.stringify(v):v))).rows.map(r=>r.result);};
const users=Object.fromEntries(['driver','other','merchant','customer'].map(role=>[role,{id:crypto.randomUUID(),email:role+'@example.invalid',email_confirmed_at:'2026-01-01'}]));
const db={auth:{getUser:async token=>({data:{user:users[token]||null},error:null})},rpc:async(name,args)=>{try{const rows=await callRpc(name,args);return {data:name==='customer_day_passes'?rows:rows[0],error:null};}catch(error){return {data:null,error};}},
 from(table){assert.ok(['staff_card_sales','city_card_orders','merchant_access','merchants','city_card_refunds'].includes(table));let filters=[],args=[],sort='',limit='',update,single=false;
  const b={select(){return b;},eq(k,v){filters.push(`${k}=$${args.push(v)}`);return b;},lte(k,v){filters.push(`${k}<=$${args.push(v)}`);return b;},order(k,o){sort=` order by ${k} ${o?.ascending===false?'desc':'asc'}`;return b;},limit(n){limit=` limit ${n}`;return b;},single(){single=true;return b;},maybeSingle(){single=true;return b;},update(v){update=v;return b;},async then(resolve){try{const sql=update?`update ${table} set ${Object.entries(update).map(([k,v])=>`${k}=$${args.push(v)}`).join(',')} where ${filters.join(' and ')} returning *`:`select * from ${table} where ${filters.join(' and ')||'true'}${sort}${limit}`;const rows=(await pg.query(sql,args)).rows;resolve({data:single?rows[0]:rows,error:null});}catch(error){resolve({data:null,error});}}};return b;
 }};
let failEmail=true,sends=0;const app=new Hono();
installStaffCardSales(app,{db,get,staff:async token=>['driver','other'].includes(token)?{role:'driver',driverId:token,name:token}:null,qr:async(id,i)=>`QR:${id}|${i}`,send:async()=>{sends++;return failEmail?{success:false,error:'Temporary email failure'}:{success:true};}});
installCityCards(app,{db,get,stripe:{checkout:{sessions:{create(){throw Error('Offline sale must never create Stripe checkout');}}}},qr:async()=>'',returnUrl:'https://example.invalid'});
const call=async(path,body,token='driver')=>{const r=await app.request('/make-server-3bd0ade8'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
const date='2099-07-01',travellers=[{name:'Full',ageBand:'full'},{name:'Half',ageBand:'half'},{name:'Free',ageBand:'free'}];
let id=crypto.randomUUID(),bookingId;
test('staff reservation counts all ages, blocks overselling and cannot be issued by another seller',async()=>{
 await callRpc('set_day_pass_day',{date,capacity:3,opens:'09:00',closes:'19:30',slots:Object.fromEntries(Array.from({length:8},(_,i)=>[(i+9)+':00',3]))});
 const r=await call('/staff/cards/reserve',{requestId:id,date,timeSlot:'9:00',email:users.customer.email,customerName:'Family',travellers,expectedAmountCents:2250});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.sale.totalCents,2250);assert.equal(r.sale.state,'reserved');
 assert.equal((await callRpc('day_pass_inventory',{date}))[0].remaining,0);
 const full=await call('/staff/cards/reserve',{requestId:crypto.randomUUID(),date,timeSlot:'9:00',email:'other@example.invalid',travellers:[travellers[0]],expectedAmountCents:1500},'other');assert.equal(full.status,409);
 assert.equal((await call(`/staff/cards/${id}/confirm`,{paymentReceived:true,method:'cash'},'other')).status,409);
 assert.equal((await call('/city-cards/offer/'+date)).status,200);
});
test('payment confirmation issues once; email failure and retry never reissue; customer finds cards by verified email',async()=>{
 assert.equal((await call(`/staff/cards/${id}/confirm`,{paymentReceived:false,method:'cash'})).status,409);
 assert.equal((await call(`/staff/cards/${id}/confirm`,{paymentReceived:true,method:'terminal'})).status,409);
 const r=await call(`/staff/cards/${id}/confirm`,{paymentReceived:true,method:'terminal',reference:'TEST-RECEIPT'});assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.sale.state,'paid');assert.equal(r.sale.emailSent,false);bookingId=r.sale.bookingId;
 failEmail=false;const retry=await call(`/staff/cards/${id}/confirm`,{paymentReceived:true,method:'terminal',reference:'TEST-RECEIPT'});assert.equal(retry.sale.bookingId,bookingId);assert.equal(retry.sale.emailSent,true);
 await call(`/staff/cards/${id}/email`,{});assert.equal(sends,2);
 assert.equal((await get('driver_sales_driver')).length,1);assert.equal((await get('driver_activity_driver')).length,1);
 const wallet=await call('/customer/city-cards',undefined,'customer');assert.equal(wallet.status,200);assert.equal(wallet.cards.length,3);assert.equal(wallet.cards[2].ageBand,'free');
 assert.equal((await callRpc('day_pass_inventory',{date}))[0].booked,3);
});
test('offline cancellation releases seats once and creates manual refund review, never a Stripe refund',async()=>{
 const q=(await callRpc('city_card_cancel_quote',{email:users.customer.email,booking:bookingId,index:0}))[0];
 const args={id:crypto.randomUUID(),email:users.customer.email,booking:bookingId,index:0,fingerprint:q.fingerprint};await callRpc('cancel_city_cards',args);await callRpc('cancel_city_cards',args);
 const jobs=(await pg.query('select * from city_card_refunds')).rows;assert.equal(jobs.length,1);assert.equal(jobs[0].state,'review');assert.equal(jobs[0].payment_intent,null);assert.equal(jobs[0].amount_cents,2250);
 assert.equal((await callRpc('day_pass_inventory',{date}))[0].remaining,3);
});
test('merchant selling is opt-in and test businesses cannot issue real cards',async()=>{
 const m=crypto.randomUUID();await pg.query('insert into merchants(id,name) values($1,$2)',[m,'Shop']);await pg.query('insert into merchant_access(email,merchant_id) values($1,$2)',[users.merchant.email,m]);
 assert.equal((await call('/staff/cards/session',undefined,'merchant')).status,409);
 await pg.query('update merchant_access set can_sell=true');assert.equal((await call('/staff/cards/session',undefined,'merchant')).status,200);
 await pg.query('update merchants set is_test=true');assert.equal((await call('/staff/cards/session',undefined,'merchant')).status,409);
 assert.equal((await call('/staff/cards/session',undefined,'customer')).status,409);
});
test('expired holds cannot issue cards and public database roles cannot bypass sellers',async()=>{
 const next=crypto.randomUUID();const r=await call('/staff/cards/reserve',{requestId:next,date,timeSlot:'9:00',email:users.customer.email,travellers:[travellers[0]],expectedAmountCents:1500});assert.equal(r.status,200);
 await pg.query("update city_card_orders set expires_at=now()-interval '1 minute' where id=$1",[next]);
 assert.equal((await call(`/staff/cards/${next}/confirm`,{paymentReceived:true,method:'cash'})).status,409);
 await call('/staff/cards');assert.equal((await pg.query('select state from city_card_orders where id=$1',[next])).rows[0].state,'expired');
 await pg.exec('set role authenticated');await assert.rejects(pg.query('select * from staff_card_sales'),/permission denied/);await pg.exec('reset role');
});
test.after(()=>pg.close());

