export function installMerchantPerks(app:any,db:any) {
 const root='/make-server-3bd0ade8';
 const result=async(query:any)=>{const {data,error}=await query;if(error)throw Error(error.message);return data;};
 async function identity(c:any){const token=c.req.header('Authorization')?.replace(/^Bearer /i,'');const {data,error}=await db.auth.getUser(token||'');if(error||!data.user?.email_confirmed_at||!data.user.email)throw Error('Sign in required');return data.user;}
 const handle=(fn:any)=>async(c:any)=>{c.header('Cache-Control','private, no-store');try{return await fn(c);}catch(e){const error=e instanceof Error?e.message:'Perks unavailable';return c.json({success:false,error},error==='Sign in required'?401:409);}};
 async function merchant(email:string){const access=await result(db.from('merchant_access').select('merchant_id,can_sell,can_scan,display_name').eq('email',email.toLowerCase()).eq('is_active',true).maybeSingle());if(!access)throw Error('Approved merchant access required');const m=await result(db.from('merchants').select('id,name,is_test').eq('id',access.merchant_id).eq('is_active',true).maybeSingle());if(!m)throw Error('Approved merchant access required');return {...m,canScan:access.can_scan===true,staffName:access.display_name,canSell:access.can_sell===true&&!m.is_test};}
 app.get(root+'/perks/offers',handle(async(c:any)=>{
  const merchants=await result(db.from('merchants').select('id,name,location').eq('is_active',true).eq('is_test',false));
  const deals=await result(db.from('deals').select('id,merchant_id,title,terms,is_single_use').eq('is_active',true));
  return c.json({success:true,offers:deals.filter((d:any)=>merchants.some((m:any)=>m.id===d.merchant_id)).map((d:any)=>({...d,merchant:merchants.find((m:any)=>m.id===d.merchant_id)}))});
 }));
 app.get(root+'/merchant/session',handle(async(c:any)=>{const user=await identity(c),m=await merchant(user.email);const offers=m.canScan?await result(db.from('deals').select('id,title,terms,is_single_use').eq('merchant_id',m.id).eq('is_active',true)):[];return c.json({success:true,merchant:m,offers});}));
 app.get(root+'/customer/perks',handle(async(c:any)=>{const user=await identity(c);return c.json({success:true,usage:await result(db.rpc('customer_perk_history',{p_email:user.email}))});}));
 for(const action of ['check','redeem'])app.post(root+'/merchant/'+action,handle(async(c:any)=>{
  const user=await identity(c),body=await c.req.json();
  const match=typeof body.qr==='string'?body.qr.match(/^(CC-[0-9A-Fa-f-]{36})\|(\d{1,2})$/):null;
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!match||!uuid.test(body.dealId)||!uuid.test(body.requestId))throw Error('Scan a valid City Card and choose an offer');
  const receipt=await result(db.rpc('use_city_perk',{p_email:user.email,p_deal:body.dealId,p_booking:match[1],p_index:Number(match[2]),p_request:body.requestId,p_commit:action==='redeem'}));
  return c.json({success:true,receipt});
 }));
 // Existing middleware restricts all /admin routes to verified administrators.
 app.get(root+'/admin/merchant-access',handle(async(c:any)=>c.json({success:true,access:await result(db.from('merchant_access').select('email,merchant_id,is_active,can_sell,can_scan,display_name').order('email'))})));
 app.post(root+'/admin/merchant-access',handle(async(c:any)=>{
  const b=await c.req.json(),email=String(b.email||'').trim().toLowerCase();
  if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof b.merchantId!=='string'||typeof b.active!=='boolean')throw Error('Enter merchant, email and access status');
  const current=await result(db.from('merchant_access').select('can_sell,can_scan,display_name').eq('email',email).maybeSingle());
  await result(db.from('merchant_access').upsert({email,merchant_id:b.merchantId,is_active:b.active,
   can_sell:typeof b.canSell==='boolean'?b.canSell:current?.can_sell??false,
   can_scan:typeof b.canScan==='boolean'?b.canScan:current?.can_scan??true,
   display_name:typeof b.name==='string'?b.name.trim().slice(0,80):current?.display_name??''},{onConflict:'email'}));
  return c.json({success:true});
 }));
}


