// Generic error handler for edge functions
// Logs detailed errors server-side, returns generic messages to clients

export function handleError(
  error: unknown,
  context: string,
  corsHeaders: Record<string, string>
): Response {
  // Generate unique request ID for support tracking
  const requestId = crypto.randomUUID();
  
  // Log detailed error server-side only
  console.error(`[${context}] Error ${requestId}:`, error);
  
  // Return generic error to client
  return new Response(
    JSON.stringify({ 
      error: 'An error occurred. Please try again later.',
      requestId
    }),
    { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function handleAuthError(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/** Default permissive CORS for edge functions (override per-function when locking origins). */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-demo-setup-secret',
};

export function handleForbiddenError(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Access denied' }),
    { 
      status: 403, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function handleNotFoundError(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Resource not found' }),
    { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function handleRateLimitError(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { 
      status: 429, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

export function addRateLimitHeaders(
  headers: Record<string, string>,
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    ...headers,
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString()
  };
}

/** Shared default CORS headers for edge functions that import from this module. */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-demo-setup-secret',
};
