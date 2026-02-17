import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js';

export function getSupabase(req: Request) {
  const authHeader = req.headers.get('Authorization');
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Require authentication and return the authenticated user.
 * Throws AuthError if not authenticated.
 */
export async function requireAuth(supabase: SupabaseClient): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthError();
  }
  
  return user;
}

/**
 * Get user if authenticated, or null if not.
 * Does not throw on missing auth.
 */
export async function getOptionalUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}
