/**
 * In-memory sliding-window limiter, keyed by an arbitrary string (here, the
 * login email). This is sufficient for a single self-hosted instance; a
 * multi-instance deployment behind a load balancer would need a shared store
 * (e.g. Redis) instead - tracked as a known limitation, not implemented here
 * to avoid adding an external dependency most self-hosted installs don't run.
 */

interface Bucket {
  count: number;
  windowStartedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStartedAt > windowMs) {
    buckets.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - bucket.windowStartedAt) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
