import {priceTicket} from './ticket-payment.ts';
import {rideIdentity} from './pickup-eligibility.ts';
// This private receipt is distinct from client-supplied booking fields.
export function createRidePurchaseGuard(deps:{get:(k:string)=>Promise<any>;set:(k:string,v:any)=>Promise<void>;isAdmin:(auth?:string)=>Promise<boolean>}) {
  return async(c:any,next:()=>Promise<void>)=>{
    const path=c.req.path.replace(/^\/make-server-3bd0ade8/,'').replace(/\/+$/,'');
    if(c.req.method!=='POST'||!['/create-payment-intent','/bookings','/driver-sales/create'].includes(path))return next();
    let body:any,quote:any,staffManual=false;
    try{body=await c.req.json();}catch{return c.json({success:false,error:'Invalid request'},400);}
    if(path==='/create-payment-intent'&&body.pendingBookingData){
      if(body.pendingSunsetSpecialData)return c.json({success:false,error:'Choose one purchase type'},400);
      try{quote=priceTicket(body.pendingBookingData,await deps.get('pricing_config'));}
      catch{return c.json({success:false,error:'Unable to price this booking. Check passenger and visit details.'},400);}
      if(typeof body.amount!=='number'||Math.round(body.amount*100)!==quote.paymentQuote.amountCents||(body.currency??'eur')!=='eur')
        return c.json({success:false,error:'Prices changed. Refresh checkout before paying.'},409);
      body.amount=quote.paymentQuote.amountCents/100;body.currency='eur';body.pendingBookingData=quote;
    }
    if(path==='/bookings'){
      if(!body.paymentIntentId||body.isTestBooking||body.manualBooking||body.skipEmail){
        if(!await deps.isAdmin(c.req.header('Authorization')))return c.json({success:false,error:'A completed payment or administrator access is required'},403);
        staffManual=body.manualBooking===true&&!body.isTestBooking&&!body.paymentIntentId;
      }
      delete body.id;
    }
    c.set('ridePurchaseBody',body);
    await next();
    if(!c.res.ok)return;
    const result=await c.res.clone().json();if(!result.success)return;
    if(quote&&result.paymentIntentId){
      await deps.set('ride_purchase_'+result.paymentIntentId,{version:1,identity:rideIdentity(quote),amountCents:quote.paymentQuote.amountCents,createdAt:new Date().toISOString()});
    }
    if(staffManual&&result.booking?.id){
      await deps.set('ride_manual_'+result.booking.id,{version:1,identity:rideIdentity(result.booking),recordedAt:new Date().toISOString()});
    }
    if(path==='/driver-sales/create'&&result.booking?.id){
      const sale=result.booking,fullName=`${sale.firstName||''} ${sale.lastName||''}`.trim(),count=Number(sale.numberOfPeople);
      if(!Number.isInteger(count)||count<1||count>50)throw new Error('Invalid driver sale quantity');
      const booking={id:sale.id,selectedDate:sale.selectedDate,status:'confirmed',paymentStatus:'paid',
        contactInfo:{name:fullName,email:sale.customerEmail||'',phone:''},
        passengers:Array.from({length:count},()=>({name:fullName,type:'Adult'})),source:'driver_sale',timeSlot:sale.timeSlot};
      await deps.set(sale.id,booking);
      await deps.set('ride_manual_'+sale.id,{version:1,identity:rideIdentity(booking),recordedAt:new Date().toISOString()});
    }
  };
}
