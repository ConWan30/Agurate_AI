import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { handleError } from '../_shared/errorHandler.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

/**
 * Live USDA/CBOT market quotes are not wired in closed beta.
 * Fail closed — never return invented placeholder commodity prices.
 * ROI and planning UIs must require farmer-entered prices.
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) {
      return auth;
    }
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'get-market-prices',
      maxRequests: RATE_LIMITS['get-market-prices'].maxRequests,
      windowMs: RATE_LIMITS['get-market-prices'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const cropType = url.searchParams.get('crop_type')?.toLowerCase();

    if (!cropType) {
      return new Response(
        JSON.stringify({ error: 'crop_type parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Live market price feed is not configured',
        crop_type: cropType,
        disclaimer:
          'No placeholder commodity prices are returned. Enter your own price for planning ROI.',
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleError(error, 'get-market-prices', corsHeaders);
  }
});
