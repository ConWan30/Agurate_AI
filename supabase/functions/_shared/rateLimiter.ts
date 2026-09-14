/**
 * Shared rate limiter for edge functions (Deno-compatible).
 * Fail-closed: deny when rate-limit state cannot be read or written.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  functionName: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export async function checkRateLimit(
  // deno-lint-ignore no-explicit-any
  supabaseClient: any,
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - config.windowMs);

  const { data: recentRequests, error } = await supabaseClient
    .from('request_logs')
    .select('created_at')
    .eq('user_id', userId)
    .eq('function_name', config.functionName)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('[rateLimiter] Error checking rate limit (fail closed):', error);
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + config.windowMs,
      limit: config.maxRequests,
    };
  }

  const requestCount = recentRequests?.length || 0;
  return {
    allowed: requestCount < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - requestCount - 1),
    resetTime: Date.now() + config.windowMs,
    limit: config.maxRequests,
  };
}

/** Returns false when the write fails so callers can fail closed. */
export async function logRequest(
  // deno-lint-ignore no-explicit-any
  supabaseClient: any,
  userId: string,
  functionName: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('request_logs').insert({
      user_id: userId,
      function_name: functionName,
      ip_address: ipAddress || 'unknown',
      user_agent: userAgent || 'unknown',
    });
    if (error) {
      console.error('[rateLimiter] Error logging request (fail closed):', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[rateLimiter] Error logging request (fail closed):', error);
    return false;
  }
}

/**
 * Check limit then record the request. Deny if either step fails.
 */
export async function enforceRateLimit(
  // deno-lint-ignore no-explicit-any
  supabaseClient: any,
  userId: string,
  config: RateLimitConfig,
  req?: Request
): Promise<RateLimitResult> {
  const result = await checkRateLimit(supabaseClient, userId, config);
  if (!result.allowed) return result;

  const logged = await logRequest(
    supabaseClient,
    userId,
    config.functionName,
    req?.headers.get('x-forwarded-for'),
    req?.headers.get('user-agent')
  );

  if (!logged) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: result.resetTime,
      limit: result.limit,
    };
  }

  return result;
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

export const RATE_LIMITS = {
  'delta-chat': { maxRequests: 10, windowMs: 60_000 },
  'analyze-crop': { maxRequests: 10, windowMs: 60_000 },
  'conversational-form': { maxRequests: 20, windowMs: 60_000 },
  'predict-stress': { maxRequests: 5, windowMs: 60_000 },
  'generate-community-insights': { maxRequests: 5, windowMs: 60_000 },
  'detect-critical-alerts': { maxRequests: 20, windowMs: 60_000 },
  'ar-analyze': { maxRequests: 20, windowMs: 60_000 },
  'unified-ai-analysis': { maxRequests: 10, windowMs: 60_000 },
  'generate-daily-briefing': { maxRequests: 5, windowMs: 60_000 },
  'generate-predictive-questions': { maxRequests: 10, windowMs: 60_000 },
  'generate-comprehensive-predictions': { maxRequests: 5, windowMs: 60_000 },
  'generate-conservation-predictions': { maxRequests: 5, windowMs: 60_000 },
  'generate-image-annotations': { maxRequests: 10, windowMs: 60_000 },
  'get-market-prices': { maxRequests: 20, windowMs: 60_000 },
  'recommend-varieties': { maxRequests: 10, windowMs: 60_000 },
  'predict-water-stress': { maxRequests: 5, windowMs: 60_000 },
  'compare-images': { maxRequests: 10, windowMs: 60_000 },
  'weather-alerts': { maxRequests: 20, windowMs: 60_000 },
  'get-usage-stats': { maxRequests: 30, windowMs: 60_000 },
} as const;
