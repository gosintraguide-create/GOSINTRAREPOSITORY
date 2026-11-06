import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Hono} from 'hono';
import {PGlite} from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
import {installCityCards} from '../../../supabase/functions/make-server-3bd0ade8/city-cards.ts';
import {cityCardPrice,quoteCityCards,verifyCitySession,validVisitDate,cityBoardingError} from '../../../supabase/functions/make-server-3bd0ade8/city-card-product.ts';
import {createAdminGuard} from '../../../supabase/functions/make-server-3bd0ade8/admin-auth.ts';
const pg=new PGlite();
await pg.exec('create role anon;create role authenticated;create role service_role;create table kv_store_3bd0ade8(key text primary key,value jsonb not null);');
for(const file of ['20260918010000_atomic_day_pass_booking.sql','20260918011000_atomic_tour_sunset.sql','20260918013000_checkout_holds.sql','20261103010000_city_card_daily_inventory.sql','20261104010000_city_card_cancellations.sql'])await pg.exec(await readFile(new URL('../../../supabase/migrations/'+file,import.meta.url),'utf8'));
const put=(key,value)=>pg.query('insert into kv_store_3bd0ade8 values($1,$2) on conflict(key) do update set value=excluded.value',[key,JSON.stringify(value)]);
const get=async key=>(await pg.query('select value from kv_store_3bd0ade8 where key=$1',[key])).rows[0]?.value;
const query=async(name,args)=>{const values=Object.values(args);return (await pg.query(`select ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) as value`,values.map(v=>v&&typeof v==='object'?JSON.stringify(v):v))).rows;};
const rpc=async(name,args)=>{try{const rows=await query(name,args);return {data:name==='customer_day_passes'?rows.map(r=>r.value):rows[0].value,error:null};}catch(e){return {data:null,error:{message:e.message}};}};
const user={id:'00000000-0000-4000-8000-000000000001',email:'customer@example.invalid',email_confirmed_at:'2026-01-01',user_metadata:{full_name:'Customer Test'}};
const other={...user,id:'00000000-0000-4000-8000-000000000002',email:'other@example.invalid'};
const users={customer:user,other,unverified:{...user,email_confirmed_at:null},admin:{...user,app_metadata:{role:'admin'}}};
const db={auth:{getUser:async token=>({data:{user:users[token]},error:null})},rpc,
  from(table){assert.ok(['city_card_orders','city_card_refunds'].includes(table));let filters=[],args=[],sort='',limit='',update=null,single=false;
    const builder={select(){return builder;},update(value){update=value;return builder;},eq(key,value){filters.push(`${key}=$${args.push(value)}`);return builder;},lte(key,value){filters.push(`${key}<=$${args.push(value)}`);return builder;},order(key,options){sort=` order by ${key} ${options?.ascending===false?'desc':'asc'}`;return builder;},limit(value){limit=` limit ${value}`;return builder;},maybeSingle(){single=true;return builder;},async then(resolve,reject){try{let sql;if(update){const sets=Object.entries(update).map(([k,v])=>`${k}=$${args.push(v)}`);sql=`update ${table} set ${sets} where ${filters.join(' and ')} returning *`;}else sql=`select * from ${table} where ${filters.join(' and ')||'true'}${sort}${limit}`;const result=await pg.query(sql,args);resolve({data:single?result.rows[0]||null:result.rows,error:null});}catch(e){if(reject)reject(e);else resolve({data:null,error:e});}}};return builder;}};
