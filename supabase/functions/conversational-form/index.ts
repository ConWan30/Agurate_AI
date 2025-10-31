import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Form schemas define expected output structure
const FORM_SCHEMAS: Record<string, any> = {
  'field-registration': {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Field name (e.g., North Rice Field)' },
      crop_type: { type: 'string', enum: ['rice', 'soybeans', 'cotton', 'corn'] },
      acreage: { type: 'number', minimum: 0 },
      location_lat: { type: 'number' },
      location_lng: { type: 'number' },
      rice_variety: { type: 'string' },
      soybean_variety: { type: 'string' },
      cotton_variety: { type: 'string' },
      corn_hybrid: { type: 'string' },
      notes: { type: 'string' }
    },
    required: ['name', 'crop_type', 'acreage']
  },
  'insurance-claim': {
    type: 'object',
    properties: {
      field_id: { type: 'string', format: 'uuid' },
      event_type: { type: 'string', enum: ['flood', 'drought', 'hail', 'wind', 'pest', 'disease'] },
      event_date: { type: 'string', format: 'date' },
      description: { type: 'string' },
      estimated_loss_percentage: { type: 'number', minimum: 0, maximum: 100 },
      assessment_id: { type: 'string', format: 'uuid' }
    },
    required: ['field_id', 'event_type', 'event_date', 'description']
  }
};

// System prompts for each form type
const SYSTEM_PROMPTS: Record<string, string> = {
  'field-registration': `You are Delta Intelligence, an AI assistant specialized in Louisiana Delta agriculture. You're helping a farmer register a new field in AgurateAI.

Be conversational, friendly, and use farming terminology. Reference LSU AgCenter research when relevant.

Your goal: Extract the following information through natural conversation:
- Field name (what they call it)
- Crop type (rice, soybeans, cotton, or corn)
- Acreage (size of field)
- Variety (specific variety based on crop type)
- Location (GPS coordinates if available)
- Any additional notes

Context awareness:
- If the farmer has existing fields, reference them ("I see you have South Rice Field...")
- Suggest similar setups based on their farm patterns
- Use community averages for guidance ("Most Morehouse Parish rice farmers...")

Response format:
Always respond with valid JSON in this structure:
{
  "message": "Your conversational response to the user",
  "extracted_data": { "name": "value", "crop_type": "rice", ... },
  "completion_percentage": 60,
  "next_question": "What would you like to plant in this field?",
  "suggestions": ["Rice", "Soybeans", "Cotton", "Corn"]
}`,
  
  'insurance-claim': `You are Delta Intelligence helping a Louisiana Delta farmer document an insurance claim for crop damage.

Be empathetic and thorough. This is important for their livelihood.

Your goal: Extract the following information:
- Which field was affected
- Type of damage (flood, drought, hail, wind, pest, disease)
- When it happened
- Description of damage
- Estimated loss percentage
- Link to any relevant crop assessments

Context awareness:
- Reference the farmer's existing fields
- Suggest linking recent assessments with poor health scores
- Guide them on what insurance companies need to see

Response format:
{
  "message": "Your empathetic, helpful response",
  "extracted_data": { "field_id": "uuid", "event_type": "flood", ... },
  "completion_percentage": 40,
  "next_question": "When did this damage occur?",
  "suggestions": ["Last week", "2 weeks ago", "Last month"]
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, formType } = await req.json();

    if (!sessionId || !message || !formType) {
      throw new Error('Missing required parameters');
    }

    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Get session
    const { data: session, error: sessionError } = await supabaseClient
      .from('conversational_form_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) throw new Error('Session not found');

    // Get conversation history
    const { data: messages, error: messagesError } = await supabaseClient
      .from('conversational_form_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) throw new Error('Failed to fetch messages');

    // Get user context (fields, assessments, etc.)
    const { data: fields } = await supabaseClient
      .from('fields')
      .select('*')
      .eq('user_id', user.id);

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Build context for AI
    const contextSummary = {
      farmName: profile?.farm_name,
      existingFields: fields?.map((f: any) => ({
        id: f.id,
        name: f.name,
        cropType: f.crop_type,
        acreage: f.acreage
      })) || [],
      extractedSoFar: session.extracted_data || {}
    };

    // Save user message
    await supabaseClient
      .from('conversational_form_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      });

    // Build conversation history for AI
    const conversationHistory = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `${SYSTEM_PROMPTS[formType] || SYSTEM_PROMPTS['field-registration']}

CONTEXT:
${JSON.stringify(contextSummary, null, 2)}

SCHEMA:
${JSON.stringify(FORM_SCHEMAS[formType] || FORM_SCHEMAS['field-registration'], null, 2)}` 
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service quota exceeded. Please contact support.');
      }
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0]?.message?.content || '';

    // Parse AI response (expect JSON)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch {
      // If AI didn't return JSON, wrap it
      parsedResponse = {
        message: aiMessage,
        extracted_data: {},
        completion_percentage: 0,
        next_question: null
      };
    }

    // Update extracted data
    const updatedData = {
      ...session.extracted_data,
      ...parsedResponse.extracted_data
    };

    // Calculate completion percentage based on required fields
    const schema = FORM_SCHEMAS[formType] || FORM_SCHEMAS['field-registration'];
    const requiredFields = schema.required || [];
    const completedFields = requiredFields.filter((field: string) => {
      return updatedData[field] !== undefined && updatedData[field] !== null && updatedData[field] !== '';
    });
    const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);

    // Update session
    await supabaseClient
      .from('conversational_form_sessions')
      .update({
        extracted_data: updatedData,
        completion_percentage: completionPercentage
      })
      .eq('id', sessionId);

    // Save assistant message
    await supabaseClient
      .from('conversational_form_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: parsedResponse.message || aiMessage,
        field_mapping: parsedResponse.extracted_data ? JSON.stringify(parsedResponse.extracted_data) : null
      });

    return new Response(
      JSON.stringify({
        message: parsedResponse.message || aiMessage,
        extracted_data: updatedData,
        completion_percentage: completionPercentage,
        next_question: parsedResponse.next_question,
        suggestions: parsedResponse.suggestions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in conversational-form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
