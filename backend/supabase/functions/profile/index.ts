import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    const supabase = getSupabase(req);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return error('Unauthorized', 401);

    if (req.method === 'GET') {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      return ok(data);
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      await supabase
        .from('profiles')
        .update(body)
        .eq('user_id', user.user.id);

      return ok({ updated: true });
    }

    return error('Method not allowed', 405);
  } catch (e: any) {
    return error(e.message);
  }
});
