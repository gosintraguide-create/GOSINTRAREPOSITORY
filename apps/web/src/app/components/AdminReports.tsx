import {useEffect,useState} from 'react';
import {authenticatedFetch} from '../lib/authenticatedFetch';
import {projectId} from '../utils/supabase/info';
const money=(n:number)=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(Number(n||0)/100);
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Lisbon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dayBefore=(date:string,n:number)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-n);return d.toISOString().slice(0,10);};
const labels:Record<string,string>={stripe:'Online / Stripe',cash:'Cash',terminal:'Card terminal',unknown:'Not recorded'};
type Row=Record<string,any>;
function Table({columns,rows}: {columns:[string,(row:Row)=>React.ReactNode][],rows:Row[]}){
 return rows.length?<div className="report-table-wrap"><table className="report-table"><thead><tr>{columns.map(([name])=><th key={name}>{name}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||r.key||i}>{columns.map(([name,render])=><td key={name}>{render(r)}</td>)}</tr>)}</tbody></table></div>:<p className="admin-empty">No records match these filters.</p>;
}
export function AdminReports({mode='finance'}:{mode?:'finance'|'drivers'|'merchants'|'perks'}){
 const perks=mode==='perks',initial=today();
 const [filters,setFilters]=useState({from:initial.slice(0,7)+'-01',to:initial,basis:'ordered',channel:'',q:'',seller:'',partner:''});
 const [applied,setApplied]=useState(filters),[page,setPage]=useState(0),[data,setData]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [revision,setRevision]=useState(0),[selectedName,setSelectedName]=useState('');
 useEffect(()=>{let live=true;setBusy(true);setError('');setData(null);
  const query=new URLSearchParams({...applied,kind:perks?'perks':'sales',role:mode==='drivers'?'driver':mode==='merchants'?'merchant':'',page:String(page)});
  authenticatedFetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/admin/operations/reports?${query}`).then(async r=>{if(r.status===404)throw Error('Reports are not available on the connected server yet.');const v=await r.json();if(!r.ok||!v.success)throw Error(v.error||'Report unavailable');if(live)setData(v.report);}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setBusy(false);});return()=>{live=false;};
 },[applied,page,mode,revision]);
 function apply(next=filters){setFilters(next);setApplied({...next});setPage(0);}
 function preset(days:number|null){const to=today();apply({...filters,from:days===null?'':dayBefore(to,days-1),to:days===null?'':to});}
 function drill(key:string,name:string){setSelectedName(name);apply({...filters,[perks?'partner':'seller']:key});}
 const financial:[string,(r:Row)=>React.ReactNode][]=[['Orders',r=>r.orders],['Cards',r=>r.cards],['Gross sales',r=>money(r.gross)],['Refunds paid',r=>money(r.refunded)],['Refunds outstanding',r=>money(r.outstanding)],['Net collected',r=>money(r.net)]];
 function exportRows(){if(!data)return;const rows=data.rows;const keys=perks?['redeemed_at','partner','title','booking_id','passenger_index','staff_email']:['id','booking_id','report_date','visit_date','seller_name','channel','cards','gross','refunded','outstanding','net'];
  const cell=(v:any)=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const content=[keys,...rows.map((r:Row)=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`${mode}-page-${page+1}.csv`;a.click();URL.revokeObjectURL(url);
 }
 return <section className="admin-reports"><div className="report-heading"><div><p className="report-eyebrow">BUSINESS REPORTS</p><h2>{{finance:'Financial overview',drivers:'Card sales by driver',merchants:'Card sales by merchant',perks:'Perk usage by partner'}[mode]}</h2><p>{perks?'Confirmed redemptions and unique cards, grouped by partner and offer.':'City Card sales, refunds and seller performance in one place.'}</p></div><button onClick={()=>setRevision(n=>n+1)} disabled={busy}>Refresh</button></div>
 <form className="report-filters" onSubmit={e=>{e.preventDefault();apply();}}>
  <label>From<input type="date" value={filters.from} max={filters.to||undefined} onChange={e=>setFilters({...filters,from:e.target.value})}/></label>
  <label>To<input type="date" value={filters.to} min={filters.from||undefined} onChange={e=>setFilters({...filters,to:e.target.value})}/></label>
  {!perks&&<><label>Date basis<select value={filters.basis} onChange={e=>setFilters({...filters,basis:e.target.value})}><option value="ordered">Order created date</option><option value="visit">Visit date</option></select></label><label>Payment method<select value={filters.channel} onChange={e=>setFilters({...filters,channel:e.target.value})}><option value="">All methods</option>{Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></>}
  <label className="report-search">Search<input value={filters.q} maxLength={100} placeholder={perks?'Partner, offer, booking or staff email':'Customer email, booking or seller'} onChange={e=>setFilters({...filters,q:e.target.value})}/></label><button type="submit" disabled={busy}>Apply filters</button>
 </form><div className="report-presets"><button onClick={()=>preset(1)}>Today</button><button onClick={()=>preset(7)}>Last 7 days</button><button onClick={()=>preset(30)}>Last 30 days</button><button onClick={()=>{const to=today();apply({...filters,from:to.slice(0,7)+'-01',to});}}>This month</button><button onClick={()=>preset(null)}>All dates</button>{(applied.seller||applied.partner)&&<button onClick={()=>{setSelectedName('');apply({...filters,seller:'',partner:''});}}>Clear {selectedName} filter ×</button>}</div>
 <p className="report-definition">{perks?'Dates use Lisbon time. A scan counts only after the partner confirms redemption. Retries count once; repeat uses of unlimited offers count separately. Failed scans are not recorded.':'Paid City Card orders only; legacy passes and tours are excluded. Dates use Lisbon time. Refunds are attributed to the selected orders, including refunds processed later. Net collected = gross sales − refunds paid, before fees; it is not profit or a cash-flow statement.'}</p>
 {error&&<p className="admin-notice" role="alert">{error}</p>}{busy&&<p role="status">Loading report…</p>}
 {data&&<><p className="report-period">{applied.from||'Beginning'} — {applied.to||'Present'}{selectedName?' · '+selectedName:''} · {perks?'Redemption date':applied.basis==='visit'?'Visit date':'Order created date'}</p>
 <div className="report-stats">{(perks?[['Confirmed uses',data.summary.uses],['Unique cards',data.summary.unique_cards],['Partners used',data.summary.partners]]:[['Gross sales',money(data.summary.gross)],['Refunds paid',money(data.summary.refunded)],['Refunds outstanding',money(data.summary.outstanding)],['Net collected',money(data.summary.net)]]).map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
 {!perks&&<p>{data.summary.orders} paid orders · {data.summary.cards} cards issued ({data.summary.full} full / {data.summary.half} half / {data.summary.free} free) · {data.summary.cancelled} subsequently cancelled</p>}
 <h3>{perks?'Partner performance':'Seller performance'}</h3><p>Select a name to browse its individual records.</p>
 <Table rows={perks?data.partners:data.sellers} columns={perks?[
  ['Partner',r=><button className="report-link" onClick={()=>drill(r.key,r.name)}>{r.name}</button>],['Confirmed uses',r=>r.uses],['Unique cards',r=>r.unique_cards],['Offers used',r=>r.offers]
 ]:[['Seller',r=><button className="report-link" onClick={()=>drill(r.key,r.name)}>{r.name}</button>],['Type',r=>r.role],...financial]}/>
 {perks?<><h3>Usage by offer</h3><Table rows={data.offers} columns={[[ 'Partner',r=>r.partner],['Offer',r=>r.title],['Confirmed uses',r=>r.uses],['Unique cards',r=>r.unique_cards]]}/></>:<><h3>Payment methods</h3><Table rows={data.channels} columns={[[ 'Method',r=>labels[r.channel]||r.channel],...financial]}/></>}
 <details className="report-daily"><summary>Daily breakdown · {data.daily.length} days with activity</summary><Table rows={data.daily} columns={perks?[[ 'Date',r=>r.date],['Uses',r=>r.uses],['Unique cards',r=>r.unique_cards]]:[[ 'Date',r=>r.date],...financial]}/></details>
 <div className="report-heading"><h3>{perks?'Redemption history':'Individual orders'}</h3><button onClick={exportRows} disabled={!data.rows.length}>Export this page (CSV)</button></div>
 {!perks&&<p className="report-definition">CSV monetary amounts are integer euro cents.</p>}
 <Table rows={data.rows} columns={perks?[
  ['Used at',r=>new Date(r.redeemed_at).toLocaleString('en-GB',{timeZone:'Europe/Lisbon'})],['Partner / offer',r=><>{r.partner}<small>{r.title}</small></>],['Card',r=>`${r.booking_id} · #${r.passenger_index+1}`],['Confirmed by',r=>r.staff_email]
 ]:[['Order',r=><details><summary>{r.booking_id||r.id}</summary><p>{r.email}</p><small>Created: {new Date(r.created_at).toLocaleString('en-GB',{timeZone:'Europe/Lisbon'})}<br/>Visit: {r.visit_date}<br/>{r.full_cards} full / {r.half_cards} half / {r.free_cards} free<br/>{r.cancelled_cards} cancelled</small></details>],['Seller',r=>r.seller_name],['Method',r=>labels[r.channel]||r.channel],['Cards',r=>r.cards],['Gross',r=>money(r.gross)],['Refunded',r=>money(r.refunded)],['Outstanding',r=>money(r.outstanding)],['Net',r=>money(r.net)]]}/>
 <div className="report-pagination"><span>{data.total?`${page*25+1}–${Math.min((page+1)*25,data.total)} of ${data.total}`:'0 records'}</span><button disabled={page===0||busy} onClick={()=>setPage(n=>n-1)}>Previous</button><button disabled={(page+1)*25>=data.total||busy} onClick={()=>setPage(n=>n+1)}>Next</button></div>
 </>}
 </section>;
}
