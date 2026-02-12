import { serve } from 'https://deno.land/std/http/server.ts';
import OpenAI from 'https://esm.sh/openai';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Rate limit for AI endpoints
const AI_RATE_LIMIT = 10;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabase = getSupabase(req);
    const user = await requireAuth(supabase);

    // Rate limit per user
    rateLimit(user.id, AI_RATE_LIMIT);

    // 1️⃣ Load cached recommendation
    const { data: cached } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached && Date.now() - new Date(cached.created_at).getTime() < 86400000) {
      return ok(cached, req);
    }

    // 2️⃣ Build AI input
    const aiInput = cached?.ai_input;
    if (!aiInput) return error('Missing AI input', 400, req);

    // 3️⃣ Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(aiInput) }
      ],
    });

    const aiResult = JSON.parse(completion.choices[0].message.content);

    // 4️⃣ Save recommendation
    const { data: recommendation } = await supabase
      .from('recommendations')
      .insert({
        user_id: user.id,
        activity_types: aiResult.activity_types,
        reasoning: aiResult.reasoning,
        ai_input: aiInput,
      })
      .select()
      .single();

    return ok(recommendation, req);
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
