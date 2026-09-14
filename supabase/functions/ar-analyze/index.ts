import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuthenticatedUser } from "../_shared/auth.ts";

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
    if (auth instanceof Response) {
      return auth;
    }

    const { imageData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Quick AR analysis for real-time overlay
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a crop health AR analyzer. Provide instant visual assessment in JSON format only.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this crop image and return JSON with: health_score (0-1), stress_level ("healthy"|"moderate_stress"|"severe_stress"), visual_cues (brief description of what you see), confidence_score (0-1). Keep visual_cues under 60 characters.'
              },
              {
                type: 'image_url',
                image_url: { url: imageData }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'ar_overlay_data',
              description: 'Return AR overlay data for crop health',
              parameters: {
                type: 'object',
                properties: {
                  health_score: { type: 'number', minimum: 0, maximum: 1 },
                  stress_level: { type: 'string', enum: ['healthy', 'moderate_stress', 'severe_stress'] },
                  visual_cues: { type: 'string', maxLength: 60 },
                  confidence_score: { type: 'number', minimum: 0, maximum: 1 }
                },
                required: ['health_score', 'stress_level', 'visual_cues', 'confidence_score'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'ar_overlay_data' } }
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AR analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'AR analysis failed',
        health_score: 0.5,
        stress_level: 'moderate_stress',
        visual_cues: 'Analysis unavailable',
        confidence_score: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
