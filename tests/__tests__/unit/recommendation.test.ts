import { buildPrompt } from '@/ai/recommendationPrompt';

describe('Recommendation Prompt Builder', () => {
  it('includes goals and preferences', () => {
    const prompt = buildPrompt({
      goals: ['strength'],
      preferences: ['gym'],
      constraints: [],
    });

    expect(prompt).toContain('strength');
    expect(prompt).toContain('gym');
  });

  it('avoids medical language', () => {
    const prompt = buildPrompt({
      goals: ['pain relief'],
      preferences: [],
      constraints: ['knee pain'],
    });

    expect(prompt).not.toMatch(/diagnose|treat|cure/i);
  });
});
