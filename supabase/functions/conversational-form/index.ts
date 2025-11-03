import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { handleError, handleAuthError, handleRateLimitError } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize user input to prevent prompt injection and XSS
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML-like tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .slice(0, 2000); // Hard limit on input length
}

// Form schemas define expected output structure
const FORM_SCHEMAS: Record<string, any> = {
  'field-registration': {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Field name (e.g., North Rice Field)' },
      crop_type: { type: 'string', enum: ['rice', 'soybean', 'cotton', 'corn'] },
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
      assessment_ids: { type: 'array', items: { type: 'string', format: 'uuid' } }
    },
    required: ['field_id', 'event_type', 'event_date', 'description']
  },
  'conservation-practices': {
    type: 'object',
    properties: {
      field_id: { type: 'string', format: 'uuid' },
      tillage_type: { type: 'string', enum: ['no-till', 'reduced-till', 'conventional'] },
      cover_crops: { type: 'boolean' },
      crop_rotation: { type: 'boolean' },
      buffer_strips: { type: 'boolean' },
      precision_fertilization: { type: 'boolean' },
      notes: { type: 'string' }
    },
    required: ['field_id', 'tillage_type']
  },
  'onboarding': {
    type: 'object',
    properties: {
      farm_name: { type: 'string' },
      full_name: { type: 'string' },
      parish: { type: 'string' },
      primary_crops: { type: 'array', items: { type: 'string' } },
      total_acreage: { type: 'number', minimum: 0 },
      phone: { type: 'string' }
    },
    required: ['farm_name', 'parish', 'primary_crops']
  }
};

