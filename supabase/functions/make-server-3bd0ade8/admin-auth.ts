export function requiresAdmin(method: string, path: string): boolean {
  if (method === "OPTIONS") return false;
  if (method === "POST" && path === "/admin/login") return false;
  if (/^\/admin(?:\/|$)/.test(path)) return true;
  if (method === "GET") {
    if (/^\/checkins\/[^/]+\/[^/]+$/.test(path)) return true;
    return ["/bookings", "/tour-bookings", "/tour-requests", "/drivers", "/images", "/merchants", "/deals"].includes(path);
  }
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return false;
  if (["/test-push", "/tour-bookings/create-manual"].includes(path)) return true;
  if (/^\/bookings\/[^/]+\/status$/.test(path)) return true;
  if (/^\/tour-bookings\/[^/]+\/cancel$/.test(path)) return true;
  if (/^\/tour-requests\/[^/]+\/(status|notes)$/.test(path)) return true;
  if (/^\/drivers(?:\/|$)/.test(path)) {
    return !["/drivers/login", "/drivers/logout", "/drivers/record-scan"].includes(path);
  }
  return /^\/(content|comprehensive-content|pricing|settings|images|private-tours|monuments|blog-articles|blog-categories|availability|card-products|merchants|deals)(?:\/|$)/.test(path);
}

type VerifiedUser = { app_metadata?: Record<string, unknown> };
type UserLookup = (token: string) => Promise<{ data: { user: VerifiedUser | null }; error: unknown }>;

interface AdminContext {
  req: { path: string; method: string; header: (name: string) => string | undefined };
  json: (body: object, status: 401 | 403 | 503) => Response;
}

export function createAdminGuard(getUser: UserLookup) {
  return async (c: AdminContext, next: () => Promise<void>) => {
    const path = c.req.path.slice("/make-server-3bd0ade8".length).replace(/\/+$/, "") || "/";
    if (requiresAdmin(c.req.method, path)) {
      const status = await authorizeAdmin(c.req.header("Authorization"), getUser);
      if (status !== 200) {
        return c.json({ success: false, error: status === 503 ? "Authentication unavailable" : "Administrator access required" }, status);
      }
    }
    await next();
  };
}

// Only Auth's verified user and server-managed app_metadata grant privileges.
// User-editable user_metadata and browser session flags are never trusted.
export async function authorizeAdmin(
  authorization: string | undefined,
  getUser: UserLookup,
): Promise<200 | 401 | 403 | 503> {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return 401;
  try {
    const { data, error } = await getUser(match[1]);
    if (error || !data.user) return 401;
    return data.user.app_metadata?.role === "admin" ? 200 : 403;
  } catch {
    return 503;
  }
}
