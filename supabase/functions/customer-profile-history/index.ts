import {createClient} from 'jsr:@supabase/supabase-js@2';
import {profileHistory} from './handler.ts';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
const allowed = new Set(['https://www.hoponsintra.com','https://hoponsintra.com', ...(Deno.env.get('PROFILE_PREVIEW_ORIGINS') || '').split(',').map(s=>s.trim()).filter(Boolean)]);
Deno.serve(async request => {
  const origin = request.headers.get('Origin');
  if (origin && !allowed.has(origin)) return new Response('Origin not allowed',{status:403});
  const headers = new Headers({'Cache-Control':'private, no-store','Vary':'Origin','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'});
  if(origin) headers.set('Access-Control-Allow-Origin',origin);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers});
  const response=await profileHistory(request,db);
  for(const [name,value] of headers) response.headers.set(name,value);
  return response;
});
