import { useEffect, useState } from 'react';
import { DriverLoginPage } from './DriverLoginPage';
import { DriverDashboard } from './DriverDashboard';
import { driverClient, driverFetch } from '../lib/driverClient';
import { projectId } from '../utils/supabase/info';
export function DriverPortalPage() {
  const [driver,setDriver]=useState<any>(null);
  const [token,setToken]=useState('');
  const [checking,setChecking]=useState(true);
  useEffect(()=>{
    let active=true,revision=0;
    for(const key of ['driver','driverToken','driver_session'])localStorage.removeItem(key);
    const validate=async()=>{
      const current=++revision;
      try {
        const {data:{session}}=await driverClient.auth.getSession();
        if(!session)throw new Error('No session');
        const response=await driverFetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/drivers/session`);
        const result=await response.json();
        if(!response.ok||!result.driver)throw new Error('Invalid session');
        if(active&&current===revision){setDriver(result.driver);setToken(session.access_token);}
      }catch{if(active&&current===revision){setDriver(null);setToken('');}}
      finally{if(active&&current===revision)setChecking(false);}
    };
    const {data:{subscription}}=driverClient.auth.onAuthStateChange(event=>{
      if(event==='SIGNED_OUT'){++revision;setDriver(null);setToken('');setChecking(false);}
      else setTimeout(()=>{if(active)void validate();},0);
    });
    return()=>{active=false;subscription.unsubscribe();};
  },[]);
  if(checking)return <p className="p-8" role="status">Checking driver session…</p>;
  if(!driver||!token)return <DriverLoginPage onLoginSuccess={(profile,accessToken)=>{setDriver(profile);setToken(accessToken);}}/>;
  return <DriverDashboard driver={driver} token={token} onLogout={()=>{
    void driverClient.auth.signOut();setDriver(null);setToken('');
  }}/>;
}
