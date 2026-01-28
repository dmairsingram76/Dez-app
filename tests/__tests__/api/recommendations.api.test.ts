import { handler } from '@/supabase/functions/recommendations';

describe('GET /recommendations', () => {
  it('returns recommendations for authenticated user', async () => {
    const req = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    } as any;

    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(res.body.recommendations).toBeDefined();
  });

  it('rejects unauthenticated requests', async () => {
    const req = { method: 'GET', headers: {} } as any;
    const res = await handler(req);

    expect(res.status).toBe(401);
  });
});
