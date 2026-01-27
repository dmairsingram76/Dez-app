import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { requireFields } from '../_shared/validate.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    const body = await req.json();
    requireFields(body, ['event_type']);

    const supabase = getSupabase(req);
    const { data: user } = await supabase.auth.getUser();

    await supabase.from('events').insert({
      user_id: user.user?.id,
      event_type: body.event_type,
      payload: body.payload ?? {},
    });

    return ok({ tracked: true });
  } catch (e: any) {
    return error(e.message);
  }
});
