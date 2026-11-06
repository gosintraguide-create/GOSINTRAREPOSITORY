export type Staff = { role: 'admin' } | { role: 'driver'; driverId: string; name: string };
export interface DriverProfile {
  id: string; name: string; username: string; status: string;
  authUserId?: string; authVersion?: string; [key: string]: unknown;
}
export function publicDriver(driver: DriverProfile) {
  const { password, passwordHash, authUserId, authVersion, authEmail, ...safe } = driver;
  return safe;
}
export async function resolveStaff(token: string | undefined, deps: {
  getUser: (token: string) => Promise<{ data: { user: any }; error: unknown }>;
  getDrivers: () => Promise<DriverProfile[]>;
  sessionActive: (userId: string, sessionId: string) => Promise<boolean>;
}): Promise<Staff | null> {
  if (!token) return null;
  const { data, error } = await deps.getUser(token);
  if (error || !data.user) return null;
  if (data.user.app_metadata?.role === 'admin') return { role: 'admin' };
  if (data.user.app_metadata?.role !== 'driver') return null;
  // Decode claims only AFTER Auth has verified the token.
  let claims: any;
  try { claims = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); } catch { return null; }
  const driver = (await deps.getDrivers()).find(d => d.id === data.user.app_metadata.driver_id && d.authUserId === data.user.id);
  if (!driver || ['inactive','disabled'].includes(driver.status) || !driver.authVersion ||
      claims.app_metadata?.driver_version !== driver.authVersion || !claims.session_id ||
      !await deps.sessionActive(data.user.id, claims.session_id)) return null;
  return { role: 'driver', driverId: driver.id, name: driver.name };
}

export function createStaffGuard(resolve: (token?: string) => Promise<Staff | null>) {
  return async (c: any, next: () => Promise<void>) => {
    const path = c.req.path.replace(/^\/make-server-3bd0ade8/, '').replace(/\/+$/, '');
    const protectedPath = /^\/drivers\/[^/]+\/(metrics|activity)$/.test(path) ||
      ['/drivers/session','/drivers/logout','/drivers/record-scan','/driver-sales/create','/checkin','/verify-qr'].includes(path) ||
      (path.startsWith('/pickup-requests') && !(path === '/pickup-requests' && c.req.method === 'POST') && !(path === '/pickup-requests/mine' && c.req.method === 'GET'));
    if (!protectedPath || c.req.method === 'OPTIONS') return next();
    c.header('Cache-Control','no-store');
    try {
      const actor = await resolve(c.req.header('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]);
      if (!actor) return c.json({ success: false, error: 'Please sign in to continue' },401);
      if (actor.role === 'driver') {
        const own = path.match(/^\/drivers\/([^/]+)\/(metrics|activity)$/);
        if (own && decodeURIComponent(own[1]) !== actor.driverId) return c.json({success:false,error:'Access denied'},403);
        if (['/driver-sales/create','/drivers/logout','/drivers/record-scan'].includes(path)) {
          const body = await c.req.json();
          if (body.driverId !== actor.driverId) return c.json({success:false,error:'Access denied'},403);
        }
        if (path.endsWith('/cancel')) return c.json({success:false,error:'Administrator access required'},403);
      }
      c.set('staff',actor);
      await next();
      if (actor.role === 'driver' && c.req.method === 'GET' && path === '/pickup-requests' && c.res.ok) {
        const data=await c.res.clone().json();
        data.requests=(data.requests || []).filter((r:any)=>r.acceptedBy === actor.driverId);
        c.res=new Response(JSON.stringify(data),{status:c.res.status,headers:c.res.headers});
      }
    } catch { return c.json({success:false,error:'Authentication unavailable'},503); }
  };
}
