import { serve } from 'https://deno.land/std/http/server.ts';
import { getSupabase, getOptionalUser } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { validateString, validateNumber, sanitizeString } from '../_shared/validate.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

// Allowed event names to prevent abuse
const ALLOWED_EVENT_NAMES = new Set([
  'page_view',
  'screen_view',
  'button_click',
  'form_submit',
  'onboarding_start',
  'onboarding_complete',
  'chat_message',
  'recommendation_view',
  'facility_view',
  'search',
  'error',
]);

// Rate limit for events (per anonymous_id)
const EVENTS_RATE_LIMIT = 60; // 60 events per minute

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    if (req.method !== 'POST') {
      return error('Method not allowed', 405, req);
    }

    const body = await req.json();

    // Validate required fields
    const eventName = validateString(body.event_name, 'event_name', { maxLength: 100 });
    const anonymousId = validateString(body.anonymous_id, 'anonymous_id', { maxLength: 100 });

    // Validate event name against whitelist
    if (!ALLOWED_EVENT_NAMES.has(eventName)) {
      return error('Invalid event payload', 400, req);
    }

    // Rate limit by anonymous_id
    rateLimit(anonymousId, EVENTS_RATE_LIMIT);

    const supabase = getSupabase(req);
    const user = await getOptionalUser(supabase);
    
    const event = {
      event_name: sanitizeString(eventName),
      event_version: body.event_version ? validateNumber(body.event_version, 'event_version', { min: 1, max: 100, integer: true }) : 1,
      screen: body.screen ? sanitizeString(validateString(body.screen, 'screen', { maxLength: 200 })) : null,
      source: body.source ? sanitizeString(validateString(body.source, 'source', { maxLength: 50 })) : 'mobile',
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      user_id: user?.id ?? null,
      anonymous_id: sanitizeString(anonymousId),
    };

    // Limit metadata size
    const metadataStr = JSON.stringify(event.metadata);
    if (metadataStr.length > 5000) {
      return error('Invalid event payload', 400, req);
    }

    await supabase.from('events').insert(event);

    return ok({ tracked: true }, req);
  } catch (e: any) {
    if (e instanceof RateLimitError) {
      return error('RATE_LIMIT_EXCEEDED', 429, req);
    }
    return error(e.message, 400, req);
  }
});
