type Session = { access_token: string; refresh_token: string };
type AuthResult = { data: { session: Session | null; user: { app_metadata?: Record<string, unknown> } | null }; error: unknown };
interface Dependencies {
  allowAttempt: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
}

// A login alias, not a credential or an authorization rule. Only Supabase Auth
// verifies the password; only server-managed app_metadata grants admin access.
export function createAdminLogin(deps: Dependencies) {
  return async (c: any) => {
    c.header('Cache-Control', 'no-store');
    try {
      const body = await c.req.json();
      if (typeof body.username !== 'string' || typeof body.password !== 'string' ||
          body.username.length > 100 || body.password.length > 1024 || !body.password) {
        return c.json({ error: 'Invalid username or password' }, 401);
      }
      if (!await deps.allowAttempt()) return c.json({ error: 'Too many sign-in attempts. Please try again in 15 minutes.' }, 429);
      if (body.username.trim().toLowerCase() !== 'vascotimm') return c.json({ error: 'Invalid username or password' }, 401);
      const { data, error } = await deps.signIn('vascotimm@gmail.com', body.password);
      if (error || !data.session || data.user?.app_metadata?.role !== 'admin') {
        return c.json({ error: 'Invalid username or password' }, 401);
      }
      return c.json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
    } catch {
      return c.json({ error: 'Sign-in unavailable. Please try again.' }, 503);
    }
  };
}
