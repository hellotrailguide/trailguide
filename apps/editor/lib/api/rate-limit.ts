import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Upstash Redis-backed rate limiter.
 * Works correctly across serverless invocations (shared state via Redis).
 *
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 * Falls back to a permissive no-op if env vars are missing (dev mode).
 */

interface RateLimitOptions {
  /** Max requests in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Cache Ratelimit instances by config signature to avoid re-creating them
const limiters = new Map<string, Ratelimit>()

function getLimiter(options: RateLimitOptions): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  const key = `${options.limit}:${options.windowMs}`
  let limiter = limiters.get(key)
  if (!limiter) {
    const windowSec = Math.ceil(options.windowMs / 1000)
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(options.limit, `${windowSec} s`),
      prefix: 'trailguide',
    })
    limiters.set(key, limiter)
  }
  return limiter
}

export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getLimiter(options)

  // Dev fallback: allow everything if Upstash is not configured
  if (!limiter) {
    return { allowed: true, remaining: options.limit, resetAt: Date.now() + options.windowMs }
  }

  const result = await limiter.limit(key)

  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  }
}
