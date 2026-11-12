import test from 'node:test';
import assert from 'node:assert/strict';
import {Hono} from 'hono';
import {installAdminOperations} from '../../../supabase/functions/make-server-3bd0ade8/admin-operations.ts';

function fixture({overview=false,failTable=null}={}) {
  const calls=[];
  const order={id:'order',state:'paid',booking_id:'CC-fixture'};
  const db={
    auth:{getUser:async token=>({data:{user:token==='admin'?{id:'verified-admin',app_metadata:{role:'admin'}}:token==='spoof'?{id:'customer',user_metadata:{role:'admin'}}:null}})},
    rpc:async(name,args)=>{calls.push({name,args});return {data:{},error:null};},
    from(table){
      calls.push({table});
      const q={select(){return q;},eq(){return q;},single(){return q;},order(){return q;},limit(){return q;},or(value){calls.push({filter:value});return q;},in(key,values){calls.push({table,key,values});return q;},update(value){calls.push({update:value});return q;},insert(value){calls.push({insert:value});return q;},then(resolve){
        const rows={city_card_orders:[order],staff_card_sales:[{id:'order',payment_method:'terminal',email_sent_at:'2026-11-05'}],kv_store_3bd0ade8:[{key:'CC-fixture',status:'confirmed',passengers:[]}],city_card_refunds:[],admin_activity:[],city_perk_redemptions:[]};
        resolve({data:overview?rows[table]:table==='city_card_orders'?order:{id:'refund'},error:table===failTable?{message:'Database unavailable'}:null});
      }};
      return q;
    },
  };
  const app=new Hono();
  installAdminOperations(app,{db,stripe:{},get:async()=>({contactInfo:{email:'owner@example.invalid'},qrCodes:['qr']}),send:async(...args)=>{calls.push({send:args});return {success:true};},reconcile:async(...args)=>{calls.push({reconcile:args});}});
  return {calls,order,request:async(path,body,token='admin')=>{
    const response=await app.request('/make-server-3bd0ade8/admin/operations'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    return {status:response.status,body:await response.json()};
  }};
}

test('overview joins card validity and seller records for matching orders, including older search results',async()=>{
  const f=fixture({overview:true});
  const r=await f.request('?q=owner%40example.invalid');
  assert.equal(r.status,200);
  assert.equal(r.body.orders[0].booking.status,'confirmed');
  assert.equal(r.body.sales[0].payment_method,'terminal');
  assert.deepEqual(f.calls.find(c=>c.table==='staff_card_sales'&&c.key),{table:'staff_card_sales',key:'id',values:['order']});
  assert.ok(f.calls.some(c=>c.filter==='email.ilike.%owner@example.invalid%,booking_id.ilike.%owner@example.invalid%'));
});

test('overview fails visibly when a data source fails instead of reporting empty financial data',async()=>{
  const f=fixture({overview:true,failTable:'city_card_refunds'});
  const r=await f.request('');
  assert.equal(r.body.success,false);
  assert.equal(r.body.error,'Database unavailable');
});

for(const path of ['', '/quote','/cancel','/refund/refund','/order/order']) {
  test(`admin operations ${path||'overview'} rejects missing and spoofed identities before accessing data`,async()=>{
    const f=fixture();
    for(const token of ['', 'customer', 'spoof']) {
      const r=await f.request(path,path?{}:undefined,token);
      assert.equal(r.body.success,false);
      assert.notEqual(r.status,200);
    }
    assert.deepEqual(f.calls,[]);
  });
}
test('cancellation uses verified actor and stored customer email',async()=>{
  const f=fixture();
  const r=await f.request('/cancel',{bookingId:'CC-fixture',requestId:'request',index:0,fingerprint:'quote',reason:'Customer request',actor:'forged',email:'forged@example.invalid',serviceFailure:true});
  assert.equal(r.status,200);
  const rpc=f.calls.find(c=>c.name==='admin_cancel_city_cards');
  assert.equal(rpc.args.p_actor,'verified-admin');
  assert.equal(rpc.args.p_email,'owner@example.invalid');
  assert.equal(rpc.args.p_override,true);
});
test('offline refund settlement requires explicit confirmation',async()=>{
  const f=fixture();
  assert.equal((await f.request('/refund/refund',{action:'settle',reference:'receipt'})).body.success,false);
  assert.ok(!f.calls.some(c=>c.name==='settle_offline_refund'));
  assert.equal((await f.request('/refund/refund',{action:'settle',paid:true,reference:'receipt'})).status,200);
  assert.equal(f.calls.find(c=>c.name==='settle_offline_refund').args.p_actor,'verified-admin');
});
test('reservation release requires confirmation and delegates payment reconciliation',async()=>{
  const f=fixture();
  assert.equal((await f.request('/order/order',{action:'release'})).body.success,false);
  assert.ok(!f.calls.some(c=>c.reconcile));
  assert.equal((await f.request('/order/order',{action:'release',unpaid:true})).status,200);
  assert.deepEqual(f.calls.find(c=>c.reconcile).reconcile,[f.order,true]);
});
test('email requires issued cards and a delivery key; successful delivery updates both records',async()=>{
  const f=fixture(),requestId=crypto.randomUUID();
  f.order.state='held';
  assert.equal((await f.request('/order/order',{action:'email',requestId})).body.success,false);
  f.order.state='paid';
  assert.equal((await f.request('/order/order',{action:'email',requestId:'bad'})).body.success,false);
  assert.ok(!f.calls.some(c=>c.send));
  assert.equal((await f.request('/order/order',{action:'email',requestId})).status,200);
  assert.equal(f.calls.find(c=>c.send).send[2],`admin-ticket-order-${requestId}`);
  assert.equal(f.calls.filter(c=>c.update).length,2);
});
