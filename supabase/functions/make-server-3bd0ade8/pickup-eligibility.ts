export class PickupEligibilityError extends Error {}
export const pickupLocations = ['Sintra Train Station','Pena Palace','Quinta da Regaleira','Moorish Castle','Monserrate Palace','Sintra National Palace','Historic Town Center'];
export function lisbonDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
// Bind a server-priced purchase to its riders, date and booking contact.
export function rideIdentity(booking: any) {
  return JSON.stringify({date:booking.selectedDate,passengers:booking.passengers?.map((p:any)=>({name:p.name,type:p.type})),
    name:booking.contactInfo?.name,email:booking.contactInfo?.email});
}
export async function checkPickupEligibility(id: string, deps: {
  get: (key:string)=>Promise<any>; payment: (id:string)=>Promise<any>; now?:Date;
}) {
  const booking=await deps.get(id) || await deps.get('booking_'+id);
  if(!booking || booking.id!==id || booking.status!=='confirmed') throw new PickupEligibilityError('A confirmed booking is required.');
  if(booking.selectedDate!==lisbonDate(deps.now)) throw new PickupEligibilityError('Pickup requests are available only on your booked visit date.');
  const passengers=booking.passengers?.length;
  if(!Number.isInteger(passengers)||passengers<1||passengers>50)throw new PickupEligibilityError('Please contact us to verify your passenger allowance.');
  const staffProof=await deps.get('ride_manual_'+id);
  if(staffProof?.version===1 && staffProof.identity===rideIdentity(booking))return {booking,passengers};
  if(!booking.paymentIntentId || booking.paymentStatus!=='paid')throw new PickupEligibilityError('A paid booking is required to request a pickup.');
  const purchase=await deps.get('ride_purchase_'+booking.paymentIntentId);
  const claim=await deps.get('pi_claimed_'+booking.paymentIntentId);
  if(purchase?.version!==1 || purchase.identity!==rideIdentity(booking) || claim?.bookingId!==id || !Number.isSafeInteger(purchase.amountCents) || purchase.amountCents<50)
    throw new PickupEligibilityError('Please contact us to verify this booking before requesting a pickup.');
  const intent=await deps.payment(booking.paymentIntentId);
  if(intent.status!=='succeeded'||intent.currency!=='eur'||intent.amount_received!==purchase.amountCents||intent.amount!==purchase.amountCents)
    throw new PickupEligibilityError('Payment has not been confirmed for this booking.');
  const charge=intent.latest_charge;
  if(!charge || typeof charge==='string' || charge.refunded || charge.amount_refunded>0 || charge.disputed)
    throw new PickupEligibilityError('This payment is not eligible for a pickup. Please contact us.');
  return {booking,passengers};
}
export function pickupInput(body:any,maxPassengers:number) {
  if(!Number.isInteger(body.groupSize)||body.groupSize<1||body.groupSize>maxPassengers)throw new PickupEligibilityError('Group size exceeds your booking allowance.');
  if(!pickupLocations.includes(body.pickupLocation)||!pickupLocations.includes(body.destination)||body.pickupLocation===body.destination)
    throw new PickupEligibilityError('Choose two different pickup and destination stops.');
  if(typeof body.customerPhone!=='string'||!/^\+[0-9 ()-]{6,24}$/.test(body.customerPhone))throw new PickupEligibilityError('Enter a valid contact phone number.');
  if(typeof body.requestKey!=='string'||!/^[0-9a-f-]{36}$/i.test(body.requestKey))throw new PickupEligibilityError('Refresh the page before submitting your request.');
  if(![0,15].includes(body.readyInMinutes??0))throw new PickupEligibilityError('Choose now or ready in 15 minutes.');
  return {groupSize:body.groupSize,pickupLocation:body.pickupLocation,destination:body.destination,
    customerPhone:body.customerPhone,requestKey:body.requestKey,readyInMinutes:body.readyInMinutes??0};
}
export function customerPickup(request:any) {
  return {id:request.id,status:request.status,groupSize:request.groupSize,pickupLocation:request.pickupLocation,
    destination:request.destination,requestTime:request.requestTime,readyAt:request.readyAt,
    acceptedByName:request.acceptedByName||null,acceptedAt:request.acceptedAt||null,completedTime:request.completedTime||null};
}
