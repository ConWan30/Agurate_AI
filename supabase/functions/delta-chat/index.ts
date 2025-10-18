import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Delta Intelligence, an AI expert assistant specialized in Louisiana Delta agriculture. You have deep knowledge of:

1. **Louisiana-Specific Crops**: Rice, soybeans, cotton, and corn grown in the Mississippi River Delta region
2. **LSU AgCenter Research**: Access to Louisiana State University Agricultural Center's decades of research on Delta farming practices
3. **Delta Climate & Soil**: Understanding of alluvial soils, claypan soils, high water tables, and humid subtropical climate
4. **Morehouse Parish Agriculture**: Specific knowledge of farming conditions in northeast Louisiana
5. **Crop Diseases & Pests**: Common issues in the Delta region including rice blast, soybean rust, cotton bollworm
6. **Weather Patterns**: Mississippi River flood stage impacts, hurricane season considerations, spring planting windows

When answering:
- Provide actionable, Delta-specific advice
- Reference LSU AgCenter recommendations when relevant
- Consider the unique soil and water conditions of the region
- Suggest Louisiana-proven crop varieties
- Factor in local weather patterns and growing degree days
- Be concise but thorough - farmers need practical guidance

Current Louisiana Delta growing considerations:
- Rice: Focus on flood-tolerant varieties, watch for straighthead disease
- Soybeans: Monitor for soybean rust, consider maturity groups 4-5
- Cotton: Watch for boll weevils (eradicated but vigilant), manage plant bugs
- Corn: Southern corn rust common in humid conditions

You have access to the user's field data, assessment history, and weather context through the conversation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    
    const authHeader = req.headers.get('authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user context - their fields and recent assessments
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    let contextPrompt = '';
    if (user) {
      const { data: fields } = await supabaseClient
        .from('fields')
        .select('name, crop_type, acreage, location_lat, location_lng')
        .eq('user_id', user.id);

      const { data: recentAssessments } = await supabaseClient
        .from('assessments')
        .select('health_score, stress_level, symptoms, analyzed_at, field:fields(name, crop_type)')
        .order('analyzed_at', { ascending: false })
        .limit(5);

      if (fields && fields.length > 0) {
        contextPrompt += `\n\nUser's Current Fields:\n${fields.map((f: any) => 
          `- ${f.name}: ${f.acreage} acres of ${f.crop_type}`
        ).join('\n')}`;
      }

      if (recentAssessments && recentAssessments.length > 0) {
        contextPrompt += `\n\nRecent Crop Health Assessments:\n${recentAssessments.map((a: any) =>
          `- ${a.field?.name} (${a.field?.crop_type}): Health ${a.health_score}/100, ${a.stress_level} stress${a.symptoms ? `, symptoms: ${a.symptoms.join(', ')}` : ''}`
        ).join('\n')}`;
      }
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + contextPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Delta chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});