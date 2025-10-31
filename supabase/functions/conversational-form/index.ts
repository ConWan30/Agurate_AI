import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const conversationalFormSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  formType: z.enum(['field-registration', 'insurance-claim', 'conservation-practices', 'onboarding', 'feedback', 'cooperative-application'])
});

// Form schema definitions
const FORM_SCHEMAS: Record<string, any> = {
  'field-registration': {
    type: 'object',
    properties: {
      fieldName: { type: 'string' },
      cropType: { type: 'string', enum: ['rice', 'soybeans', 'cotton', 'corn'] },
      acreage: { type: 'number', minimum: 0 },
      soilType: { type: 'string', enum: ['alluvial', 'claypan', 'mixed'] },
      locationLat: { type: 'number', minimum: -90, maximum: 90 },
      locationLng: { type: 'number', minimum: -180, maximum: 180 },
      plantingDate: { type: 'string' },
      variety: { type: 'string' },
      irrigationType: { type: 'string' }
    },
    required: ['fieldName', 'cropType', 'acreage']
  },
  'insurance-claim': {
    type: 'object',
    properties: {
      fieldId: { type: 'string' },
      eventType: { type: 'string', enum: ['flood', 'drought', 'hail', 'wind', 'pest', 'disease'] },
      eventDate: { type: 'string' },
      description: { type: 'string' },
      estimatedLossPercentage: { type: 'number', minimum: 0, maximum: 100 }
    },
    required: ['fieldId', 'eventType', 'eventDate', 'description']
  },
  'conservation-practices': {
    type: 'object',
    properties: {
      fieldId: { type: 'string' },
      coverCrops: { type: 'boolean' },
      noTill: { type: 'boolean' },
      cropRotation: { type: 'boolean' },
      bufferStrips: { type: 'boolean' },
      precisionFertilization: { type: 'boolean' }
    },
    required: ['fieldId']
  }
};

