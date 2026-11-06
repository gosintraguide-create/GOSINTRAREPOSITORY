// Refund intent is persisted by the cancellation transaction before contacting
// Stripe. A lost response must reuse the same key, never initiate another refund.
export async function reconcileCityRefund(job:any,stripe:any,save:(values:any)=>Promise<void>,now=Date.now()) {
 if(['succeeded','failed','review'].includes(job.state))return;
 if(!stripe)return;
 if(!job.stripe_refund_id && now-Date.parse(job.created_at)>23*60*60*1000){await save({state:'review'});return;}
 const refund=job.stripe_refund_id?await stripe.refunds.retrieve(job.stripe_refund_id):await stripe.refunds.create({
  payment_intent:job.payment_intent,amount:job.amount_cents,reason:'requested_by_customer',metadata:{cityRefundId:job.id},
 },{idempotencyKey:'city-refund-'+job.id});
 if(refund.payment_intent!==job.payment_intent||refund.amount!==job.amount_cents||refund.currency!=='eur'||refund.metadata?.cityRefundId!==job.id)throw Error('Refund verification failed');
 const state=refund.status==='succeeded'?'succeeded':['failed','canceled'].includes(refund.status)?'failed':'submitted';
 await save({stripe_refund_id:refund.id,state});
}
