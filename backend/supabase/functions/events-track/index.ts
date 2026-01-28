import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return error('Method not allowed', 405);
    }

    const supabase = getSupabase(req);
    const body = await req.json();

    const { data: auth } = await supabase.auth.getUser();
    
    const event = {
      event_name: body.event_name,
      event_version: body.event_version ?? 1,
      screen: body.screen,
      source: body.source ?? 'mobile',
      metadata: body.metadata ?? {},
      user_id: auth.user?.id ?? null,
      anonymous_id: body.anonymous_id,
    };

    if (!event.event_name || !event.anonymous_id) {
      return error('Invalid event payload');
    }

    await supabase.from('events').insert(event);

    return ok({ tracked: true });
  } catch (e: any) {
    return error(e.message);
  }
});