// System prompts for each form type
const SYSTEM_PROMPTS: Record<string, string> = {
  'field-registration': `You are Delta Intelligence, helping a Louisiana Delta farmer register a new field. Be conversational, friendly, and use farming terminology.

Your job is to gather field information through natural conversation:
- Field Name (required)
- Crop Type: rice, soybeans, cotton, or corn (required)
- Acreage (required)
- Soil Type: alluvial, claypan, or mixed (optional)
- Planting Date (optional)
- Variety (optional, based on crop type)
- Location coordinates (optional)
- Irrigation type (optional)

CONVERSATION GUIDELINES:
- Ask ONE question at a time
- Be encouraging and supportive
- Reference LSU AgCenter research when relevant
- Use Louisiana Delta farming terminology
- If farmer provides multiple pieces of info at once, acknowledge all and ask about what's missing
- Celebrate progress: "Great! I've got your field name..."

CONTEXT AWARENESS:
- Reference existing fields if farmer has them
- Suggest varieties based on soil type and LSU recommendations
- Auto-fill location if GPS available

RESPONSE FORMAT:
Always return JSON with:
{
  "message": "Your conversational response to the farmer",
  "extractedData": { ... fields extracted so far ... },
  "completionPercentage": 0-100,
  "nextQuestion": "What should I ask next?",
  "suggestions": ["Quick reply option 1", "Quick reply option 2"]
}`,
  
  'insurance-claim': `You are Delta Intelligence, helping a Louisiana Delta farmer document an insurance claim. Be empathetic - farmers are stressed when filing claims.

Your job is to gather claim information:
- Which field was affected? (required)
- What type of event? (flood, drought, hail, wind, pest, disease) (required)
- When did it happen? (required)
- Describe the damage (required)
- Estimated loss percentage (required)

CONVERSATION GUIDELINES:
- Be empathetic and supportive ("I'm sorry to hear about the damage...")
- Ask ONE question at a time
- Help farmers describe damage accurately
- Reference any existing assessments that might support the claim
- Explain what documentation will be needed

RESPONSE FORMAT:
Always return JSON with extractedData, message, completionPercentage, nextQuestion, suggestions.`,
  
  'conservation-practices': `You are Delta Intelligence, helping a Louisiana Delta farmer track conservation practices. Be educational about the benefits.

Your job is to gather conservation practice information:
- Which field? (required)
- Cover crops? (yes/no)
- No-till farming? (yes/no)
- Crop rotation? (yes/no)
- Buffer strips? (yes/no)
- Precision fertilization? (yes/no)

CONVERSATION GUIDELINES:
- Explain benefits of each practice (reference LSU AgCenter research)
- Ask about one practice at a time
- Celebrate when farmers adopt practices
- Mention ROI and environmental benefits

RESPONSE FORMAT:
Always return JSON with extractedData, message, completionPercentage, nextQuestion, suggestions.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validation = conversationalFormSchema.safeParse(rawBody);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: validation.error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { sessionId, message, formType } = validation.data;
    
    const authHeader = req.headers.get('authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user context
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Get session and conversation history
    const { data: session } = await supabaseClient
      .from('conversational_form_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return new Response('Session not found', { status: 404, headers: corsHeaders });
    }

    const { data: messages } = await supabaseClient
      .from('conversational_form_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Gather user context (fields, assessments)
    const { data: fields } = await supabaseClient
      .from('fields')
      .select('id, name, crop_type, acreage, location_lat, location_lng')
      .eq('user_id', user.id);

    const { data: recentAssessments } = await supabaseClient
      .from('assessments')
      .select('health_score, stress_level, field:fields(name, crop_type)')
      .order('analyzed_at', { ascending: false })
      .limit(3);

    // Build context prompt
    let contextPrompt = '\n\nUSER CONTEXT:\n';
    
    if (fields && fields.length > 0) {
      contextPrompt += `Existing Fields:\n${fields.map((f: any) => 
        `- ${f.name}: ${f.acreage} acres of ${f.crop_type}`
      ).join('\n')}\n`;
    }

    if (recentAssessments && recentAssessments.length > 0) {
      contextPrompt += `\nRecent Assessments:\n${recentAssessments.map((a: any) =>
        `- ${a.field?.name}: Health ${a.health_score}/100, ${a.stress_level} stress`
      ).join('\n')}\n`;
    }

    contextPrompt += `\nCurrent Form Progress:\n`;
    contextPrompt += `- Extracted Data: ${JSON.stringify(session.extracted_data || {})}\n`;
    contextPrompt += `- Completion: ${session.completion_percentage}%\n`;

    // Build conversation history
    const conversationHistory = (messages || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Add user's new message
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Save user message to database
    await supabaseClient
      .from('conversational_form_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      });

    // Get schema for this form type
    const schema = FORM_SCHEMAS[formType];
    const systemPrompt = SYSTEM_PROMPTS[formType] || SYSTEM_PROMPTS['field-registration'];

    // Call AI with structured output
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
            content: systemPrompt + contextPrompt + `\n\nSCHEMA:\n${JSON.stringify(schema, null, 2)}\n\nIMPORTANT: Return valid JSON only.`
          },
          ...conversationHistory
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
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

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices[0].message.content;
    
    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch {
      parsedResponse = {
        message: aiMessage,
        extractedData: session.extracted_data || {},
        completionPercentage: session.completion_percentage || 0,
        nextQuestion: null,
        suggestions: []
      };
    }

    // Calculate completion percentage
    const requiredFields = schema.required || [];
    const extractedFields = Object.keys(parsedResponse.extractedData || {});
    const completionPercentage = requiredFields.length > 0 
      ? Math.round((extractedFields.filter((f: string) => requiredFields.includes(f)).length / requiredFields.length) * 100)
      : 0;

    // Update session with extracted data
    const { error: updateError } = await supabaseClient
      .from('conversational_form_sessions')
      .update({
        extracted_data: parsedResponse.extractedData,
        completion_percentage: completionPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
    }

    // Save assistant message
    await supabaseClient
      .from('conversational_form_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: parsedResponse.message,
        field_mapping: JSON.stringify(parsedResponse.extractedData)
      });

    return new Response(JSON.stringify({
      message: parsedResponse.message,
      extractedData: parsedResponse.extractedData,
      completionPercentage,
      nextQuestion: parsedResponse.nextQuestion,
      suggestions: parsedResponse.suggestions || [],
      isComplete: completionPercentage >= 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Conversational form error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});