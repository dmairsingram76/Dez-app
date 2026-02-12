import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { validateCoordinates, validateNumber, validateString, sanitizeString } from '../_shared/validate.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

// Allowed activity types to prevent cache poisoning
const ALLOWED_ACTIVITIES = new Set([
  'gym', 'yoga', 'pilates', 'swimming', 'crossfit', 'boxing',
  'running', 'cycling', 'dance', 'martial_arts', 'tennis',
  'basketball', 'soccer', 'climbing', 'hiking', 'walking',
]);

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabase = getSupabase(req);
    const url = new URL(req.url);

    // Validate coordinates
    const { lat, lng } = validateCoordinates(
      url.searchParams.get('lat'),
      url.searchParams.get('lng')
    );

    // Validate and sanitize activities
    const activitiesParam = url.searchParams.get('activities');
    let activities: string[] | null = null;
    if (activitiesParam) {
      activities = activitiesParam
        .split(',')
        .map(a => a.trim().toLowerCase())
        .filter(a => ALLOWED_ACTIVITIES.has(a))
        .slice(0, 10); // Max 10 activities
      
      if (activities.length === 0) {
        activities = null;
      }
    }

    // Validate radius (between 100m and 50km)
    const radius = validateNumber(
      url.searchParams.get('radius') ?? 5000,
      'radius',
      { min: 100, max: 50000, integer: true }
    );

    // Rate limit by IP or auth header
    const rateLimitKey = req.headers.get('Authorization') ?? 
      req.headers.get('X-Forwarded-For') ?? 
      'anonymous';
    rateLimit(rateLimitKey, 60);

    // Build sanitized cache key (round coordinates to prevent cache flooding)
    const roundedLat = Math.round(lat * 1000) / 1000; // ~111m precision
    const roundedLng = Math.round(lng * 1000) / 1000;
    const activitiesKey = activities ? activities.sort().join(',') : 'all';
    const cacheKey = `facilities:${roundedLat}:${roundedLng}:${activitiesKey}:${radius}`;

    // 1️⃣ Check cache
    const { data: cached } = await supabase
      .from('cached_searches')
      .select('response')
      .eq('key', cacheKey)
      .single();

    if (cached) return ok(cached.response, req);

    // 2️⃣ Query facilities
    const { data, error: dbError } = await supabase.rpc(
      'search_facilities',
      {
        user_lat: lat,
        user_lng: lng,
        activities: activities,
        radius_meters: radius,
      }
    );

    if (dbError) throw dbError;

    // 3️⃣ Cache response
    await supabase.from('cached_searches').insert({
      key: cacheKey,
      response: data,
    });

    return ok(data, req);
  } catch (e: any) {
    if (e instanceof RateLimitError) {
      return error('RATE_LIMIT_EXCEEDED', 429, req);
    }
    if (e.name === 'ValidationError') {
      return error(e.message, 400, req);
    }
    return error(e.message, 400, req);
  }
});
