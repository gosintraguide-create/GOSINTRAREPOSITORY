import {reconcileCityRefund} from './city-card-refunds.ts';
export function adminChangeAudit(db:any){return async(c:any,next:()=>Promise<void>)=>{
 const path=c.req.path.replace('/make-server-3bd0ade8','');
 const tracked=['POST','PUT','PATCH','DELETE'].includes(c.req.method)&&/^\/(pricing|admin\/day-capacity|admin\/merchant-access|drivers\/(create|[^/]+)|merchants|deals)(\/|$)/.test(path)&&!path.endsWith('/login')&&!path.endsWith('/logout')&&!path.endsWith('/record-scan');
 let body:any={};if(tracked){try{body=await c.req.json();}catch{}}
 await next();if(!tracked||!c.res.ok)return;
 try{const {data}=await db.auth.getUser(c.req.header('Authorization')?.replace(/^Bearer /i,''));if(data.user?.app_metadata?.role!=='admin')return;
 const safe=Object.fromEntries(Object.entries(body).filter(([key])=>!/password|secret|token/i.test(key)));
 const {error}=await db.from('admin_activity').insert({actor:data.user.id,action:c.req.method+' '+path,target:path,detail:safe});if(error)console.error('Admin change audit write failed',path);
 }catch{console.error('Admin change audit unavailable',path);}
};}
export function installAdminOperations(app:any,deps:{db:any;stripe:any;get:(key:string)=>Promise<any>;send:(booking:any,qr:string[],key?:string)=>Promise<any>;reconcile:(order:any,cancel?:boolean)=>Promise<any>}){
 const {db}=deps,root='/make-server-3bd0ade8/admin/operations';
 const result=async(q:any)=>{const {data,error}=await q;if(error)throw Error(error.message);return data;};
 const rpc=(name:string,args:any)=>result(db.rpc(name,args));
 async function actor(c:any){const {data,error}=await db.auth.getUser(c.req.header('Authorization')?.replace(/^Bearer /i,''));if(error||data.user?.app_metadata?.role!=='admin')throw Error('Administrator access required');return data.user.id;}
 const audit=(id:string,action:string,target:string,detail:any)=>result(db.from('admin_activity').insert({actor:id,action,target,detail}));
 const route=(fn:any)=>async(c:any)=>{c.header('Cache-Control','private, no-store');try{const id=await actor(c);return await fn(c,id);}catch(e){return c.json({success:false,error:e instanceof Error?e.message:'Operation unavailable'},409);}};
 app.get(root+'/reports',route(async(c:any)=>{
  const filters=Object.fromEntries(['from','to','basis','role','seller','partner','channel','q','page'].map(key=>[key,c.req.query(key)||'']));
  filters.page=filters.page||'0';filters.basis=filters.basis||'ordered';
  if(filters.q.length>100||filters.seller.length>100||filters.partner.length>100)throw Error('Report filter is too long');
  const kind=c.req.query('kind')||'sales';if(!['sales','perks'].includes(kind))throw Error('Invalid report');
  return c.json({success:true,report:await rpc(kind==='perks'?'admin_perks_report':'admin_sales_report',{p_filters:filters})});
 }));
 app.get(root,route(async(c:any)=>{
  const q=String(c.req.query('q')||'').replace(/[^a-zA-Z0-9@._+-]/g,'').slice(0,100);
  let orders=db.from('city_card_orders').select('*').order('created_at',{ascending:false}).limit(200);
  if(q)orders=orders.or(`email.ilike.%${q}%,booking_id.ilike.%${q}%`);
  const [items,refunds,activity,redemptions,finances]=await Promise.all([
   result(orders),result(db.from('city_card_refunds').select('*').order('created_at',{ascending:false}).limit(200)),
   result(db.from('admin_activity').select('*').order('created_at',{ascending:false}).limit(100)),
   result(db.from('city_perk_redemptions').select('*').order('redeemed_at',{ascending:false}).limit(100)),rpc('admin_city_card_finances',{})]);
  const ids=items.map((o:any)=>o.booking_id).filter(Boolean);
  // Load seller/delivery records for the returned orders, including older search matches.
  const sales=items.length?await result(db.from('staff_card_sales').select('*').in('id',items.map((o:any)=>o.id))):[];
  const bookings=ids.length?await result(db.from('kv_store_3bd0ade8').select('key,status:value->status,passengers:value->passengers,paymentMethod:value->paymentMethod,source:value->source').in('key',ids)):[];
  return c.json({success:true,orders:items.map((o:any)=>({...o,booking:bookings.find((b:any)=>b.key===o.booking_id)||null})),refunds,sales,activity,redemptions,finances,limit:200});
 }));
 app.post(root+'/quote',route(async(c:any)=>{const b=await c.req.json(),booking=await deps.get(b.bookingId);if(!booking)throw Error('Booking unavailable');return c.json({success:true,quote:await rpc('admin_city_card_quote',{p_email:booking.contactInfo.email,p_booking:b.bookingId,p_index:b.index,p_override:b.serviceFailure===true})});}));
 app.post(root+'/cancel',route(async(c:any,id:string)=>{
  const b=await c.req.json(),booking=await deps.get(b.bookingId);if(!booking||typeof b.reason!=='string'||b.reason.length>500)throw Error('Enter a cancellation reason');
  await rpc('admin_cancel_city_cards',{p_id:b.requestId,p_email:booking.contactInfo.email,p_booking:b.bookingId,p_index:b.index,p_fingerprint:b.fingerprint,p_actor:id,p_reason:b.reason,p_override:b.serviceFailure===true});
  return c.json({success:true,message:'Cards cancelled. Refunds are listed separately; cancellation alone does not mean money has been returned.'});
 }));
 app.post(root+'/refund/:id',route(async(c:any,id:string)=>{
  const b=await c.req.json(),job=await result(db.from('city_card_refunds').select('*').eq('id',c.req.param('id')).single());
  if(b.action==='settle'){if(b.paid!==true)throw Error('Confirm the customer has been refunded');await rpc('settle_offline_refund',{p_id:job.id,p_actor:id,p_reference:b.reference});}
  else if(b.action==='reconcile'){await reconcileCityRefund(job,deps.stripe,async(v:any)=>{await result(db.from('city_card_refunds').update({...v,updated_at:new Date().toISOString()}).eq('id',job.id));});await audit(id,'reconcile_refund',job.booking_id,{refundId:job.id});}
  else throw Error('Choose a refund action');return c.json({success:true});
 }));
 app.post(root+'/order/:id',route(async(c:any,id:string)=>{
  const b=await c.req.json(),order=await result(db.from('city_card_orders').select('*').eq('id',c.req.param('id')).single());
  if(b.action==='email'){
   if(order.state!=='paid'||!order.booking_id)throw Error('Only issued cards can be emailed');const booking=await deps.get(order.booking_id);
   if(typeof b.requestId!=='string'||!/^[0-9a-f-]{36}$/i.test(b.requestId))throw Error('Invalid delivery reference');
   const sent=await deps.send(booking,booking.qrCodes,`admin-ticket-${order.id}-${b.requestId}`);
   await result(db.from('city_card_orders').update(sent.success?{ticket_email_sent_at:new Date().toISOString(),ticket_email_error:null}:{ticket_email_error:sent.error||'Delivery failed'}).eq('id',order.id));
   if(!sent.success)throw Error(sent.error||'Ticket delivery failed');
   await result(db.from('staff_card_sales').update({email_sent_at:new Date().toISOString(),email_error:null}).eq('id',order.id));
  }else if(['reconcile','release'].includes(b.action)){if(b.action==='release'&&b.unpaid!==true)throw Error('Confirm no cash or terminal payment was collected');await deps.reconcile(order,b.action==='release');}
  else throw Error('Choose an order action');await audit(id,b.action+'_order',order.id,{});return c.json({success:true});
 }));
}
