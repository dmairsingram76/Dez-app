import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { requireFields, validateNumber } from '../_shared/validate.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    // Require authentication - questionnaire responses must be linked to a user
    const supabase = getSupabase(req);
    const user = await requireAuth(supabase);

    // Rate limit per user
    rateLimit(user.id);

    const body = await req.json();
    requireFields(body, ['version', 'responses']);

    // Validate version number
    const version = validateNumber(body.version, 'version', { min: 1, max: 1000, integer: true });

    // Validate responses is an object/array and not too large
    if (!body.responses || typeof body.responses !== 'object') {
      return error('Invalid responses format', 400, req);
    }
    const responsesStr = JSON.stringify(body.responses);
    if (responsesStr.length > 50000) {
      return error('Responses too large', 400, req);
    }

    const { error: dbError } = await supabase
      .from('questionnaire_responses')
      .insert({
        user_id: user.id,
        version,
        responses: body.responses,
        completed: true,
      });

    if (dbError) throw dbError;

    return ok({ submitted: true }, req);
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
