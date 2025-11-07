/**
 * Shared Rate Limiter Utility
 * Provides consistent rate limiting across all edge functions
 */

import { createClient } from '@supabase/supabase-js';

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

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
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
    // Fail open - allow request if we can't check
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs,
      limit: config.maxRequests,
    };
  }

  const requestCount = recentRequests?.length || 0;
  const allowed = requestCount < config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - requestCount - 1);
  const resetTime = Date.now() + config.windowMs;

  return {
    allowed,
    remaining,
    resetTime,
    limit: config.maxRequests,
  };
}

/**
 * Log a request for rate limiting
 */
export async function logRequest(
  supabaseClient: any,
  userId: string,
  functionName: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  try {
    await supabaseClient
      .from('request_logs')
      .insert({
        user_id: userId,
        function_name: functionName,
        ip_address: ipAddress || 'unknown',
        user_agent: userAgent || 'unknown',
      });
  } catch (error) {
    console.error('[rateLimiter] Error logging request:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
}

/**
 * Standard rate limit configurations
 */
export const RATE_LIMITS = {
  'delta-chat': { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  'analyze-crop': { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  'conversational-form': { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  'predict-stress': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  'generate-community-insights': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
} as const;

