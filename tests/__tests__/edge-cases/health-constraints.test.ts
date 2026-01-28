import { generateRecommendations } from '@/ai/recommendations';

describe('Health Constraint Safety', () => {
  it('avoids high-impact activities for joint pain', async () => {
    const result = await generateRecommendations({
      constraints: ['knee pain'],
    });

    expect(result.activities).not.toContain('HIIT');
    expect(result.activities).not.toContain('Running');
  });

  it('uses inclusive language', async () => {
    const result = await generateRecommendations({
      constraints: ['anxiety'],
    });

    expect(result.reasoning).not.toMatch(/should|must/i);
  });
});
