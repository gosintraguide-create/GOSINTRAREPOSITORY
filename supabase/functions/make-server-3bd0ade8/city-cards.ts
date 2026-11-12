import {cityCardPrice, quoteCityCards, validVisitDate, verifyCitySession} from './city-card-product.ts';
import {reconcileCityRefund} from './city-card-refunds.ts';

// Only this server module can access these tables/RPCs. Customer identity always
// comes from Supabase getUser, never a submitted email or cached JWT payload.
export function installCityCards(app:any, deps:{db:any; stripe:any; get:(key:string)=>Promise<any>; qr:(id:string,index:number)=>Promise<string>; returnUrl:string}) {
  const {db,stripe}=deps, root='/make-server-3bd0ade8';
  async function rpc(name:string,args:any) {const {data,error}=await db.rpc(name,args); if(error) throw new Error(error.message); return data;}
  async function order(id:string) {const {data,error}=await db.from('city_card_orders').select('*').eq('id',id).maybeSingle(); if(error) throw error; return data;}
  async function update(id:string, values:any) {const {error}=await db.from('city_card_orders').update(values).eq('id',id); if(error) throw error;}
  async function identity(c:any) {
    const token=c.req.header('Authorization')?.replace(/^Bearer /i,'');
    if(!token) throw new Error('Sign in to access your City Cards');
    const {data,error}=await db.auth.getUser(token);
    if(error || !data.user?.email_confirmed_at || !data.user.email) throw new Error('Sign in to access your City Cards');
    return data.user;
  }
  async function listOrders(owner:string) {
    const {data,error}=await db.from('city_card_orders').select('*').eq('owner_id',owner).eq('state','reserved').order('created_at',{ascending:false}).limit(10);
    if(error) throw error; return data || [];
  }
  async function refunds(email:string) {
    const read=async()=>{const {data,error}=await db.from('city_card_refunds').select('*').eq('email',email.toLowerCase()).order('created_at',{ascending:false}).limit(200);if(error)throw error;return data||[];};
    const jobs=await read();
    await Promise.all(jobs.map(async(job:any)=>{try{await reconcileCityRefund(job,stripe,async(values:any)=>{const {error}=await db.from('city_card_refunds').update({...values,updated_at:new Date().toISOString()}).eq('id',job.id);if(error)throw error;});}catch{ /* Persisted pending intent is retried on the next wallet refresh. */ }}));
    return (await read()).map((j:any)=>({id:j.id,cancellationId:j.cancellation_id,bookingId:j.booking_id,amountCents:j.amount_cents,state:j.state}));
  }
  async function issue(o:any, session?:any) {
    if(session) verifyCitySession(session,o);
    else if(o.purchase.paymentQuote.amountCents!==0) throw new Error('Payment required');
    const id=`CC-${o.id.toUpperCase()}`;
    const qrCodes=await Promise.all(o.purchase.passengers.map((_:unknown,i:number)=>deps.qr(id,i)));
    const booking={...o.purchase,id,qrCodes,status:'confirmed',paymentStatus:'paid',createdAt:o.created_at,
      source:'city-card-app',customerId:o.owner_id,cityOrderId:o.id,paymentIntentId:session?.payment_intent || null};
    return rpc('finish_city_cards',{p_id:o.id,p_booking:booking});
  }
  async function ensureSession(o:any) {
    if(o.purchase.salesChannel==='staff') return o;
    if(o.state!=='reserved' || o.session_id) return o;
    if(o.purchase.paymentQuote.amountCents===0) {await issue(o); return order(o.id);}
    if(!stripe) throw new Error('Checkout is temporarily unavailable');
    // Never recreate an uncertain payment after Stripe's idempotency retention.
    if(Date.now()-Date.parse(o.created_at)>23*60*60*1000) throw new Error('This reservation needs support review; your places are still protected');
    let session;
    try {session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],
      client_reference_id:o.id,customer_email:o.email,metadata:{cityOrderId:o.id},
      payment_intent_data:{metadata:{cityOrderId:o.id}},
      expires_at:Math.floor(Date.parse(o.expires_at)/1000),
      success_url:deps.returnUrl,cancel_url:deps.returnUrl,
      line_items:[{quantity:1,price_data:{currency:'eur',unit_amount:o.purchase.paymentQuote.amountCents,
        product_data:{name:`City Cards · ${o.purchase.selectedDate}`,description:`${o.purchase.passengers.length} named card(s) · unlimited rides during operating hours`}}}],
    },{idempotencyKey:`city-card-${o.id}`});} catch(error:any) {
      // A replay of a successful creation returns its original session. A fresh
      // validation rejection for the fixed deadline proves none was created.
      // Network errors and concurrent/idempotency conflicts remain reserved.
      if(error.type==='StripeInvalidRequestError' && error.param==='expires_at') {
        await rpc('expire_city_cards',{p_id:o.id});
        return order(o.id);
      }
      throw error;
    }
    // If this write fails the same idempotency key recovers the existing session.
    await update(o.id,{session_id:session.id,checkout_url:session.url});
    return {...o,session_id:session.id,checkout_url:session.url};
  }
  async function reconcile(o:any,cancel=false) {
    if(o.state!=='reserved') return o;
    if(o.purchase.salesChannel==='staff') {
      if(cancel||Date.now()>=Date.parse(o.expires_at))await rpc('expire_city_cards',{p_id:o.id});
      return order(o.id);
    }
    o=await ensureSession(o);
    if(o.state!=='reserved') return o;
    let session=await stripe.checkout.sessions.retrieve(o.session_id);
    if(session.status==='complete' && session.payment_status==='paid') {await issue(o,session); return order(o.id);}
    if(session.status==='open' && (cancel || Date.now()>=Date.parse(o.expires_at))) {
      try {session=await stripe.checkout.sessions.expire(o.session_id);} catch {
        // Paying and cancelling can race. Retrieve again; never assume cancellation.
        session=await stripe.checkout.sessions.retrieve(o.session_id);
      }
      if(session.status==='complete' && session.payment_status==='paid') {await issue(o,session); return order(o.id);}
    }
    if(session.status==='expired') await rpc('expire_city_cards',{p_id:o.id});
    return order(o.id);
  }
  async function cleanup() {
    const {data,error}=await db.from('city_card_orders').select('*').eq('state','reserved').lte('expires_at',new Date().toISOString()).order('last_checked_at',{ascending:true,nullsFirst:true}).limit(10);
    if(error) throw error;
    await Promise.all((data || []).map(async (o:any)=>{try {await update(o.id,{last_checked_at:new Date().toISOString()});await reconcile(o);} catch(e) {console.error('City Card reservation retained',o.id,String(e));}}));
  }
  async function inventory(date:string) {if(!validVisitDate(date)) throw new Error('Choose a valid visit date'); return rpc('day_pass_inventory',{p_date:date});}
  const viewOrder=(o:any)=>({id:o.id,state:o.state,date:o.purchase.selectedDate,expiresAt:o.expires_at,checkoutUrl:o.state==='reserved'?o.checkout_url:null,bookingId:o.booking_id,quantity:o.purchase.passengers.length,totalCents:o.purchase.paymentQuote.amountCents});
  const handle=(fn:(c:any)=>Promise<any>)=>async(c:any)=>{c.header('Cache-Control','private, no-store'); try{return await fn(c);}catch(e){const message=e instanceof Error?e.message:'The booking service is unavailable'; return c.json({success:false,error:message},message.startsWith('Sign in')?401:409);}};
  app.get(root+'/city-cards/offer/:date',handle(async c=>{
    await cleanup(); const day=await inventory(c.req.param('date'));
    return c.json({success:true,day,prices:cityCardPrice(await deps.get('pricing_config')),salesEnabled:await deps.get('ticket_purchases_enabled')!==false,serverTime:new Date().toISOString()});
  }));
  app.get(root+'/admin/day-capacity/:date',handle(async c=>{await cleanup(); return c.json({success:true,day:await inventory(c.req.param('date'))});}));
  app.put(root+'/admin/day-capacity/:date',handle(async c=>{
    const date=c.req.param('date'), b=await c.req.json();
    if(!validVisitDate(date) || !Number.isInteger(b.capacity) || b.capacity<0 || b.capacity>100000 || !/^\d{2}:\d{2}$/.test(b.opens) || !/^\d{2}:\d{2}$/.test(b.closes)) throw new Error('Enter a valid daily capacity and operating hours');
    return c.json({success:true,day:await rpc('set_day_pass_day',{p_date:date,p_capacity:b.capacity,p_opens:b.opens,p_closes:b.closes,p_slots:b.slots??null})});
  }));
  app.get(root+'/city-cards/checkout-return',c=>c.text('Return to Hop On Sintra and open My Cards. We will confirm your payment there. If you left checkout without paying, you can resume or cancel your reservation in My Cards.'));
  app.post(root+'/customer/city-cards/checkout',handle(async c=>{
    const user=await identity(c), b=await c.req.json();
    if(typeof b.requestId!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.requestId)) throw new Error('Invalid checkout request');
    const prior=await order(b.requestId);
    if(prior && prior.owner_id!==user.id) throw new Error('Reservation unavailable');
    if(prior) return c.json({success:true,order:viewOrder(await reconcile(prior))});
    if(!stripe) throw new Error('Checkout is temporarily unavailable');
    await cleanup();
    const purchase=quoteCityCards(b,user,await deps.get('pricing_config'),await inventory(b.date));
    if(b.expectedAmountCents!==purchase.paymentQuote.amountCents) throw new Error('Prices have changed. Refresh your visit date and review the new total before checkout.');
    const o=await rpc('reserve_city_cards',{p_id:b.requestId,p_owner:user.id,p_email:user.email,p_purchase:purchase});
    return c.json({success:true,order:viewOrder(await ensureSession(o))});
  }));
  app.post(root+'/customer/city-cards/orders/:id/cancel',handle(async c=>{
    const user=await identity(c), o=await order(c.req.param('id'));
    if(!o || o.owner_id!==user.id) throw new Error('Reservation unavailable');
    return c.json({success:true,order:viewOrder(await reconcile(o,true))});
  }));
  app.get(root+'/customer/city-cards',handle(async c=>{
    const user=await identity(c), pending=await listOrders(user.id); let recoveryPending=false;
    const orders=await Promise.all(pending.map(async(o:any)=>{try{return viewOrder(await reconcile(o));}catch{recoveryPending=true;return viewOrder(o);}}));
    const bookings=await rpc('customer_day_passes',{p_email:user.email});
    const cards=(await Promise.all(bookings.map(async(b:any)=>Promise.all(b.passengers.map(async(p:any,index:number)=>({id:`${b.id}:${index}`,bookingId:b.id,index,
      name:p.name,date:b.selectedDate,ageBand:p.ageBand || (p.type==='Adult'?'full':'unknown'),status:p.cancelledAt?'cancelled':b.status || 'confirmed',
      canCancel:b.product==='city-card-v1'&&b.status==='confirmed'&&!p.cancelledAt&&b.selectedDate>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
      qr:b.status==='cancelled'||p.cancelledAt?null:b.qrCodes?.[index] || await deps.qr(b.id,index),transportHours:b.transportHours || null,
      perks:b.product==='city-card-v1' && p.ageBand==='full' && !p.cancelledAt})))))).flat();
    return c.json({success:true,cards,orders,recoveryPending,refunds:await refunds(user.email)});
  }));
  app.post(root+'/customer/city-cards/cancellation-quote',handle(async c=>{
    const user=await identity(c),b=await c.req.json();
    if(typeof b.bookingId!=='string'||!Number.isInteger(b.index))throw new Error('Choose a card');
    return c.json({success:true,quote:await rpc('city_card_cancel_quote',{p_email:user.email,p_booking:b.bookingId,p_index:b.index})});
  }));
  app.post(root+'/customer/city-cards/cancellations',handle(async c=>{
    const user=await identity(c),b=await c.req.json();
    if(typeof b.requestId!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(b.requestId)||typeof b.bookingId!=='string'||!Number.isInteger(b.index)||typeof b.fingerprint!=='string')throw new Error('Invalid cancellation request');
    const result=await rpc('cancel_city_cards',{p_id:b.requestId,p_email:user.email,p_booking:b.bookingId,p_index:b.index,p_fingerprint:b.fingerprint});
    return c.json({success:true,cancellation:result,refunds:await refunds(user.email)});
  }));
  return {inventory,cleanup,reconcile,async webhook(event:any) {
    if(!event.type.startsWith('checkout.session.')) return false;
    const id=event.data.object?.metadata?.cityOrderId;
    if(!id) return false;
    const o=await order(id); if(!o) throw new Error('City Card reservation missing');
    // Stripe metadata is verified by the outer webhook; independently retrieve.
    if(!o.session_id) {await update(id,{session_id:event.data.object.id}); o.session_id=event.data.object.id;}
    await reconcile(o); return true;
  }};
}

