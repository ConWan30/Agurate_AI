import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getServiceClient } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const communityInsightsSchema = z.object({
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), z.enum(['rice', 'soybean', 'cotton', 'corn'])),
  practiceType: z.string().min(1).max(100),
  region: z.string().max(100).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are AgurateAI's community intelligence engine analyzing Louisiana Delta farming practices.

Aggregate Community Data (anonymous):
- Crop: ${cropType}
- Practice Type: ${practiceType}
- Region: Louisiana Delta
- Successful Results: ${JSON.stringify(insights)}

Analyze community data:
1. Identify most successful practices (top 25% performers)
2. Extract common patterns among successful farmers
3. Calculate average savings and success rate
4. Generate actionable recommendations
5. Validate against LSU AgCenter research principles

Return JSON with community insights and best practices.`;

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
      analysisData = {
        insights: 'Community data aggregated',
        recommendations: ['Continue monitoring practices'],
        average_savings: insights?.reduce((sum, i) => sum + (i.savings_achieved || 0), 0) / (insights?.length || 1),
      };
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
