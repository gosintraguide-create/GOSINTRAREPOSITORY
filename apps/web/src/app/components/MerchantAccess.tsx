import {useEffect,useState} from 'react';
import {authenticatedFetch} from '../lib/authenticatedFetch';
import {projectId} from '../utils/supabase/info';
const empty={email:'',merchant_id:'',display_name:'',is_active:true,can_scan:true,can_sell:false};
export function MerchantAccess({merchants}:{merchants:any[]}) {
 const [rows,setRows]=useState<any[]>([]),[draft,setDraft]=useState(empty),[editing,setEditing]=useState(false),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const base=`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/admin/merchant-access`;
 async function load(){const r=await authenticatedFetch(base),v=await r.json();if(!r.ok||!v.success)throw Error(v.error||'Unable to load profiles');setRows(v.access);}
 useEffect(()=>{void load().catch(e=>setMessage(e.message));},[]);
 async function save(p:typeof empty){setBusy(true);setMessage('');try{const r=await authenticatedFetch(base,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:p.email,name:p.display_name,merchantId:p.merchant_id,active:p.is_active,canScan:p.can_scan,canSell:p.can_sell})}),v=await r.json();if(!r.ok||!v.success)throw Error(v.error||'Unable to save');await load();setDraft(empty);setEditing(false);setMessage('Profile saved. Staff sign in at /staff.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save');}finally{setBusy(false);}}
 return <section className="border rounded-xl p-4 space-y-3"><h2 className="font-bold">Merchant staff profiles</h2><p>Give each person their own login. Enable scanning, sales, or both. Offer management stays admin-only.</p>
 <form onSubmit={e=>{e.preventDefault();void save(draft);}}><fieldset disabled={busy} className="flex flex-wrap gap-3">
 <label>Name<input required maxLength={80} className="border p-2 block" value={draft.display_name} onChange={e=>setDraft({...draft,display_name:e.target.value})}/></label>
 <label>Login email<input type="email" required disabled={editing} className="border p-2 block" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})}/></label>
 <label>Business<select required className="border p-2 block" value={draft.merchant_id} onChange={e=>setDraft({...draft,merchant_id:e.target.value,can_sell:merchants.find(m=>m.id===e.target.value)?.is_test?false:draft.can_sell})}><option value="">Choose business</option>{merchants.filter(m=>m.is_active||m.id===draft.merchant_id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
 <label><input type="checkbox" checked={draft.can_scan} onChange={e=>setDraft({...draft,can_scan:e.target.checked})}/> Scan offers</label>
 <label><input type="checkbox" disabled={merchants.find(m=>m.id===draft.merchant_id)?.is_test} checked={draft.can_sell} onChange={e=>setDraft({...draft,can_sell:e.target.checked})}/> Sell cards</label>
 <label><input type="checkbox" checked={draft.is_active} onChange={e=>setDraft({...draft,is_active:e.target.checked})}/> Active</label>
 <button className="border p-2">{editing?'Save changes':'Create profile'}</button>{editing&&<button type="button" onClick={()=>{setDraft(empty);setEditing(false);}}>Cancel editing</button>}
 </fieldset></form><p role="status">{message}</p>
 {rows.map(r=><div key={r.email} className="border-t pt-2 flex flex-wrap gap-3"><span>{r.display_name||r.email} · {merchants.find(m=>m.id===r.merchant_id)?.name} · {r.is_active?'Active':'Disabled'} · {[r.can_scan?'Scanning':null,r.can_sell?'Sales':null].filter(Boolean).join(' + ')||'No functions'}</span><button disabled={busy} onClick={()=>{setDraft(r);setEditing(true);}}>Edit profile</button><button disabled={busy} onClick={()=>void save({...r,is_active:!r.is_active})}>{r.is_active?'Revoke access':'Enable access'}</button></div>)}
 </section>;
}
