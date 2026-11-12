import {StaffCardSales} from './StaffCardSales';
import {useEffect,useRef,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
import {projectId,publicAnonKey} from '../utils/supabase/info';
const client=createClient(`https://${projectId}.supabase.co`,publicAnonKey,{auth:{storageKey:'hopon-merchant-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const base=`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;
async function api(path:string,body?:unknown){const {data}=await client.auth.getSession();const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(data.session?.access_token||'')},body:body?JSON.stringify(body):undefined});const v=await r.json();if(!r.ok||!v.success)throw Object.assign(Error(v.error||'Request failed'),{status:r.status});return v;}
export function MerchantPortal(){
 const [signed,setSigned]=useState(false),[email,setEmail]=useState(''),[code,setCode]=useState(''),[sent,setSent]=useState(false),[session,setSession]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[deal,setDeal]=useState(''),[qr,setQr]=useState(''),[receipt,setReceipt]=useState<any>(null),[camera,setCamera]=useState(false);
 const video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),request=useRef<string|null>(null),locked=useRef(false),generation=useRef(0);
 function stop(){generation.current++;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(timer.current)clearTimeout(timer.current);setCamera(false);}
 useEffect(()=>{let active=true;client.auth.getSession().then(({data})=>{if(active)setSigned(!!data.session);});const {data}=client.auth.onAuthStateChange((_event,s)=>{setSigned(!!s);if(!s){setSession(null);setReceipt(null);}});return()=>{active=false;data.subscription.unsubscribe();generation.current++;stream.current?.getTracks().forEach(t=>t.stop());if(timer.current)clearTimeout(timer.current);};},[]);
 useEffect(()=>{let active=true;if(signed)api('/merchant/session').then(v=>{if(active){setSession(v);setDeal(v.offers[0]?.id||'');setError('');}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[signed]);
 async function authenticate(){setBusy(true);setError('');try{if(sent){const {error}=await client.auth.verifyOtp({email:email.trim().toLowerCase(),token:code.trim(),type:'email'});if(error)throw error;}else{const {error}=await client.auth.signInWithOtp({email:email.trim().toLowerCase(),options:{shouldCreateUser:true}});if(error)throw error;setSent(true);}}catch(e){setError(e instanceof Error?e.message:'Sign-in failed');}finally{setBusy(false);}}
 async function check(value=qr){if(locked.current||!deal)return;stop();locked.current=true;setBusy(true);setError('');setReceipt(null);request.current=crypto.randomUUID();setQr(value);try{const v=await api('/merchant/check',{qr:value.trim(),dealId:deal,requestId:request.current});setReceipt(v.receipt);}catch(e){setError(e instanceof Error?e.message:'Card check failed');}finally{locked.current=false;setBusy(false);}}
 async function redeem(){if(locked.current||!receipt||receipt.redeemed)return;locked.current=true;setBusy(true);setError('');try{const v=await api('/merchant/redeem',{qr:qr.trim(),dealId:deal,requestId:request.current});setReceipt(v.receipt);}catch(e){setError(e instanceof Error?e.message:'Could not confirm redemption. Retry this same scan.');}finally{locked.current=false;setBusy(false);}}
 async function start(){stop();const run=generation.current;setError('');setCamera(true);try{
  const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});if(run!==generation.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
  const {default:decode}=await import('jsqr');if(!video.current||run!==generation.current){media.getTracks().forEach(t=>t.stop());return;}video.current.srcObject=media;await video.current.play();
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  const scan=()=>{const v=video.current;if(run!==generation.current||!v||!ctx)return;if(v.readyState>=2&&v.videoWidth){canvas.width=v.videoWidth;canvas.height=v.videoHeight;ctx.drawImage(v,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),found=decode(pixels.data,pixels.width,pixels.height);if(found){void check(found.data);return;}}timer.current=setTimeout(scan,180);};scan();
 }catch(e){stop();setError('Camera unavailable. Allow camera access, or use a connected QR scanner in the code field.');}}
 const button='rounded-lg bg-[#0A4D5C] text-white px-4 py-3 disabled:opacity-50';
 return <main className="max-w-lg mx-auto p-5 space-y-4"><h1 className="text-2xl font-bold">Merchant workspace</h1><p>Your enabled functions appear below.</p>
 {!!error&&<p role="alert" className="text-red-700">{error}</p>}
 {!signed?<form className="space-y-4" onSubmit={e=>{e.preventDefault();void authenticate();}}><label className="block">Approved business email<input className="border p-3 w-full" type="email" required value={email} disabled={sent||busy} onChange={e=>setEmail(e.target.value)}/></label>{sent&&<label className="block">Email verification code<input className="border p-3 w-full" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)}/></label>}<button className={button} disabled={busy}>{sent?'Verify code':'Send sign-in code'}</button>{sent&&<button type="button" onClick={()=>{setSent(false);setCode('');}}>Use another email</button>}</form>:<>
 <button className={button} onClick={()=>{stop();void client.auth.signOut();}}>Sign out</button>
 {session?.merchant.canSell&&<StaffCardSales api={api}/>}
 {session&&!session.merchant.canScan&&!session.merchant.canSell&&<p>No functions are enabled. Contact your administrator.</p>}
 {session?.merchant.canScan&&<><h2 className="text-xl">{session.merchant.name}</h2>{!session.offers.length?<p>No active offers. Contact the administrator.</p>:<>
 <label className="block">Offer<select className="border p-3 w-full" value={deal} disabled={busy||camera||!!receipt&&!receipt.redeemed} onChange={e=>{setDeal(e.target.value);setReceipt(null);request.current=null;}}>{session.offers.map((o:any)=><option key={o.id} value={o.id}>{o.title} · {o.is_single_use?'single use':'unlimited'}</option>)}</select></label>
 {!receipt&&<><button className={button} disabled={busy||camera} onClick={()=>{void start();}}>Scan with camera</button>{camera&&<><video ref={video} muted playsInline className="w-full rounded-lg"/><button className={button} onClick={stop}>Stop camera</button></>}<label className="block">QR scanner input<input className="border p-3 w-full" value={qr} disabled={busy||camera} onChange={e=>setQr(e.target.value)}/></label><button className={button} disabled={busy||camera||!qr} onClick={()=>{void check();}}>Check card</button></>}
 {receipt&&<section className="border rounded-lg p-4 space-y-3" aria-live="polite"><h2 className="text-xl">{receipt.redeemed?'Redemption recorded':'Confirm offer use'}</h2><p>{receipt.name}</p><p>{receipt.title}</p><p>{receipt.terms}</p>{!receipt.redeemed&&<button className={button} disabled={busy} onClick={()=>{void redeem();}}>Confirm redemption</button>}{receipt.redeemed&&<p>Reference: {receipt.id}</p>}<button className={button} disabled={busy} onClick={()=>{setReceipt(null);setQr('');request.current=null;}}>Next scan</button></section>}
 </>}</>}
 </>}
 </main>;
}



