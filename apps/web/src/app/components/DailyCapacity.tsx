import {useEffect,useState} from 'react';
import {authenticatedFetch} from '../lib/authenticatedFetch';
import {projectId} from '../utils/supabase/info';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';

type Day={date:string;configured:boolean;customized:boolean;capacity:number;booked:number;reserved:number;remaining:number;opens:string|null;closes:string|null;slots:Record<string,{capacity:number;booked:number;reserved:number;remaining:number}>};
export function DailyCapacity() {
  const [date,setDate]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()));
  const [day,setDay]=useState<Day|null>(null),[capacity,setCapacity]=useState('0'),[opens,setOpens]=useState('09:00'),[closes,setCloses]=useState('19:30');
  const [slots,setSlots]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[revision,setRevision]=useState(0);
  const url=`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/admin/day-capacity/${date}`;
  useEffect(()=>{let active=true;const controller=new AbortController();setDay(null);setMessage('');setBusy(true);
    authenticatedFetch(url,{signal:controller.signal,cache:'no-store'}).then(async response=>{const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'Unable to load daily capacity');return result.day as Day;})
      .then(value=>{if(active){setDay(value);setCapacity(String(value.capacity));setSlots(Object.fromEntries(Object.entries(value.slots).map(([slot,stock])=>[slot,String(stock.capacity)])));setOpens(value.opens||'09:00');setCloses(value.closes||'19:30');}})
      .catch(error=>{if(active)setMessage(error.message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;controller.abort();};
  },[url,revision]);
  async function save(){setBusy(true);setMessage('');try{
    const response=await authenticatedFetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({capacity:Number(capacity),opens,closes,slots:Object.fromEntries(Object.entries(slots).map(([slot,value])=>[slot,Number(value)]))})});
    const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'Unable to save capacity');
    setDay(result.day);setMessage('Daily capacity saved. All sales channels share these places.');
  }catch(error){setMessage(error instanceof Error?error.message:'Unable to save capacity');}finally{setBusy(false);}}
  return <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Keep your first-departure time slots and set an overall daily limit. City Cards and day passes share both limits across the app, website, drivers and merchants. Every age category uses one place. New dates default to 50 per slot and 400 per day.</p>
    <div><Label htmlFor="capacity-date">Visit date · Lisbon time</Label><Input id="capacity-date" type="date" value={date} disabled={busy} onChange={event=>{if(event.target.value)setDate(event.target.value);}}/></div>
    {day && <>
      {!day.customized && <p className="text-sm font-medium">Using the default daily limit and hours. Save to customize this date.</p>}
      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3 text-center"><div><dt>Booked</dt><dd className="text-xl font-bold">{day.booked}</dd></div><div><dt>Reserved</dt><dd className="text-xl font-bold">{day.reserved}</dd></div><div><dt>Remaining</dt><dd className="text-xl font-bold">{day.remaining}</dd></div></dl>
      <div><Label htmlFor="daily-capacity">Total cards for this date</Label><Input id="daily-capacity" type="number" min={day.booked+day.reserved} max="100000" step="1" value={capacity} disabled={busy} onChange={event=>setCapacity(event.target.value)}/></div>
      <div className="space-y-3"><h3 className="font-medium">First-departure time slots</h3><p className="text-sm text-muted-foreground">Set the total allocation per slot, including cards already booked. Checkout must fit both this slot allocation and the daily limit above.</p><div className="grid grid-cols-2 gap-3">{Object.entries(day.slots).map(([slot,stock])=><div key={slot} className="rounded-lg border p-3"><Label htmlFor={'daily-slot-'+slot}>{slot}</Label><Input id={'daily-slot-'+slot} type="number" min={stock.booked+stock.reserved} max="100000" step="1" value={slots[slot]??'0'} disabled={busy} onChange={event=>setSlots(values=>({...values,[slot]:event.target.value}))}/><p className="text-xs mt-2">{stock.booked} booked · {stock.reserved} reserved · {stock.remaining} available</p></div>)}</div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="day-opens">Transport opens</Label><Input id="day-opens" type="time" value={opens} disabled={busy} onChange={event=>setOpens(event.target.value)}/></div><div><Label htmlFor="day-closes">Transport closes</Label><Input id="day-closes" type="time" value={closes} disabled={busy} onChange={event=>setCloses(event.target.value)}/></div></div>
      <p className="text-sm text-muted-foreground">Reservations remain protected until payment is confirmed or checkout is safely cancelled. Booked dates cannot have their hours shortened.</p>
      <Button disabled={busy||capacity===''||!Number.isInteger(Number(capacity))||Number(capacity)<day.booked+day.reserved||opens>=closes||Object.entries(slots).some(([slot,value])=>value===''||!Number.isInteger(Number(value))||Number(value)<day.slots[slot].booked+day.slots[slot].reserved)} onClick={save}>{busy?'Saving…':'Save daily capacity and time slots'}</Button>
    </>}
    <Button variant="outline" disabled={busy} onClick={()=>setRevision(value=>value+1)}>Refresh counts</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}
