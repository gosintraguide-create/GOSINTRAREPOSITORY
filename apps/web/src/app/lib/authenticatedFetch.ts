import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createAuthenticatedFetch } from './authenticatedFetchCore';

// Explicit wrapper, not a global fetch replacement. Never send the admin token
// to third-party hosts or other Supabase services.
const adminFetch = createAuthenticatedFetch({
  apiOrigin: `https://${projectId}.supabase.co`,
  baseOrigin: window.location.origin,
  publicAnonKey,
  getAccessToken: async () => {
    if(localStorage.getItem('hopon-admin-auth')) {
      const {adminClient}=await import('./adminClient');
      const {data}=await adminClient.auth.getSession();
      if(data.session)return data.session.access_token;
    }
    if(localStorage.getItem('hopon-driver-auth')) {
      const {driverClient}=await import('./driverClient');
      return (await driverClient.auth.getSession()).data.session?.access_token;
    }
    return undefined;
  },
  send: (input, init) => fetch(input, init),
});


export async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  const api = url.origin === `https://${projectId}.supabase.co` && url.pathname.startsWith('/functions/v1/make-server-3bd0ade8/');
  if (!api) return adminFetch(input, init);
  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  const path = url.pathname.replace('/functions/v1/make-server-3bd0ade8', '');
  let id = path.match(/^\/bookings\/([^/]+)/)?.[1] || (path === '/pickup-requests/mine' ? url.searchParams.get('bookingId') || undefined : undefined);
  try {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    id = body.bookingCode || (path === '/pickup-requests' ? body.bookingId : undefined) || body.pendingSunsetSpecialData?.bookingId || id;
    if (id) {
      const token = sessionStorage.getItem('booking-access:' + id);
      if (token) headers.set('X-Booking-Token', token);
    }
  } catch {}
  let response = await adminFetch(input, { ...init, headers });
  // Existing signed-in customers can obtain the new token using their saved credentials.
  if (response.status === 401 && id && !headers.has('X-Booking-Token')) {
    try {
      const session = JSON.parse(localStorage.getItem('hop_on_sintra_user_session') || 'null');
      if (session?.bookingId === id && session.lastName) {
        const login = await adminFetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login`, {
          method: 'POST', headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: id, lastName: session.lastName }),
        });
        const data = await login.json();
        if (data.success && data.booking?.accessToken) {
          sessionStorage.setItem('booking-access:' + id, data.booking.accessToken);
          headers.set('X-Booking-Token', data.booking.accessToken);
          response = await adminFetch(input, { ...init, headers });
        }
      }
    } catch {}
  }
  if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
    try {
      const data = await response.clone().json();
      if (data.success && data.paymentIntentId && data.holdExpiresAt) sessionStorage.setItem('checkout-hold:' + data.paymentIntentId, data.holdExpiresAt);
      const booking = data.booking;
      if (data.success && booking?.accessToken && (booking.id || booking.bookingId)) sessionStorage.setItem('booking-access:' + (booking.id || booking.bookingId), booking.accessToken);
    } catch {}
  }
  return response;
}
