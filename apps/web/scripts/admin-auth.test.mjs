import test from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { createAdminGuard } from '../../../supabase/functions/make-server-3bd0ade8/admin-auth.ts';

const base = '/make-server-3bd0ade8';
function fixture() {
  let actions = 0;
  const app = new Hono();
  app.use(`${base}/*`, createAdminGuard(async (token) => {
    if (token === 'unavailable') throw new Error('Auth unavailable');
    if (token === 'admin') return { data: { user: { app_metadata: { role: 'admin' } } }, error: null };
    if (token === 'customer') return { data: { user: { user_metadata: { role: 'admin' }, app_metadata: {} } }, error: null };
    return { data: { user: null }, error: new Error('Invalid JWT') };
  }));
  app.all(`${base}/*`, (c) => { actions++; return c.json({ success: true }); });
  return {
    actions: () => actions,
    request: (method, path, token) => app.request(base + path, {
      method, headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  };
}

const protectedRoutes = [
  ['GET', '/checkins/AA-4102/0'],
  ['GET', '/admin/session'], ['GET', '/admin/pending-payments'], ['POST', '/admin/recover-payment'],
  ['POST', '/admin/reset-all-data'], ['GET', '/bookings'], ['GET', '/tour-bookings'],
  ['GET', '/tour-requests'], ['GET', '/drivers'], ['GET', '/images'],
  ['POST', '/pricing'], ['POST', '/content'], ['POST', '/comprehensive-content'],
  ['POST', '/availability/2026-09-16'], ['POST', '/settings/ticket-purchases-enabled'],
  ['POST', '/images/upload'], ['DELETE', '/images/example.png'],
  ['POST', '/private-tours'], ['POST', '/private-tours/reorder'], ['DELETE', '/private-tours/tour1'],
  ['POST', '/monuments'], ['POST', '/blog-articles'], ['POST', '/blog-categories'],
  ['POST', '/drivers/create'], ['PUT', '/drivers/driver1'], ['DELETE', '/drivers/driver1'],
  ['POST', '/tour-bookings/create-manual'], ['POST', '/tour-bookings/tour1/cancel'],
  ['PATCH', '/bookings/AA-1000/status'], ['POST', '/tour-requests/request1/status'],
  ['POST', '/tour-requests/request1/notes'], ['POST', '/test-push'],
  ['POST', '/card-products'], ['PUT', '/card-products/id'],
  ['POST', '/merchants'], ['PUT', '/merchants/id'], ['DELETE', '/merchants/id'],
  ['POST', '/deals'], ['PUT', '/deals/id'], ['DELETE', '/deals/id'],
];

for (const [method, path] of protectedRoutes) {
  test(`${method} ${path} requires a verified admin`, async () => {
    const f = fixture();
    assert.equal((await f.request(method, path)).status, 401);
    assert.equal((await f.request(method, path, 'public-anon-key')).status, 401);
    assert.equal((await f.request(method, path, 'customer')).status, 403);
    assert.equal(f.actions(), 0);
    assert.equal((await f.request(method, path, 'admin')).status, 200);
    assert.equal(f.actions(), 1);
  });
}

test('fails closed if authentication is unavailable', async () => {
  const f = fixture();
  assert.equal((await f.request('POST', '/pricing', 'unavailable')).status, 503);
  assert.equal(f.actions(), 0);
});

test('trailing slash cannot bypass the admin check', async () => {
  const f = fixture();
  assert.equal((await f.request('GET', '/bookings/')).status, 401);
});

for (const [method, path] of [
  ['GET', '/pricing'], ['GET', '/content'], ['GET', '/private-tours'],
  ['GET', '/availability/2026-09-16'], ['POST', '/create-payment-intent'],
  ['POST', '/stripe-webhook'], ['POST', '/verify-booking-login'],
  ['POST', '/drivers/login'], ['OPTIONS', '/pricing'],
]) {
  test(`${method} ${path} remains outside the admin gate`, async () => {
    const f = fixture();
    assert.equal((await f.request(method, path)).status, 200);
  });
}
