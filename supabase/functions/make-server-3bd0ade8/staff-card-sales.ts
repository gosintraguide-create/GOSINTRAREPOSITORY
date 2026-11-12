import {quoteCityCards,validVisitDate} from './city-card-product.ts';

export function installStaffCardSales(app:any,deps:{db:any;get:(key:string)=>Promise<any>;staff:(token:string)=>Promise<any>;qr:(id:string,index:number)=>Promise<string>;send:(booking:any,qr:string[],key?:string)=>Promise<any>}) {
 const {db}=deps,root='/make-server-3bd0ade8/staff/cards';
 const result=async(q:any)=>{const {data,error}=await q;if(error)throw Error(error.message);return data;};
 const rpc=(name:string,args:any)=>result(db.rpc(name,args));
 async function seller(c:any){
  const token=c.req.header('Authorization')?.replace(/^Bearer /i,'')||'';
  const {data,error}=await db.auth.getUser(token);if(error||!data.user)throw Error('Staff sign-in required');
  const user=data.user,staff=await deps.staff(token);
  if(staff)return {id:user.id,...staff};
  if(!user.email_confirmed_at||!user.email)throw Error('Sales permission required');
  const access=await result(db.from('merchant_access').select('merchant_id').eq('email',user.email.toLowerCase()).eq('is_active',true).eq('can_sell',true).maybeSingle());
  if(!access)throw Error('Sales permission required');
  const merchant=await result(db.from('merchants').select('id,name').eq('id',access.merchant_id).eq('is_active',true).eq('is_test',false).maybeSingle());
  if(!merchant)throw Error('Active non-test merchant required for sales');
  return {id:user.id,role:'merchant',merchantId:merchant.id,name:merchant.name};
 }
 const handle=(fn:any)=>async(c:any)=>{c.header('Cache-Control','private, no-store');try{return await fn(c);}catch(e){return c.json({success:false,error:e instanceof Error?e.message:'Sale unavailable'},409);}};
 async function own(id:string,actor:any){const sale=await result(db.from('staff_card_sales').select('*').eq('id',id).eq('seller_id',actor.id).maybeSingle());if(!sale)throw Error('Sale unavailable');const order=await result(db.from('city_card_orders').select('*').eq('id',id).single());return {sale,order};}
 const view=(o:any,s:any)=>({id:o.id,state:o.state,date:o.purchase.selectedDate,timeSlot:o.purchase.timeSlot,email:o.email,travellers:o.purchase.passengers,totalCents:o.purchase.paymentQuote.amountCents,expiresAt:o.expires_at,bookingId:o.booking_id,emailSent:!!s.email_sent_at,emailError:s.email_error});
 async function deliver(sale:any,order:any){
  if(sale.email_sent_at||order.state!=='paid')return;
  const booking=await deps.get(order.booking_id);
  try{const sent=await deps.send(booking,booking.qrCodes,`staff-cards-${sale.id}`);if(!sent.success)throw Error(sent.error||'Email delivery failed');await result(db.from('staff_card_sales').update({email_sent_at:new Date().toISOString(),email_error:null}).eq('id',sale.id));}
  catch(e){await result(db.from('staff_card_sales').update({email_error:e instanceof Error?e.message:'Email pending'}).eq('id',sale.id));}
 }
 app.get(root+'/session',handle(async(c:any)=>c.json({success:true,seller:await seller(c)})));
 app.get(root,handle(async(c:any)=>{
  const actor=await seller(c),sales=await result(db.from('staff_card_sales').select('*').eq('seller_id',actor.id).order('created_at',{ascending:false}).limit(30));
  const items=[];for(const sale of sales){let {order}=await own(sale.id,actor);if(order.state==='reserved'&&Date.parse(order.expires_at)<=Date.now()){await rpc('expire_city_cards',{p_id:order.id});order={...order,state:'expired'};}items.push(view(order,sale));}
  return c.json({success:true,sales:items});
 }));
 app.post(root+'/reserve',handle(async(c:any)=>{
  const actor=await seller(c),body=await c.req.json();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.requestId)||!validVisitDate(body.date))throw Error('Invalid reservation');
  const email=String(body.email||'').trim().toLowerCase();if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))throw Error('Enter the customer email');
  const day=await rpc('day_pass_inventory',{p_date:body.date});
  const purchase=quoteCityCards(body,{email,user_metadata:{full_name:body.customerName}},await deps.get('pricing_config'),day);
  if(body.expectedAmountCents!==purchase.paymentQuote.amountCents)throw Error('Prices changed. Refresh before collecting payment');
  const o=await rpc('reserve_staff_cards',{p_id:body.requestId,p_seller_id:actor.id,p_seller:actor,p_purchase:purchase});
  return c.json({success:true,sale:view(o,(await own(o.id,actor)).sale)});
 }));
 app.post(root+'/:id/confirm',handle(async(c:any)=>{
  const actor=await seller(c),id=c.req.param('id'),body=await c.req.json(),{order}=await own(id,actor);
  if(body.paymentReceived!==true)throw Error('Confirm payment has been received');
  const bookingId='CC-'+id.toUpperCase(),qrCodes=await Promise.all(order.purchase.passengers.map((_:any,i:number)=>deps.qr(bookingId,i)));
  await rpc('confirm_staff_cards',{p_id:id,p_seller_id:actor.id,p_method:body.method,p_reference:body.reference||null,p_booking:{...order.purchase,id:bookingId,qrCodes,status:'confirmed',paymentStatus:'paid',createdAt:order.created_at,cityOrderId:id}});
  const current=await own(id,actor);await deliver(current.sale,current.order);const final=await own(id,actor);
  return c.json({success:true,sale:view(final.order,final.sale)});
 }));
 app.post(root+'/:id/email',handle(async(c:any)=>{const actor=await seller(c),id=c.req.param('id'),v=await own(id,actor);await deliver(v.sale,v.order);const latest=await own(id,actor);return c.json({success:true,sale:view(latest.order,latest.sale)});}));
 app.post(root+'/:id/cancel',handle(async(c:any)=>{const actor=await seller(c),v=await own(c.req.param('id'),actor);if(v.order.state!=='reserved')throw Error('Only unpaid reservations can be released');await rpc('expire_city_cards',{p_id:v.order.id});return c.json({success:true});}));
}
