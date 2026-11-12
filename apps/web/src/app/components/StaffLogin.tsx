import {useState} from 'react';
import {useNavigate} from 'react-router';
import {MerchantPortal} from './MerchantPortal';
import {adminClient} from '../lib/adminClient';
import {driverClient} from '../lib/driverClient';
import {projectId} from '../utils/supabase/info';
export function StaffLogin(){
 const navigate=useNavigate(),[method,setMethod]=useState<'email'|'password'>('email'),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function signIn(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
  const response=await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/staff/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})}),value=await response.json();
  if(!response.ok||!value.success||!['admin','driver'].includes(value.role))throw Error(value.error||'Unable to sign in');
  const client=value.role==='admin'?adminClient:driverClient;const {error}=await client.auth.setSession(value.session);if(error)throw error;
  navigate(value.role==='admin'?'/admin':'/driver',{replace:true});
 }catch(e){setError(e instanceof Error?e.message:'Unable to sign in');}finally{setPassword('');setBusy(false);}}
 return <main className="max-w-xl mx-auto p-5 space-y-4"><h1 className="text-2xl font-bold">Staff sign-in</h1><p>Your administrator decides which functions you can access.</p><div className="flex gap-3"><button disabled={busy} aria-pressed={method==='email'} className="border p-3 rounded" onClick={()=>setMethod('email')}>Email code</button><button disabled={busy} aria-pressed={method==='password'} className="border p-3 rounded" onClick={()=>setMethod('password')}>Username and password</button></div>
 {method==='email'?<><p>For approved merchant staff.</p><MerchantPortal/></>:<form className="space-y-3" onSubmit={signIn}><p>For drivers and administrators using their existing credentials.</p><label className="block">Username or admin email<input required autoComplete="username" className="border p-3 w-full" value={username} onChange={e=>setUsername(e.target.value)}/></label><label className="block">Password<input required type="password" autoComplete="current-password" className="border p-3 w-full" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="border p-3 rounded">{busy?'Signing in…':'Sign in'}</button></form>}
 </main>;
}
