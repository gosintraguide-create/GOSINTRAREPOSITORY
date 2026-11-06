import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthenticatedFetch } from '../src/app/lib/authenticatedFetchCore.ts';

const origin = 'https://project.supabase.co';
const endpoint = origin + '/functions/v1/make-server-3bd0ade8/pricing';
function fixture(token = 'admin-session') {
  let sent;
  let lookups = 0;
  const send = createAuthenticatedFetch({
    apiOrigin: origin, baseOrigin: 'https://hoponsintra.com', publicAnonKey: 'public',
    getAccessToken: async () => { lookups++; return token; },
    send: async (input, init) => { sent = new Request(input, init); return new Response('{}'); },
  });
  return { send, sent: () => sent, lookups: () => lookups };
}

test('authenticated API calls retain method, body and existing headers', async () => {
  const f = fixture();
  await f.send(endpoint, { method: 'POST', body: '{"price":15}', headers: { Authorization: 'Bearer public', 'Content-Type': 'application/json' } });
  assert.equal(f.sent().headers.get('Authorization'), 'Bearer admin-session');
  assert.equal(f.sent().headers.get('Content-Type'), 'application/json');
  assert.equal(f.sent().method, 'POST');
  assert.equal(await f.sent().text(), '{"price":15}');
});

test('anonymous requests retain the public token', async () => {
  const f = fixture(null);
  await f.send(endpoint, { headers: { Authorization: 'Bearer public' } });
  assert.equal(f.sent().headers.get('Authorization'), 'Bearer public');
});

test('explicit caller credentials are not replaced by the admin session', async () => {
  const f = fixture();
  await f.send(new Request(endpoint, { headers: { Authorization: 'Bearer driver' } }));
  assert.equal(f.sent().headers.get('Authorization'), 'Bearer driver');
  assert.equal(f.lookups(), 0);
});

for (const url of ['https://other.test/functions/v1/make-server-3bd0ade8/pricing', origin + '/storage/v1/object', 'https://project.supabase.co.attacker.test/functions/v1/make-server-3bd0ade8/pricing']) {
  test(`does not attach admin credentials to ${url}`, async () => {
    const f = fixture();
    await f.send(url);
    assert.equal(f.sent().headers.get('Authorization'), null);
    assert.equal(f.lookups(), 0);
  });
}
