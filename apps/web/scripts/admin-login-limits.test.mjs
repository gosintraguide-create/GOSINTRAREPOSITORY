import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../../../.tmp-capacity-tests/node_modules/@electric-sql/pglite/dist/index.js';
const db=new PGlite();
await db.exec('create role anon; create role authenticated; create role service_role;');
await db.exec(await readFile(new URL('../../../supabase/migrations/20261101012000_admin_login_limits.sql',import.meta.url),'utf8'));
test('admin login attempts are atomically capped and recover after the window',async()=>{
 await db.exec('set role service_role');
 for(let i=0;i<20;i++)assert.equal((await db.query('select allow_admin_login() as ok')).rows[0].ok,true);
 assert.equal((await db.query('select allow_admin_login() as ok')).rows[0].ok,false);
 await db.exec("reset role; update admin_login_limits set window_start=now()-interval '16 minutes'; set role service_role");
 assert.equal((await db.query('select allow_admin_login() as ok')).rows[0].ok,true);
 await db.exec('reset role');
});
test('public users cannot call or reset login rate limits',async()=>{
 for(const role of ['anon','authenticated']){
  await db.exec(`set role ${role}`);
  await assert.rejects(db.query('select allow_admin_login()'),/permission denied/);
  await assert.rejects(db.query('delete from admin_login_limits'),/permission denied/);
  await db.exec('reset role');
 }
});
test.after(()=>db.close());
