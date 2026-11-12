import test from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { createAdminLogin } from '../../../supabase/functions/make-server-3bd0ade8/admin-login.ts';
import { createAdminGuard } from '../../../supabase/functions/make-server-3bd0ade8/admin-auth.ts';
function fixture({allowed=true,role='admin',fail=false}={}) {
 const calls=[]; const app=new Hono();
 app.use('/make-server-3bd0ade8/*',createAdminGuard(async()=>({data:{user:null},error:true})));
 app.post('/make-server-3bd0ade8/admin/login',createAdminLogin({
  allowAttempt:async()=>{if(fail)throw new Error('Unavailable');return allowed;},
  signIn:async(email,password)=>{
   calls.push({email,password});
   return {data:{session:password==='test-only-password'?{access_token:'verified-access',refresh_token:'verified-refresh'}:null,user:{app_metadata:{role}}},error:null};
  },
 }));
 return {calls,login:body=>app.request('/make-server-3bd0ade8/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})};
}
test('username resolves server-side and returns only verified admin tokens without caching',async()=>{
 const f=fixture(); const r=await f.login({username:' VASCOTIMM ',password:'test-only-password',email:'attacker@example.invalid',role:'admin'});
 assert.equal(r.status,200); assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(f.calls[0].email,'vascotimm@gmail.com');
 assert.deepEqual(await r.json(),{session:{access_token:'verified-access',refresh_token:'verified-refresh'}});
});
test('invalid alias, password, malformed input and non-admin identity never receive tokens',async()=>{
 for(const body of [{username:'other',password:'test-only-password'},{username:'vascotimm',password:'wrong'},{username:[],password:'test-only-password'},{}]) {
  const r=await fixture().login(body); assert.equal(r.status,401); assert.equal((await r.json()).session,undefined);
 }
 assert.equal((await fixture({role:'customer'}).login({username:'vascotimm',password:'test-only-password'})).status,401);
});
test('rate limiting and unavailable rate-limit storage fail closed before authentication',async()=>{
 for(const [options,status] of [[{allowed:false},429],[{fail:true},503]]) {
  const f=fixture(options);assert.equal((await f.login({username:'vascotimm',password:'test-only-password'})).status,status);assert.equal(f.calls.length,0);
 }
});
