import { serve } from 'https://deno.land/std/http/server.ts';
import OpenAI from 'https://esm.sh/openai';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { requireFields, validateString, sanitizeString } from '../_shared/validate.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Rate limit for AI endpoints (stricter than normal)
const AI_RATE_LIMIT = 10; // 10 requests per minute

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    // Require authentication
    const supabase = getSupabase(req);
    const user = await requireAuth(supabase, req);
    
    // Apply rate limiting per user
    rateLimit(user.id, AI_RATE_LIMIT);

    const body = await req.json();
    requireFields(body, ['lastMessage', 'currentStep']);

    const {
      lastMessage,
      currentStep,
      knownGoals,
      knownPreferences,
      knownConstraints,
    } = body;

    // Validate and sanitize inputs
    const sanitizedMessage = sanitizeString(validateString(lastMessage, 'lastMessage', { maxLength: 2000 }));
    const sanitizedStep = sanitizeString(validateString(currentStep, 'currentStep', { maxLength: 100 }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'You are Dez, a friendly and supportive fitness assistant.',
        },
        {
          role: 'user',
          content: `
User response: "${sanitizedMessage}"

Current step: ${sanitizedStep}
Known goals: ${JSON.stringify(knownGoals ?? [])}
Known preferences: ${JSON.stringify(knownPreferences ?? [])}
Known constraints: ${JSON.stringify(knownConstraints ?? [])}

Return JSON only.`,
        },
      ],
    });

    const result = JSON.parse(
      completion.choices[0].message.content!
    );

    return ok(result, req);
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
