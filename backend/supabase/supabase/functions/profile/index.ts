import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

// Allowed fields for profile updates (whitelist approach)
const ALLOWED_PROFILE_FIELDS = new Set([
  'display_name',
  'avatar_url',
  'fitness_level',
  'goals',
  'preferences',
  'constraints',
]);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabase = getSupabase(req);
    const user = await requireAuth(supabase, req);

    // Rate limit per user
    rateLimit(user.id);

    if (req.method === 'GET') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return ok(data, req);
    }

    if (req.method === 'PUT') {
      const body = await req.json();

      // Only allow whitelisted fields to be updated
      const sanitizedBody: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (ALLOWED_PROFILE_FIELDS.has(key)) {
          sanitizedBody[key] = value;
        }
      }

      if (Object.keys(sanitizedBody).length === 0) {
        return error('No valid fields to update', 400, req);
      }

      await supabase
        .from('profiles')
        .update(sanitizedBody)
        .eq('user_id', user.id);

      return ok({ updated: true }, req);
    }

    return error('Method not allowed', 405, req);
  } catch (e: any) {
    if (e instanceof AuthError) {
      return error('Unauthorized', 401, req);
    }
    if (e instanceof RateLimitError) {
      return error('RATE_LIMIT_EXCEEDED', 429, req);
    }
    return error(e.message, 400, req);
  }
});
