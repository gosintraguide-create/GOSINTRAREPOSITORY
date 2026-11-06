const encoder = new TextEncoder();
export async function bookingToken(secret: string, id: string) {
  if (!secret || !id) throw new Error("Booking access unavailable");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`booking-access-v1:${id}`));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join("");
}
export async function validBookingToken(secret: string, id: string, token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const expected = await bookingToken(secret, id);
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return mismatch === 0;
}

export function createBookingAccessGuard(secret: string, isAdmin: (auth?: string) => Promise<boolean>, allowLogin?: (id: string) => Promise<boolean>) {
  return async (c: any, next: () => Promise<void>) => {
    const path = c.req.path.replace(/^\/make-server-3bd0ade8/, "");
    if (c.req.method === "OPTIONS") return next();
    if (c.req.method === "POST" && ["/bookings/lookup", "/verify-booking-login"].includes(path) && allowLogin) {
      const body = await c.req.json();
      if (typeof body.bookingId !== "string" || !body.bookingId.trim()) return c.json({ success: false, error: "Booking credentials required" }, 400);
      if (!await allowLogin(body.bookingId.trim().toUpperCase())) return c.json({ success: false, error: "Too many sign-in attempts. Please wait 15 minutes or contact support." }, 429);
    }
    const match = path.match(/^\/bookings\/([^/]+)(?:\/(full|pdf|add-sunset-special))?$/);
    let id: string | undefined;
    if (match && ((c.req.method === "GET") || match[2] === "add-sunset-special")) id = decodeURIComponent(match[1]);
    if (path === "/verify-booking") id = (await c.req.json()).bookingCode;
    if (path === "/create-payment-intent") id = (await c.req.json()).pendingSunsetSpecialData?.bookingId;
    if (id && !await validBookingToken(secret, id, c.req.header("X-Booking-Token")) && !await isAdmin(c.req.header("Authorization"))) {
      return c.json({ success: false, error: "Please sign in to your booking before opening tickets." }, 401);
    }
    await next();
    // Only credential-verified lookup and verified payment completion issue access.
    const issuers = ["/bookings", "/bookings/lookup", "/verify-booking-login", "/finalize-payment"];
    if (c.req.method === "POST" && issuers.includes(path) && c.res.ok) {
      const data = await c.res.clone().json();
      const booking = data.success && data.booking;
      const bookingId = booking?.id || booking?.bookingId;
      if (bookingId) {
        booking.accessToken = await bookingToken(secret, bookingId);
        c.res = new Response(JSON.stringify(data), { status: c.res.status, headers: c.res.headers });
      }
    }
    if (id || issuers.includes(path)) c.header("Cache-Control", "private, no-store");
  };
}
