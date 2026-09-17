import { fetchAI, getAIKey } from '../_shared/ai.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

const cropEnum = z.enum(['rice', 'soybean', 'cotton', 'corn']);
const communityInsightsSchema = z.object({
  fieldId: z.string().uuid(),
  practiceType: z.string().min(1).max(100),
  /** @deprecated Ignored — crop is loaded from the owned field. */
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), cropEnum).optional(),
  /** @deprecated Ignored — region is not trusted from the client. */
  region: z.string().max(100).optional()
});

function normalizeCrop(raw: unknown): z.infer<typeof cropEnum> | null {
  if (typeof raw !== 'string') return null;
  const v = raw.toLowerCase() === 'soybeans' ? 'soybean' : raw.toLowerCase();
  const parsed = cropEnum.safeParse(v);
  return parsed.success ? parsed.data : null;
}

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

    const { fieldId, practiceType } = validation.data;
    
    const supabase = getServiceClient();
    const anon = getAnonClient(authHeader);

    // Bind crop from owned field — never trust client cropType/region invent.
    const { data: ownedField, error: fieldError } = await anon
      .from('fields')
      .select('id, crop_type, user_id')
      .eq('id', fieldId)
      .maybeSingle();
    if (fieldError || !ownedField || ownedField.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Field not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const cropType = normalizeCrop(ownedField.crop_type);
    if (!cropType) {
      return new Response(JSON.stringify({ error: 'Field crop_type is missing or unsupported' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Aggregate anonymous community data for the same crop only (via owned field join).
    const { data: insights, error: insightsError } = await supabase
      .from('community_insights')
      .select('practice, outcome, savings_achieved, community_rating, fields!inner(crop_type)')
      .eq('insight_type', practiceType)
      .eq('fields.crop_type', cropType)
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

    const AI_API_KEY = getAIKey();
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    const aiPrompt = `You are AgurateAI's community intelligence engine analyzing Louisiana Delta farming practices.

Aggregate Community Data (anonymous):
- Crop: ${cropType}
- Practice Type: ${practiceType}
- Region: not asserted (crop-filtered community sample only)
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

    const response = await fetchAI({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
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
    
    let analysisData: Record<string, unknown>;
    try {
      analysisData = JSON.parse(aiResponse);
    } catch {
      throw new Error('Community insights AI returned unparseable JSON — refusing to invent insights');
    }

    // Server-owned metrics — never trust model money/rate invent over computed samples.
    // Rows are already filtered to community_rating >= 3.5, so a "success rate" from
    // that set would be tautological invent — leave success_rate null.
    const sampleSize = rows.length;
    const averageSavings = reportedSavings.length >= 3
      ? reportedSavings.reduce((a: number, b: number) => a + b, 0) / reportedSavings.length
      : null;

    analysisData.sample_size = sampleSize;
    analysisData.average_savings = averageSavings;
    analysisData.success_rate = null;

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
