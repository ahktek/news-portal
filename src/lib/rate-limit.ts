/**
 * In-memory rate limiter for API routes.
 *
 * Keeps a Map of IP → { count, resetTime } in process memory.
 * This resets on server restart (acceptable for a CMS with low traffic).
 * For production at scale, swap this for Upstash Redis or similar.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup: purge expired entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request from `ip` is within the rate limit.
 *
 * @param ip          Client IP address (from x-forwarded-for or socket)
 * @param maxAttempts Maximum allowed attempts within the window
 * @param windowMs    Time window in milliseconds
 * @returns           { allowed: boolean, remaining: number }
 */
export function rateLimit(
  ip: string,
  maxAttempts: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(ip);

  // No entry or window expired — start fresh
  if (!entry || now > entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  // Over limit
  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // Within limit
  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count };
}

/**
 * Extract the client IP from a Request object.
 * Checks x-forwarded-for first (for reverse-proxy/Vercel deployments),
 * then falls back to x-real-ip, then a placeholder.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  return '127.0.0.1';
}
