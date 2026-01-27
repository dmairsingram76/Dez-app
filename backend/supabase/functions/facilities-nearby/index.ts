import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { ok, error } from '../_shared/responses.ts';

serve(async (req) => {
  try {
    const supabase = getSupabase(req);
    const url = new URL(req.url);

    const lat = Number(url.searchParams.get('lat'));
    const lng = Number(url.searchParams.get('lng'));
    const activities = url.searchParams.get('activities')?.split(',');
    const radius = Number(url.searchParams.get('radius') ?? 5000);

    if (!lat || !lng) return error('Missing location');

    const cacheKey = `facilities:${lat}:${lng}:${activities}:${radius}`;

    // 1️⃣ Check cache
    const { data: cached } = await supabase
      .from('cached_searches')
      .select('response')
      .eq('key', cacheKey)
      .single();

    if (cached) return ok(cached.response);

    // 2️⃣ Query facilities
    const { data, error: dbError } = await supabase.rpc(
      'search_facilities',
      {
        user_lat: lat,
        user_lng: lng,
        activities: activities ?? null,
        radius_meters: radius,
      }
    );

    if (dbError) throw dbError;

    // 3️⃣ Cache response
    await supabase.from('cached_searches').insert({
      key: cacheKey,
      response: data,
    });

    return ok(data);
  } catch (e: any) {
    return error(e.message);
  }
});