// System prompts for each form type
const SYSTEM_PROMPTS: Record<string, string> = {
  'field-registration': `You are Delta Intelligence, an AI assistant specialized in Louisiana Delta agriculture. You're helping a farmer register a new field in AgurateAI.

Be conversational, friendly, and use farming terminology. Reference LSU AgCenter research when relevant.

Your goal: Extract the following information through natural conversation:
- Field name (what they call it)
- Crop type (rice, soybean, cotton, or corn) - IMPORTANT: Use "soybean" not "soybeans"
- Acreage (size of field)
- Variety (specific variety based on crop type)
- Location (GPS coordinates if available)
- Any additional notes

Context awareness:
- If the farmer has existing fields, reference them ("I see you have South Rice Field...")
- Suggest similar setups based on their farm patterns
- Use community averages for guidance ("Most Morehouse Parish rice farmers...")

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a raw JSON object. NO text before or after. NO markdown code blocks.
2. The "message" field is REQUIRED and must contain your conversational response to the farmer
3. The "next_question" field should contain a brief prompt for what to ask next (optional)

REQUIRED FORMAT:
{
  "message": "Your full conversational response that will be shown to the farmer",
  "extracted_data": {...},
  "completion_percentage": 60,
  "next_question": "Brief next question prompt",
  "suggestions": [...]
}

EXAMPLE CORRECT RESPONSE:
{
  "message": "Thank you for confirming. It's helpful to know we're looking at the soybean field. Now, what type of damage occurred? Was it flood, drought, hail, wind, pests, or disease?",
  "extracted_data": {"field_id": "abc123"},
  "completion_percentage": 40,
  "next_question": "What type of damage?",
  "suggestions": ["Flood", "Drought", "Hail"]
}`,
  
  'insurance-claim': `You are Delta Intelligence helping a Louisiana Delta farmer document an insurance claim for crop damage.

Be empathetic, thorough, and leverage ALL unified intelligence context. This is critical for their livelihood.

UNIFIED INTELLIGENCE AWARENESS:
- You have access to recent field assessments with health scores and stress levels
- You know recent weather events (floods, droughts, hail, etc.) in their area
- You can correlate health score drops with weather events
- You can auto-suggest assessments from around the event date as evidence

Your goal: Extract comprehensive claim documentation:
1. Field identification (reference existing fields by name)
2. Damage type (flood, drought, hail, wind, pest, disease)
3. Event date (cross-reference with weather intelligence)
4. Detailed damage description (visual, extent, progression)
5. Estimated loss percentage (realistic, based on assessment data)
6. Link relevant crop assessments as photo evidence
7. Weather correlation (if recent weather events match)

INTELLIGENT AUTO-LINKING:
- When user mentions a field and event date:
  * Auto-search assessments from ±7 days of event date
  * Identify assessments with health scores <70 (moderate to severe stress)
  * Calculate health score drops (compare before/after event)
  * Auto-suggest these as evidence: "I found 3 assessments from your North Rice Field around that time showing 45% health score. Should I link these as evidence?"

- Weather event correlation:
  * If recent weather events match the claimed event type and date, mention it
  * Example: "I see we had a major flood event on July 15th in Morehouse Parish. Is this what affected your field?"

EVIDENCE COMPILATION INTELLIGENCE:
- Guide them on insurance-grade documentation standards
- Explain what crop adjusters need (LSU AgCenter damage assessment protocols)
- Suggest additional evidence if claim seems weak
- Calculate estimated dollar loss based on acreage × crop price × loss percentage

COMMUNITY CONTEXT:
- If multiple farmers in their cooperative have similar claims, mention it (validates their claim)
- Reference typical loss percentages for similar events in Louisiana Delta

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a raw JSON object. NO text before or after. NO markdown code blocks.
2. The "message" field is REQUIRED and contains your empathetic, intelligent response
3. Use unified intelligence context to provide specific, actionable guidance
4. Auto-suggest linked assessments when you identify relevant ones

REQUIRED FORMAT:
{
  "message": "Your full conversational response leveraging unified intelligence",
  "extracted_data": {...},
  "completion_percentage": 60,
  "next_question": "Brief next question prompt",
  "suggestions": [...],
  "auto_linked_assessments": ["assessment_id_1", "assessment_id_2"],
  "weather_correlation": "Match found: Flood event on 2025-07-15",
  "estimated_loss_dollars": 12500
}`,
  
  'conservation-practices': `You are Delta Intelligence helping a Louisiana Delta farmer document conservation practices for USDA compliance and cost savings.

Be educational and encouraging. Conservation practices save money and improve soil health.

Your goal: Extract the following information through conversation:
- Which field they're documenting practices for
- Tillage type (no-till, reduced-till, conventional)
- Cover crops usage (yes/no, which crops)
- Crop rotation (yes/no, rotation pattern)
- Buffer strips (yes/no, width)
- Precision fertilization (yes/no, technology used)

Real-time Calculations:
- Calculate nitrogen credit from cover crops ($15-30/acre)
- Estimate fuel savings from reduced tillage ($8-12/acre)
- Calculate USDA Climate-Smart Agriculture Program eligibility
- Reference LSU AgCenter research on practice effectiveness

Educational Approach:
- Explain benefits of each practice during conversation
- Cite LSU research findings
- Provide cost-benefit analysis in real-time
- Guide on USDA documentation requirements

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a raw JSON object. NO text before or after. NO markdown code blocks.
2. The "message" field is REQUIRED and must contain your conversational response to the farmer
3. The "next_question" field should contain a brief prompt for what to ask next (optional)

REQUIRED FORMAT:
{
  "message": "Your full conversational response that will be shown to the farmer",
  "extracted_data": {...},
  "completion_percentage": 50,
  "next_question": "Brief next question prompt",
  "suggestions": [...],
  "cost_savings_estimate": 850
}`,
  
  'onboarding': `You are Delta Intelligence, welcoming a new Louisiana Delta farmer to AgurateAI!

Be warm, enthusiastic, and explain beta program benefits. This is their first impression.

Your goal: Collect profile information and create their first field:
- Farm name (what they call their operation)
- Farmer's full name
- Parish (Louisiana parish location)
- Primary crops (rice, soybeans, cotton, corn)
- Total farm acreage
- Phone number (optional, for text alerts)

Parish-Specific Personalization:
- Mention parish-specific farming conditions ("Morehouse Parish is known for great rice farming!")
- Reference common crops in their parish
- Connect them with local LSU extension agents (future)

Beta Program Communication:
- Explain they're getting FREE access during beta (normally $790/year)
- Mention 80% lifetime discount after beta ($158/year forever)
- Explain they're helping build the future of Louisiana agriculture

First Field Setup:
- After profile complete, offer to set up their first field
- Make it conversational and easy
- Celebrate completion!

CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY a raw JSON object. NO text before or after. NO markdown code blocks.
2. The "message" field is REQUIRED and must contain your conversational response to the farmer
3. The "next_question" field should contain a brief prompt for what to ask next (optional)

REQUIRED FORMAT:
{
  "message": "Your full conversational response that will be shown to the farmer",
  "extracted_data": {"farm_name": "value", "parish": "Morehouse", ...},
  "completion_percentage": 70,
  "next_question": "Brief next question prompt",
  "suggestions": ["Rice", "Soybeans", "Cotton", "Corn"],
  "beta_benefit_highlight": "You're saving $790/year during beta!"
}`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const { sessionId, message, formType } = rawBody;
    
    // Validate and sanitize inputs
    if (!sessionId || !message || !formType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const sanitizedMessage = sanitizeInput(message);

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
    if (userError || !user) {
      console.error('[conversational-form] Authentication failed');
      return handleAuthError(corsHeaders);
    }

    // Rate limiting: Check request frequency (20 requests per minute for forms)
    const { data: recentRequests } = await supabaseClient
      .from('request_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('function_name', 'conversational-form')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    if (recentRequests && recentRequests.length >= 20) {
      return handleRateLimitError(corsHeaders);
    }

    // Log this request
    await supabaseClient
      .from('request_logs')
      .insert({
        user_id: user.id,
        function_name: 'conversational-form',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

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

    // Gather comprehensive unified intelligence context
    let recentAssessments: any[] = [];
    let weatherEvents: any[] = [];
    let communityInsights: any[] = [];
    let varietyRecommendations: any[] = [];
    
    if (fields && fields.length > 0) {
      const fieldIds = fields.map((f: any) => f.id);
      
      // Parallel context gathering
      const [assessmentsRes, weatherRes, communityRes, varietyRes] = await Promise.all([
        supabaseClient
          .from('assessments')
          .select('*')
          .in('field_id', fieldIds)
          .order('analyzed_at', { ascending: false })
          .limit(10),
        
        supabaseClient
          .from('weather_events')
          .select('*')
          .order('event_date', { ascending: false })
          .limit(5),
        
        supabaseClient
          .from('best_practices_network')
          .select('*')
          .order('adoption_count', { ascending: false })
          .limit(5),
        
        supabaseClient
          .from('variety_recommendations')
          .select('*')
          .in('field_id', fieldIds)
          .order('recommendation_date', { ascending: false })
          .limit(3)
      ]);
      
      recentAssessments = assessmentsRes.data || [];
      weatherEvents = weatherRes.data || [];
      communityInsights = communityRes.data || [];
      varietyRecommendations = varietyRes.data || [];
    }

    // Build enhanced unified intelligence context for AI
    const contextSummary = {
      // Farm Profile
      farmName: profile?.farm_name,
      parish: profile?.parish,
      totalAcreage: profile?.total_acreage,
      primaryCrops: profile?.primary_crops,
      
      // Existing Fields
      existingFields: fields?.map((f: any) => ({
        id: f.id,
        name: f.name,
        cropType: f.crop_type,
        acreage: f.acreage,
        soilType: f.soil_type,
        plantingDate: f.planting_date
      })) || [],
      
      // Recent Crop Health
      recentAssessments: recentAssessments.map((a: any) => ({
        id: a.id,
        fieldId: a.field_id,
        healthScore: a.health_score,
        stressLevel: a.stress_level,
        date: a.analyzed_at,
        symptoms: a.symptoms
      })),
      
      // Weather Intelligence
      recentWeatherEvents: weatherEvents.map((w: any) => ({
        eventType: w.event_type,
        date: w.event_date,
        severity: w.severity,
        impact: w.impact_description
      })),
      
      // Community Intelligence
      communityBestPractices: communityInsights.map((c: any) => ({
        practice: c.practice_name,
        adopters: c.adoption_count,
        successRate: c.success_rate,
        avgSavings: c.average_savings
      })),
      
      // Variety Intelligence
      varietyRecommendations: varietyRecommendations.map((v: any) => ({
        cropType: v.crop_type,
        recommended: v.recommended_variety,
        current: v.current_variety,
        expectedImprovement: v.expected_improvement
      })),
      
      // Session State
      extractedSoFar: session.extracted_data || {},
      formType,
      
      // Beta Program
      betaProgram: profile?.beta_farmer ? {
        lifetimeDiscount: 80,
        savingsPerYear: 632
      } : null
    };

    // Save user message with sanitized content
    await supabaseClient
      .from('conversational_form_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: sanitizedMessage
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
    let aiMessage = aiData.choices[0]?.message?.content || '';

    // Strip markdown code blocks if present (```json ... ```)
    aiMessage = aiMessage.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Parse AI response (expect JSON)
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiMessage);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiMessage, parseError);
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
        content: parsedResponse.message || parsedResponse.next_question || aiMessage,
        field_mapping: parsedResponse.extracted_data ? JSON.stringify(parsedResponse.extracted_data) : null
      });

    return new Response(
      JSON.stringify({
        message: parsedResponse.message || parsedResponse.next_question || aiMessage,
        extracted_data: updatedData,
        completion_percentage: completionPercentage,
        next_question: parsedResponse.next_question,
        suggestions: parsedResponse.suggestions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[conversational-form] Error:', error);
    return handleError(error, 'conversational-form', corsHeaders);
  }
});