const sessions=new Map(),keys=new Map();let failRetrieve=false,racePaid=false,creationCount=0,failCreation=false;
const stripe={checkout:{sessions:{async create(body,options){if(failCreation)throw Error('Network unavailable');if(keys.has(options.idempotencyKey))return structuredClone(sessions.get(keys.get(options.idempotencyKey)));creationCount++;const id='cs_test_'+crypto.randomUUID(),s={...body,id,url:'https://checkout.stripe.com/c/pay/'+id,status:'open',payment_status:'unpaid',currency:'eur',amount_total:body.line_items[0].price_data.unit_amount,payment_intent:'pi_'+id};sessions.set(id,s);keys.set(options.idempotencyKey,id);return structuredClone(s);},async retrieve(id){if(failRetrieve)throw Error('Network unavailable');assert.ok(sessions.has(id));return structuredClone(sessions.get(id));},async expire(id){const s=sessions.get(id);if(racePaid){s.status='complete';s.payment_status='paid';throw Error('Already completed');}s.status='expired';return structuredClone(s);}}}};
const app=new Hono();app.use('/make-server-3bd0ade8/*',createAdminGuard(token=>db.auth.getUser(token)));
const service=installCityCards(app,{db,stripe,get,qr:async(id,index)=>`QR:${id}|${index}`,returnUrl:'https://example.invalid/return'});
const call=async(path,body,token='customer',method=body?'POST':'GET')=>{const response=await app.request('http://local/make-server-3bd0ade8'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,...await response.json()};};
const date='2099-06-01',full={name:'Customer Test',ageBand:'full'},child={name:'Child',ageBand:'half'},free={name:'Small Child',ageBand:'free'};
const config={basePrice:15,childPrice:999};await put('pricing_config',config);
const slotStock=capacity=>Object.fromEntries(['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'].map(slot=>[slot,capacity]));
const setDay=async(d,capacity)=>query('set_day_pass_day',{p_date:d,p_capacity:capacity,p_opens:'09:00',p_closes:'19:30',p_slots:slotStock(capacity)});
const inventory=async(d=date)=>(await query('day_pass_inventory',{p_date:d}))[0].value;
const checkout=(d,travellers=[full],token='customer',id=crypto.randomUUID())=>call('/customer/city-cards/checkout',{requestId:id,date:d,timeSlot:'9:00',travellers,expectedAmountCents:travellers.reduce((n,p)=>n+({full:1500,half:750,free:0})[p.ageBand],0)},token);

