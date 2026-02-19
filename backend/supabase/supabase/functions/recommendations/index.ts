import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

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

    const { data, error: dbError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return ok(data, req);
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
