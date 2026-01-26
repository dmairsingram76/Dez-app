const limits = new Map<string, number>();

export function rateLimit(key: string, max = 30) {
  const count = limits.get(key) ?? 0;
  if (count >= max) throw new Error('RATE_LIMIT_EXCEEDED');
  limits.set(key, count + 1);
}
