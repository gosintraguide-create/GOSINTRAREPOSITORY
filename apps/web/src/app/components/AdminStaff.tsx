import {useEffect,useState} from 'react';
import {MerchantAccess} from './MerchantAccess';
import {DriverManagement} from './DriverManagementMobile';
import {authenticatedFetch} from '../lib/authenticatedFetch';
import {projectId} from '../utils/supabase/info';
export function AdminStaff(){const [merchants,setMerchants]=useState<any[]>([]),[error,setError]=useState('');useEffect(()=>{authenticatedFetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/merchants`).then(r=>r.json()).then(v=>{if(!v.success)throw Error(v.error||'Unable to load businesses');setMerchants(v.merchants);}).catch(e=>setError(e.message));},[]);return <div className="space-y-6"><h2 className="text-xl font-bold">Staff & access</h2><p>Merchant staff have independent scanning/sales permissions. Drivers retain all driver functions. Administrator access remains restricted to verified administrators.</p>{error&&<p role="alert">{error}</p>}<MerchantAccess merchants={merchants}/><h3 className="font-bold">Driver accounts</h3><DriverManagement/></div>;}
