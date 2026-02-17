/**
 * Rate limiting implementation.
 * 
 * IMPORTANT: This in-memory implementation is for development only.
 * For production, use Supabase rate limiting or Redis:
 * - Supabase: Use pg_rate_limiter extension
 * - Redis: Use a distributed rate limiter like @upstash/ratelimit
 * 
 * Current limitations:
 * - Resets on server restart
 * - Does not work across multiple instances
 * - Memory grows unbounded (cleaned periodically)
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const limits = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

// Periodically clean up expired entries to prevent memory leaks
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of limits.entries()) {
    if (now - entry.windowStart > WINDOW_MS) {
      limits.delete(key);
    }
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., user ID, IP address)
 * @param max - Maximum requests per window (default: 30)
 * @throws RateLimitError if limit exceeded
 */
export function rateLimit(key: string | null | undefined, max = 30) {
  // Use a fallback key if none provided, but with stricter limits
  const effectiveKey = key ?? 'anonymous';
  const effectiveMax = key ? max : Math.min(max, 10); // Stricter for anonymous
  
  cleanup();
  
  const now = Date.now();
  const entry = limits.get(effectiveKey);
  
  // Start new window if none exists or window expired
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    limits.set(effectiveKey, { count: 1, windowStart: now });
    return;
  }
  
  // Check limit
  if (entry.count >= effectiveMax) {
    throw new RateLimitError();
  }
  
  // Increment counter
  entry.count++;
}

/**
 * Get remaining requests for a key.
 */
export function getRemainingRequests(key: string, max = 30): number {
  const entry = limits.get(key);
  if (!entry || Date.now() - entry.windowStart > WINDOW_MS) {
    return max;
  }
  return Math.max(0, max - entry.count);
}
