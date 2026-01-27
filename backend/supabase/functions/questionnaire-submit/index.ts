import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { requireFields } from '../_shared/validate.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    rateLimit(req.headers.get('Authorization') ?? 'anon');

    const body = await req.json();
    requireFields(body, ['version', 'responses']);

    const supabase = getSupabase(req);
    const { data: user } = await supabase.auth.getUser();

    const { error: dbError } = await supabase
      .from('questionnaire_responses')
      .insert({
        user_id: user.user?.id,
        version: body.version,
        responses: body.responses,
        completed: true,
      });

    if (dbError) throw dbError;

    return ok({ submitted: true });
  } catch (e: any) {
    return error(e.message);
  }
});
