import { serve } from 'https://deno.land/std/http/server.ts';
import OpenAI from 'https://esm.sh/openai';
import { ok, error } from '../_shared/responses.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

serve(async (req) => {
  try {
    const {
      lastMessage,
      currentStep,
      knownGoals,
      knownPreferences,
      knownConstraints,
    } = await req.json();

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
User response: "${lastMessage}"

Current step: ${currentStep}
Known goals: ${JSON.stringify(knownGoals)}
Known preferences: ${JSON.stringify(knownPreferences)}
Known constraints: ${JSON.stringify(knownConstraints)}

Return JSON only.`,
        },
      ],
    });

    const result = JSON.parse(
      completion.choices[0].message.content!
    );

    return ok(result);
  } catch (e: any) {
    return error(e.message);
  }
});
