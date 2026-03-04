/// <reference path="../_shared/deno.d.ts" />
import { serve } from 'https://deno.land/std/http/server.ts';
import OpenAI from 'npm:openai';
import { getSupabase, requireAuth, AuthError } from '../_shared/auth.ts';
import { rateLimit, RateLimitError } from '../_shared/rateLimit.ts';
import { requireFields, validateNumber } from '../_shared/validate.ts';
import { ok, error, handlePreflight } from '../_shared/responses.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const RECOMMENDATIONS_SYSTEM_PROMPT = `You are a fitness advisor. Given the user's goal, experience level, and preferences, output exactly 5 concrete fitness recommendations. Reply only with a JSON array of 5 objects, each with keys "activity" and "reasoning". No markdown, no extra text.`;

function buildEconomicPrompt(responses: Record<string, string>): string {
  const parts = [
    responses.goal && `Goal: ${responses.goal}`,
    responses.experience && `Level: ${responses.experience}`,
    responses.preferences && `Prefer: ${responses.preferences}`,
  ].filter(Boolean);
  return parts.join('. ');
}

async function generateRecommendations(
  prompt: string
): Promise<Array<{ activity: string; reasoning: string }>> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    max_tokens: 500,
    messages: [
      { role: 'system', content: RECOMMENDATIONS_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  });
  const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : [];
  return list
    .slice(0, 5)
    .filter((x: any) => x && typeof x.activity === 'string')
    .map((x: any) => ({
      activity: String(x.activity).slice(0, 500),
      reasoning: typeof x.reasoning === 'string' ? x.reasoning.slice(0, 1000) : '',
    }));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const supabase = getSupabase(req);
    const user = await requireAuth(supabase, req);

    rateLimit(user.id);

    const body = await req.json();
    requireFields(body, ['version', 'responses']);

    const version = validateNumber(body.version, 'version', { min: 1, max: 1000, integer: true });

    if (!body.responses || typeof body.responses !== 'object') {
      return error('Invalid responses format', 400, req);
    }
    const responsesStr = JSON.stringify(body.responses);
    if (responsesStr.length > 50000) {
      return error('Responses too large', 400, req);
    }

    const { error: dbError } = await supabase
      .from('questionnaire_responses')
      .insert({
        user_id: user.id,
        version,
        responses: body.responses,
        completed: true,
      });

    if (dbError) throw dbError;

    const userPrompt = `${buildEconomicPrompt(body.responses)}. List exactly 5 best fitness recommendations as JSON array: [{"activity":"...","reasoning":"..."}]`;
    const items = await generateRecommendations(userPrompt);

    for (const item of items) {
      const { error: insertErr } = await supabase.from('recommendations').insert({
        user_id: user.id,
        reasoning: item.reasoning,
        ai_payload: { activity: item.activity },
      });
      if (insertErr) throw insertErr;
    }

    return ok({ submitted: true, count: items.length }, req);
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
