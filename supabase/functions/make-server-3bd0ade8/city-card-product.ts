export function cityCardPrice(config: any) {
  const price = config?.basePrice;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0.5 || price > 100000 || Math.abs(price*100-Math.round(price*100))>0.00001) throw new Error('City Card pricing is not configured');
  return {full: Math.round(price*100), half: Math.round(price*100/2), free: 0};
}
export function validVisitDate(date: unknown): date is string {
  return typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date+'T12:00:00Z')) && new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
}
export function quoteCityCards(input: any, user: any, config: any, day: any) {
  if (!validVisitDate(input?.date) || !day?.configured || day.date!==input.date) throw new Error('Choose an open visit date');
  if(typeof input.timeSlot!=='string'||!Object.hasOwn(day.slots||{},input.timeSlot)) throw new Error('Choose your first-departure time slot');
  if (!Array.isArray(input.travellers) || input.travellers.length<1 || input.travellers.length>50) throw new Error('Choose between 1 and 50 cards');
  const prices=cityCardPrice(config);
  const passengers=input.travellers.map((p:any) => {
    if (typeof p?.name!=='string' || !p.name.trim() || p.name.trim().length>60 || !['full','half','free'].includes(p.ageBand)) throw new Error('Assign a name and age category to every card');
    const ageBand=p.ageBand as keyof typeof prices;
    return {name:p.name.trim(),ageBand,type:ageBand==='full'?'Adult':'Child',priceCents:prices[ageBand],perks:ageBand==='full',tukTukAllowed:ageBand!=='free'};
  });
  const amountCents=passengers.reduce((n:number,p:any)=>n+p.priceCents,0);
  return {product:'city-card-v1',selectedDate:input.date,timeSlot:input.timeSlot,
    transportHours:{opens:day.opens,closes:day.closes,timezone:'Europe/Lisbon'},
    contactInfo:{name:String(user.user_metadata?.full_name || passengers[0].name).trim().slice(0,60),email:user.email.toLowerCase()},
    passengers,selectedAttractions:[],guidedTour:null,totalPrice:amountCents/100,
    paymentQuote:{version:1,amountCents,currency:'eur'}};
}
export function verifyCitySession(session:any, order:any) {
  if (session.metadata?.cityOrderId!==order.id || session.client_reference_id!==order.id ||
    (order.session_id && order.session_id!==session.id) || session.mode!=='payment' || session.status!=='complete' ||
    session.payment_status!=='paid' || session.currency!=='eur' || session.amount_total!==order.purchase.paymentQuote.amountCents)
    throw new Error('Payment has not been verified for this reservation');
}
export function cityBoardingError(booking:any,index:number,now=new Date()):string|null {
  if(booking.product!=='city-card-v1') return null;
  if(!Number.isInteger(index)||index<0||index>=booking.passengers.length) return 'Invalid cardholder';
  if(booking.passengers[index].cancelledAt)return 'This City Card has been cancelled';
  if(!['confirmed','completed'].includes(booking.status)||booking.paymentStatus!=='paid') return 'This City Card is not active';
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const part=(key:string)=>parts.find(p=>p.type===key)?.value;
  const date=`${part('year')}-${part('month')}-${part('day')}`,time=`${part('hour')}:${part('minute')}`;
  if(booking.selectedDate!==date) return 'This City Card is valid only on its visit date';
  if(!booking.transportHours || time<booking.transportHours.opens || time>=booking.transportHours.closes) return 'This City Card is outside transport operating hours';
  return null;
}
