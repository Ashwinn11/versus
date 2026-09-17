import "server-only";

type Bucket = { count: number; resetAt: number };

/**
 * Per-instance token bucket. Deliberately behind a tiny interface: a warm
 * lambda holds this map only for its own lifetime, so it throttles the obvious
 * hammering without pretending to be a global limit. Swapping in Upstash later
 * means replacing this file, not its callers.
 */
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so the map can't grow without bound on a long-lived
    // instance. Cheap because it only runs on a window rollover.
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}