test('server quote ignores submitted pricing/identity and enforces date and age categories',()=>{
 assert.deepEqual(cityCardPrice(config),{full:1500,half:750,free:0});
 const quote=quoteCityCards({date,timeSlot:'9:00',travellers:[full,child,free],totalPrice:0,email:'attacker@example.invalid'},user,config,{configured:true,date,opens:'09:00',closes:'19:30',slots:slotStock(4)});
 assert.equal(quote.totalPrice,22.5);assert.equal(quote.contactInfo.email,user.email);assert.equal(quote.passengers[2].tukTukAllowed,false);assert.equal(quote.passengers[1].perks,false);
 for(const bad of ['2099-02-30','2099-99-99','x'])assert.equal(validVisitDate(bad),false);
 assert.throws(()=>cityCardPrice({basePrice:0}));assert.throws(()=>quoteCityCards({date,travellers:[{...full,ageBand:'adult'}]},user,config,{configured:true,date}));
});
test('default dates retain 50 per slot and 400 per day; admin identity is required for changes',async()=>{
 assert.equal((await inventory()).customized,false);assert.equal((await inventory()).capacity,400);assert.equal((await inventory()).slots['9:00'].remaining,50);
 const path='/admin/day-capacity/'+date,body={capacity:4,opens:'09:00',closes:'19:30',slots:slotStock(4)};
 assert.equal((await call(path,body,'customer','PUT')).status,403);
 assert.equal((await call(path,body,'admin','PUT')).status,200);
 for(const token of ['unverified','missing'])assert.equal((await call('/customer/city-cards',undefined,token)).status,401);
});
let first;
test('family hold counts every age, blocks competing app and website/staff sales, and retries are idempotent',async()=>{
 const id=crypto.randomUUID();first=await checkout(date,[full,child,free],'customer',id);assert.equal(first.status,200,JSON.stringify(first));
 assert.equal((await inventory()).reserved,3);assert.equal((await inventory()).remaining,1);
 assert.notEqual((await checkout(date,[full,child],'other')).status,200);
 const b={id:'WEB-1',selectedDate:date,timeSlot:'15:00',passengers:[{},{}],paymentStatus:'paid'};
 assert.ok((await rpc('commit_day_pass',{p_booking:b,p_payment_id:null})).error);
 assert.equal((await checkout(date,[full,child,free],'customer',id)).order.id,id);assert.equal(creationCount,1);
 assert.notEqual((await checkout(date,[full,child,free],'other',id)).status,200);
 await assert.rejects(setDay(date,2),/lower than booked/);
 await assert.rejects(query('set_day_pass_day',{p_date:date,p_capacity:4,p_opens:'10:00',p_closes:'19:30'}),/shorten/);
});
test('unpaid or wrongly priced sessions cannot issue cards; paid checkout issues once and links by verified email',async()=>{
 let wallet=await call('/customer/city-cards');assert.equal(wallet.cards.length,0);
 const s=[...sessions.values()][0];const o=(await pg.query('select * from city_card_orders where id=$1',[first.order.id])).rows[0];
 assert.throws(()=>verifyCitySession({...s,status:'complete',payment_status:'paid',amount_total:1},o));
 s.status='complete';s.payment_status='paid';
 await service.webhook({type:'checkout.session.completed',data:{object:s}});
 await service.webhook({type:'checkout.session.completed',data:{object:s}});
 wallet=await call('/customer/city-cards');assert.equal(wallet.cards.length,3);assert.equal(wallet.cards[0].qr.startsWith('QR:CC-'),true);
 assert.equal((await inventory()).reserved,0);assert.equal((await inventory()).booked,3);
 assert.equal((await call('/customer/city-cards',undefined,'other')).cards.length,0);
 assert.equal((await checkout(date,[free])).status,200);assert.equal((await inventory()).booked,4);
 assert.equal((await call('/customer/city-cards')).cards.length,4);
});
test('child-only purchase without a full-price companion is rejected',async()=>{
 const d='2099-06-02';await setDay(d,3);assert.notEqual((await checkout(d,[child,free])).status,200);assert.equal((await inventory(d)).reserved,0);
});
test('expired reservation is retained on Stripe failure; safe cancellation releases stock',async()=>{
 const d='2099-06-03';await setDay(d,2);const r=await checkout(d);assert.equal(r.status,200);
 await pg.query("update city_card_orders set expires_at=now()-interval '1 minute' where id=$1",[r.order.id]);
 failRetrieve=true;await service.cleanup();assert.equal((await inventory(d)).reserved,1);
 failRetrieve=false;await service.cleanup();assert.equal((await inventory(d)).reserved,0);
 assert.equal((await pg.query('select state from city_card_orders where id=$1',[r.order.id])).rows[0].state,'expired');
});
test('cancellation racing successful payment issues cards instead of releasing their seats',async()=>{
 const d='2099-06-04';await setDay(d,1);const r=await checkout(d);racePaid=true;
 const result=await call('/customer/city-cards/orders/'+r.order.id+'/cancel',{});racePaid=false;
 assert.equal(result.order.state,'paid');assert.equal((await inventory(d)).booked,1);assert.equal((await inventory(d)).reserved,0);
});
test('session creation failure is recoverable without duplicate reservation',async()=>{
 const d='2099-06-05';await setDay(d,1);failCreation=true;const id=crypto.randomUUID();assert.notEqual((await checkout(d,[full],'customer',id)).status,200);assert.equal((await inventory(d)).reserved,1);
 failCreation=false;const resumed=await checkout(d,[full],'customer',id);assert.equal(resumed.status,200);assert.equal((await inventory(d)).reserved,1);
 assert.notEqual((await call('/customer/city-cards/orders/'+id+'/cancel',{},'other')).status,200);
 assert.equal((await call('/customer/city-cards/orders/'+id+'/cancel',{})).order.state,'expired');
});
test('public database roles cannot read inventory/order tables or execute service RPCs',async()=>{
 await pg.exec('set role anon');
 for(const sql of ['select * from city_card_orders','select * from day_pass_days',"select day_pass_inventory('2099-06-01')","select customer_day_passes('customer@example.invalid')"])await assert.rejects(pg.query(sql),/permission denied/);
 await pg.exec('reset role');
});
test('slot limit and daily ceiling both apply, regardless of departure slot',async()=>{
 const d='2099-07-01';await query('set_day_pass_day',{p_date:d,p_capacity:3,p_opens:'09:00',p_closes:'19:30',p_slots:{...slotStock(0),'9:00':1,'10:00':3}});
 const a=await checkout(d,[full,child]);assert.notEqual(a.status,200);assert.match(a.error,/time slot/);
 const b=await checkout(d);assert.equal(b.status,200);
 const held=await inventory(d);assert.equal(held.slots['9:00'].remaining,0);assert.equal(held.slots['10:00'].remaining,2);
 await assert.rejects(query('set_day_pass_day',{p_date:d,p_capacity:3,p_opens:'09:00',p_closes:'19:30',p_slots:slotStock(0)}),/Slot capacity/);
 await call('/customer/city-cards/orders/'+b.order.id+'/cancel',{});
 assert.equal((await inventory(d)).slots['9:00'].remaining,1);
 const purchase={id:'SLOT-LAST',selectedDate:d,timeSlot:'10:00',passengers:[{},{},{}],paymentStatus:'paid',status:'confirmed'};
 await query('commit_day_pass',{p_booking:purchase,p_payment_id:'pi_slot'});
 assert.equal((await inventory(d)).remaining,0);assert.equal((await inventory(d)).slots['9:00'].remaining,0);
 await query('set_day_pass_status',{p_id:purchase.id,p_status:'cancelled'});assert.equal((await inventory(d)).remaining,3);
 await query('set_day_pass_status',{p_id:purchase.id,p_status:'cancelled'});assert.equal((await inventory(d)).slots['10:00'].capacity,3);
});
test('City Card boarding checks Lisbon date, hours, cancellation and passenger index',()=>{
 const booking={product:'city-card-v1',selectedDate:'2099-01-02',status:'confirmed',paymentStatus:'paid',passengers:[full],transportHours:{opens:'09:00',closes:'19:30'}};
 assert.equal(cityBoardingError(booking,0,new Date('2099-01-02T19:29:00Z')),null);
 assert.match(cityBoardingError(booking,0,new Date('2099-01-02T19:30:00Z')),/outside/);
 assert.match(cityBoardingError(booking,1,new Date('2099-01-02T10:00:00Z')),/Invalid/);
 assert.match(cityBoardingError({...booking,status:'cancelled'},0,new Date('2099-01-02T10:00:00Z')),/not active/);
 assert.match(cityBoardingError(booking,0,new Date('2099-01-03T10:00:00Z')),/visit date/);
});
test.after(()=>pg.close());


