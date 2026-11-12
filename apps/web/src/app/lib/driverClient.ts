import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createAuthenticatedFetch } from './authenticatedFetchCore';
export const driverClient=createClient(`https://${projectId}.supabase.co`,publicAnonKey,{
  auth:{storageKey:'hopon-driver-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},
});
const send=createAuthenticatedFetch({apiOrigin:`https://${projectId}.supabase.co`,baseOrigin:window.location.origin,publicAnonKey,
  getAccessToken:async()=>(await driverClient.auth.getSession()).data.session?.access_token,
  send:(input,init)=>fetch(input,init),
});
export const driverFetch:typeof fetch=async(input,init)=>{
  const response=await send(input,init);
  if(response.status===401)await driverClient.auth.signOut({scope:'local'});
  return response;
};
