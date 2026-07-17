type RateLimitEntry = { count: number; resetAt: number };

const limits: Record<string, RateLimitEntry> = {};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(req: Request, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(req);
  const now = Date.now();

  const entry = limits[ip];

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    limits[ip] = { count: 1, resetAt };
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitHeaders(result: { remaining: number; resetAt: number }): Record<string, string> {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAt),
  };
}