test('partial cancellation is owned, server priced, idempotent and preserves other QR indexes',async()=>{
 const booking=first.order.id, bid='CC-'+booking.toUpperCase();
 const quote=await call('/customer/city-cards/cancellation-quote',{bookingId:bid,index:1});assert.equal(quote.status,200,JSON.stringify(quote));assert.equal(quote.quote.totalCents,750);assert.equal(quote.quote.cards.length,1);
 assert.notEqual((await call('/customer/city-cards/cancellation-quote',{bookingId:bid,index:1},'other')).status,200);
 const body={requestId:crypto.randomUUID(),bookingId:bid,index:1,fingerprint:quote.quote.fingerprint};
 assert.notEqual((await call('/customer/city-cards/cancellations',{...body,fingerprint:'fake'})).status,200);
 const before=await inventory();assert.equal((await call('/customer/city-cards/cancellations',body)).status,200);
 assert.equal((await call('/customer/city-cards/cancellations',body)).status,200);
 assert.equal((await inventory()).booked,before.booked-1);
 const wallet=await call('/customer/city-cards');assert.equal(wallet.cards.find(c=>c.id===bid+':1').status,'cancelled');assert.equal(wallet.cards.find(c=>c.id===bid+':1').qr,null);assert.ok(wallet.cards.find(c=>c.id===bid+':2').qr);
 const b=await get(bid);assert.match(cityBoardingError(b,1,new Date(date+'T10:00:00Z')),/cancelled/);
 await assert.rejects(query('set_day_pass_status',{p_id:bid,p_status:'confirmed'}),/cannot be restored/);
});
test('last companion cancellation explicitly includes children across orders and releases all places once',async()=>{
 const bid='CC-'+first.order.id.toUpperCase();
 const q=await call('/customer/city-cards/cancellation-quote',{bookingId:bid,index:0});assert.equal(q.quote.cards.length,3);assert.equal(q.quote.totalCents,1500);assert.equal(q.quote.includesChildren,true);
 const body={requestId:crypto.randomUUID(),bookingId:bid,index:0,fingerprint:q.quote.fingerprint};
 assert.equal((await call('/customer/city-cards/cancellations',body)).status,200);assert.equal((await inventory()).booked,0);
 assert.equal((await inventory()).slots['9:00'].remaining,4);
 assert.equal((await call('/customer/city-cards/cancellations',body)).status,200);assert.equal((await inventory()).slots['9:00'].remaining,4);
 assert.notEqual((await checkout(date,[free])).status,200);
});
test('cancellation cutoff rejects visit day and public roles cannot call cancellation RPCs',async()=>{
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const bid='CUTOFF';await put(bid,{id:bid,product:'city-card-v1',status:'confirmed',paymentStatus:'paid',selectedDate:today,contactInfo:{email:user.email},passengers:[full]});
 const result=await call('/customer/city-cards/cancellation-quote',{bookingId:bid,index:0});assert.match(result.error,/23:59/);
 await pg.exec('set role authenticated');await assert.rejects(pg.query('select * from city_card_refunds'),/permission denied/);await assert.rejects(pg.query("select city_card_cancel_quote('x','x',0)"),/permission denied/);await pg.exec('reset role');
});
