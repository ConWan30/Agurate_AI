/**
 * Shared rate limiter for edge functions (Deno-compatible).
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
    console.error('[rateLimiter] Error checking rate limit:', error);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
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

export async function logRequest(
  // deno-lint-ignore no-explicit-any
  supabaseClient: any,
  userId: string,
  functionName: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  try {
    await supabaseClient.from('request_logs').insert({
      user_id: userId,
      function_name: functionName,
      ip_address: ipAddress || 'unknown',
      user_agent: userAgent || 'unknown',
    });
  } catch (error) {
    console.error('[rateLimiter] Error logging request:', error);
  }
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
} as const;
