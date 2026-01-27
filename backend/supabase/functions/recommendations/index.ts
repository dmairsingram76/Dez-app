import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    rateLimit(req.headers.get('Authorization')!);

    const supabase = getSupabase(req);
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) return error('Unauthorized', 401);

    const { data, error: dbError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (dbError) throw dbError;

    return ok(data);
  } catch (e: any) {
    return error(e.message);
  }
});
