// Read-only customer history. Does not import or replace the booking/payment service.
export async function profileHistory(request: Request, db: any): Promise<Response> {
  const json = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'private, no-store'}});
  if (request.method !== 'GET') return json({success:false,error:'Method not allowed'},405);
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return json({success:false,error:'Please sign in'},401);
  try {
    const {data: auth, error: authError} = await db.auth.getUser(token);
    if (authError || !auth.user?.email_confirmed_at || !auth.user.email) return json({success:false,error:'Please sign in'},401);
    const pageText = new URL(request.url).searchParams.get('page') || '0';
    if (!/^\d{1,6}$/.test(pageText)) return json({success:false,error:'Invalid history page'},400);
    const page = Number(pageText), size = 50;
    const {data,error} = await db.from('city_card_orders').select('id,state,created_at,purchase').eq('owner_id',auth.user.id)
      .order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*size,page*size+size);
    if (error) return json({success:false,error:'Purchase history is temporarily unavailable'},503);
    const rows = data || [];
    return json({success:true,orders:rows.slice(0,size).map((o:any)=>({id:o.id,state:o.state,date:o.purchase.selectedDate,
      createdAt:o.created_at,quantity:o.purchase.passengers.length,totalCents:o.purchase.paymentQuote.amountCents})),nextPage:rows.length>size?page+1:null});
  } catch {return json({success:false,error:'Purchase history is temporarily unavailable'},503);}
}
