import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const communityInsightsSchema = z.object({
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), z.enum(['rice', 'soybean', 'cotton', 'corn'])),
  practiceType: z.string().min(1).max(100),
  region: z.string().max(100).optional()
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const rateLimitClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(rateLimitClient, user.id, {
      functionName: 'generate-community-insights',
      maxRequests: RATE_LIMITS['generate-community-insights'].maxRequests,
      windowMs: RATE_LIMITS['generate-community-insights'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.json();
    const validation = communityInsightsSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { cropType, practiceType, region } = validation.data;
    
    const supabase = getServiceClient();

    // Aggregate anonymous community data
    const { data: insights, error: insightsError } = await supabase
      .from('community_insights')
      .select('practice, outcome, savings_achieved, community_rating')
      .eq('insight_type', practiceType)
      .gte('community_rating', 3.5)
      .limit(50);

    if (insightsError) throw insightsError;

    const rows = insights || [];
    const reportedSavings = rows
      .map((r: { savings_achieved?: number | null }) => Number(r.savings_achieved))
      .filter((n: number) => Number.isFinite(n) && n > 0);

    if (rows.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          analysis: null,
          reason: 'insufficient_community_data',
          message: 'Need more community reports before generating practice insights.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are AgurateAI's community intelligence engine analyzing Louisiana Delta farming practices.

Aggregate Community Data (anonymous):
- Crop: ${cropType}
- Practice Type: ${practiceType}
- Region: Louisiana Delta
- Report count: ${rows.length}
- Self-reported savings samples (finite > 0 only): ${JSON.stringify(reportedSavings)}
- Outcomes/ratings (no invented dollars): ${JSON.stringify(rows.map((r: { practice?: string; outcome?: string; community_rating?: number }) => ({
      practice: r.practice,
      outcome: r.outcome,
      community_rating: r.community_rating,
    })))}

HONESTY RULES:
- Do NOT invent average_savings or dollar figures. If fewer than 3 finite savings samples exist, set average_savings to null.
- Success rates must be derived only from provided ratings/outcomes — never invent adoption counts.
- Frame LSU AgCenter references as public guidance only — not official validation.

Analyze community data:
1. Identify patterns among higher-rated reports
2. Extract common practices (qualitative)
3. average_savings: null unless computed from provided finite savings samples
4. Generate cautious recommendations labeled as community-reported
5. Cite public LSU AgCenter framing when relevant

Return JSON with: patterns, recommendations, average_savings (number|null), success_rate (0-1|null), sample_size.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a farming community insights analyst with expertise in Louisiana Delta agriculture.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    let analysisData;
    try {
      analysisData = JSON.parse(aiResponse);
    } catch {
      throw new Error('Community insights AI returned unparseable JSON — refusing to invent insights');
    }

    return new Response(
      JSON.stringify({ success: true, analysis: analysisData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate insights. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
