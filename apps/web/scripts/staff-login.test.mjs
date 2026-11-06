import test from 'node:test';
import assert from 'node:assert/strict';
import {Hono} from 'hono';
import {createStaffPasswordLogin} from '../../../supabase/functions/make-server-3bd0ade8/staff-login.ts';
test('shared login delegates verification and ignores requested roles',async()=>{
 const calls=[];const app=new Hono();app.post('/login',createStaffPasswordLogin(async(path,body)=>{calls.push({path,body});return Response.json(body.password==='valid'?{session:{access_token:'fixture',refresh_token:'fixture'}}:{error:'Invalid credentials'},{status:body.password==='valid'?200:401});}));
 const login=async body=>{const r=await app.request('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 assert.equal((await login({username:'driver1',password:'valid',role:'admin'})).role,'driver');assert.equal(calls[0].path,'/drivers/login');
 assert.equal((await login({username:'VascoTimm@gmail.com',password:'valid'})).role,'admin');assert.equal(calls[1].path,'/admin/login');assert.equal(calls[1].body.username,'vascotimm');
 assert.equal((await login({username:'vascotimm',password:'wrong'})).status,401);
 assert.equal((await login({username:'customer@example.invalid',password:'wrong'})).status,401);
 assert.equal((await login({username:'driver1',password:''})).status,401);
});
test('shared login preserves rate limits',async()=>{
 const app=new Hono();app.post('/login',createStaffPasswordLogin(async()=>Response.json({error:'Try again later'},{status:429})));
 const r=await app.request('/login',{method:'POST',body:JSON.stringify({username:'driver',password:'fixture'})});assert.equal(r.status,429);
});
