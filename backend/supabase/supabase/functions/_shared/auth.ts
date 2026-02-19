import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js';

export function getSupabase(_req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

function decodeJwtPayload(jwt: string): Record<string, any> {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed token');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function extractJwt(req: Request): string {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) throw new AuthError();
  return header.slice(7);
}

/**
 * Require authentication and return the authenticated user.
 * Decodes the JWT from the request and verifies the user via admin API.
 */
export async function requireAuth(supabase: SupabaseClient, req: Request): Promise<User> {
  const jwt = extractJwt(req);
  const payload = decodeJwtPayload(jwt);

  if (!payload.sub) throw new AuthError();
  if (payload.exp && payload.exp < Date.now() / 1000) throw new AuthError('Token expired');

  const { data: { user }, error } = await supabase.auth.admin.getUserById(payload.sub);
  if (error || !user) throw new AuthError();

  return user;
}

/**
 * Get user if authenticated, or null if not.
 * Does not throw on missing auth.
 */
export async function getOptionalUser(supabase: SupabaseClient, req: Request): Promise<User | null> {
  try {
    return await requireAuth(supabase, req);
  } catch {
    return null;
  }
}
