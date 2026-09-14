/**
 * Get Usage Statistics
 * Returns user's API usage statistics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;

    const supabaseClient = getAnonClient(authHeader);

    // Get usage stats for last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: recentRequests, error } = await supabaseClient
      .from('request_logs')
      .select('function_name, created_at')
      .eq('user_id', user.id)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Aggregate by function
    const stats = (recentRequests || []).reduce((acc, req) => {
      const funcName = req.function_name;
      if (!acc[funcName]) {
        acc[funcName] = { count: 0, lastUsed: null };
      }
      acc[funcName].count++;
      if (!acc[funcName].lastUsed || req.created_at > acc[funcName].lastUsed) {
        acc[funcName].lastUsed = req.created_at;
      }
      return acc;
    }, {} as Record<string, { count: number; lastUsed: string | null }>);

    // Get total count
    const totalRequests = (recentRequests || []).length;

    return new Response(
      JSON.stringify({
        totalRequests24h: totalRequests,
        byFunction: stats,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-usage-stats] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
