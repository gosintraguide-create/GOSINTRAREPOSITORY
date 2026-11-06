import {validBookingToken} from './booking-access.ts';
import {checkPickupEligibility,customerPickup,pickupInput,PickupEligibilityError} from './pickup-eligibility.ts';
export function installCustomerPickups(app:any,deps:{secret:string;get:(key:string)=>Promise<any>;list:()=>Promise<any[]>;
  payment:(id:string)=>Promise<any>;create:(id:string,input:any,booking:any)=>Promise<any>;notify:(request:any)=>Promise<void>}) {
  const base='/make-server-3bd0ade8';
  async function owner(c:any,id:any) {
    c.header('Cache-Control','private, no-store');
    return typeof id==='string'&&/^[A-Z]{2}-[0-9]+$/.test(id)&&await validBookingToken(deps.secret,id,c.req.header('X-Booking-Token'));
  }
  app.get(base+'/pickup-requests/mine',async(c:any)=>{
    const id=c.req.query('bookingId');
    if(!await owner(c,id))return c.json({success:false,error:'Please sign in to your booking.'},401);
    try {return c.json({success:true,requests:(await deps.list()).filter(r=>r.bookingId===id).sort((a,b)=>b.requestTime.localeCompare(a.requestTime)).slice(0,50).map(customerPickup)});}
    catch{return c.json({success:false,error:'Unable to load your requests.'},503);}
  });
  app.post(base+'/pickup-requests',async(c:any)=>{
    let body:any;
    try{body=await c.req.json();}catch{return c.json({success:false,error:'Invalid request.'},400);}
    if(!await owner(c,body.bookingId))return c.json({success:false,error:'Please sign in to your booking.'},401);
    let eligibility,input;
    try{eligibility=await checkPickupEligibility(body.bookingId,deps);input=pickupInput(body,eligibility.passengers);}
    catch(error){return c.json({success:false,error:error instanceof PickupEligibilityError?error.message:'Booking verification is temporarily unavailable. Please try again.'},error instanceof PickupEligibilityError?403:503);}
    try{
      const result=await deps.create(body.bookingId,input,eligibility.booking);
      // Notify only the winner of the atomic insert. Never turn a saved request into a retryable error.
      if(result.created){try{await deps.notify(result.request);}catch{console.error('Pickup notification failed after request was saved');}}
      return c.json({success:true,created:result.created,request:customerPickup(result.request)});
    }catch{return c.json({success:false,error:'Unable to save your request. Refresh your requests before trying again.'},503);}
  });
}
