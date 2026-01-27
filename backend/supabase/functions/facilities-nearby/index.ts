import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const radius = Number(url.searchParams.get('radius') ?? 5000);

    if (!lat || !lng) throw new Error('Missing coordinates');

    const supabase = getSupabase(req);

    const { data, error: dbError } = await supabase.rpc(
      'nearby_facilities',
      { lat, lng, radius }
    );

    if (dbError) throw dbError;

    return ok(data);
  } catch (e: any) {
    return error(e.message);
  }
});
