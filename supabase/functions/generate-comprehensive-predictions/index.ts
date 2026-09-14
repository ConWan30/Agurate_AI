import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const comprehensivePredictionSchema = z.object({
  fieldId: z.string().uuid(),
  cropType: z.preprocess((v) => (v === 'soybeans' ? 'soybean' : v), z.enum(['rice', 'soybean', 'cotton', 'corn'])),
  weatherForecast: z.any().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabase = getAnonClient(authHeader);

    const rawBody = await req.json();
    const validation = comprehensivePredictionSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { fieldId, cropType, weatherForecast } = validation.data;

    // Verify field ownership
    const { data: verifyField, error: verifyError } = await supabase
      .from('fields')
      .select('user_id')
      .eq('id', fieldId)
      .single();

    if (verifyError || !verifyField || verifyField.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get field data and recent assessments
    const { data: field } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('field_id', fieldId)
      .order('analyzed_at', { ascending: false })
      .limit(10);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiPrompt = `You are AgurateAI's comprehensive predictive analytics engine for Louisiana Delta farming.

Field Data:
- Crop: ${cropType}
- Acreage: ${field?.acreage}
- Historical Assessments: ${JSON.stringify(assessments)}
- Weather Forecast: ${JSON.stringify(weatherForecast)}

Generate comprehensive predictions for next 30 days:
1. Yield Predictions: Estimate bushels/acre based on health trends
2. Disease Risk: Calculate disease outbreak probability (0-1 scale)
3. Weather Impact: Predict stress events from forecast
4. Economic Forecast: Estimate profitability trajectory
5. Recommended Actions: Specific interventions with optimal timing

Return JSON with complete predictive analysis including confidence scores.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a comprehensive agricultural predictive analytics expert specializing in Louisiana Delta farming.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('AI prediction failed');
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    
    let predictionData;
    try {
      predictionData = JSON.parse(aiResponse);
    } catch {
      const avgHealth = assessments?.reduce((sum, a) => sum + (a.health_score || 0), 0) / (assessments?.length || 1);
      predictionData = {
        yield_prediction: avgHealth > 75 ? 'Above average' : 'Average',
        disease_risk: avgHealth < 70 ? 0.6 : 0.3,
        confidence_score: 0.75,
        recommendations: ['Monitor field conditions regularly'],
      };
    }

    // Save predictive model
    const { data, error } = await supabase
      .from('predictive_models')
      .insert({
        model_type: 'comprehensive',
        field_id: fieldId,
        prediction_horizon: 30,
        confidence_score: predictionData.confidence_score || 0.75,
        prediction_data: predictionData,
        lsu_validation: false,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, prediction: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to generate predictions. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
