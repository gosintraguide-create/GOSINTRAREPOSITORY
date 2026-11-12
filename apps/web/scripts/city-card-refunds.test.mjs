import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCityRefund} from '../../../supabase/functions/make-server-3bd0ade8/city-card-refunds.ts';
const job=()=>({id:crypto.randomUUID(),state:'pending',payment_intent:'pi_fixture',amount_cents:750,created_at:new Date().toISOString()});
test('refund uses original amount and stable key; lost database acknowledgement is safe to retry',async()=>{
 const j=job(),keys=new Map();let created=0;
 const stripe={refunds:{create:async(body,options)=>{assert.equal(body.amount,750);assert.equal(body.payment_intent,'pi_fixture');if(!keys.has(options.idempotencyKey)){created++;keys.set(options.idempotencyKey,{id:'re_fixture',payment_intent:body.payment_intent,amount:body.amount,currency:'eur',metadata:body.metadata,status:'succeeded'});}return keys.get(options.idempotencyKey);}}};
 await assert.rejects(reconcileCityRefund(j,stripe,async()=>{throw Error('Database unavailable');}));
 await reconcileCityRefund(j,stripe,async v=>Object.assign(j,v));assert.equal(created,1);assert.equal(j.state,'succeeded');
});
test('pending refunds are retrieved; rejected refunds remain visible without a second charge attempt',async()=>{
 const j={...job(),stripe_refund_id:'re_fixture',state:'submitted'};let creates=0;
 await reconcileCityRefund(j,{refunds:{create:async()=>{creates++;},retrieve:async()=>({id:'re_fixture',payment_intent:j.payment_intent,amount:750,currency:'eur',metadata:{cityRefundId:j.id},status:'failed'})}},async v=>Object.assign(j,v));
 assert.equal(j.state,'failed');assert.equal(creates,0);
});
test('ambiguous old requests go to review instead of reusing an expired idempotency key',async()=>{
 const j={...job(),created_at:'2000-01-01T00:00:00Z'};await reconcileCityRefund(j,{},async v=>Object.assign(j,v));assert.equal(j.state,'review');
});
test('network errors preserve pending intent and mismatched refund cannot be marked successful',async()=>{
 const j=job();await assert.rejects(reconcileCityRefund(j,{refunds:{create:async()=>{throw Error('Network');}}},async()=>assert.fail()));assert.equal(j.state,'pending');
 await assert.rejects(reconcileCityRefund(j,{refunds:{create:async()=>({id:'re_bad',payment_intent:'pi_other',amount:750,currency:'eur',metadata:{cityRefundId:j.id},status:'succeeded'})}},async()=>assert.fail()),/verification/);
});
