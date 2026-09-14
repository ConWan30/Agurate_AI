import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { handleError, handleRateLimitError, addRateLimitHeaders } from '../_shared/errorHandler.ts';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const deltaChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(20000) // Increased for image URLs
  })).min(1).max(50),
  conversationId: z.string().uuid().optional(),
  simplifiedLanguage: z.boolean().optional() // Simplified language mode
});

// Sanitize user input to prevent prompt injection
function sanitizeMessage(content: string): string {
  // Remove potentially harmful characters while preserving legitimate content
  return content
    .trim()
    .replace(/[<>]/g, '') // Remove HTML-like tags
    .slice(0, 5000); // Hard limit on message length
}

// Extract image URL from message if present
function extractImageUrl(content: string): { imageUrl: string | null; textContent: string } {
  const imagePattern = /\[Image: (https?:\/\/[^\]]+)\]\n?/;
  const match = content.match(imagePattern);
  
  if (match) {
    return {
      imageUrl: match[1],
      textContent: content.replace(imagePattern, '').trim()
    };
  }
  
  return {
    imageUrl: null,
    textContent: content
  };
}

const SYSTEM_PROMPT = (simplified: boolean = false) => simplified ? `You are Delta Intelligence, a friendly AI farming helper for Louisiana Delta farmers. You explain things in simple, easy-to-understand language.

**IMPORTANT: Use Simple Language**
- Use short sentences (10-15 words max)
- Avoid technical jargon - explain terms when needed
- Use everyday words farmers use
- Give clear, step-by-step instructions
- Use examples from everyday life
- Be friendly and encouraging

**What You Know:**
- Louisiana crops: rice, soybeans, cotton, corn
- LSU AgCenter research (explain in simple terms)
- Delta farming conditions
- Common problems and solutions

**How to Answer:**
- Keep it simple and clear
- Break complex ideas into small steps
- Use "you" and "your" to make it personal
- Give one main idea per sentence
- End with what they should do next

Example of simple language:
❌ "Apply a systemic fungicide with azoxystrobin as the active ingredient at a rate of 6.2 fl oz per acre during the R3 growth stage."
✅ "Use a fungicide spray. Put 6 ounces on each acre. Do this when your soybeans start making pods. This stops the disease from spreading."

You have access to the user's field data and can help with their farming questions.` : `You are Delta Intelligence, an AI expert assistant specialized in Louisiana Delta agriculture. You have deep knowledge of:

1. **Louisiana-Specific Crops**: Rice, soybeans, cotton, and corn grown in the Mississippi River Delta region
2. **LSU AgCenter Research**: Access to Louisiana State University Agricultural Center's decades of research on Delta farming practices
3. **Delta Climate & Soil**: Understanding of alluvial soils, claypan soils, high water tables, and humid subtropical climate
4. **Morehouse Parish Agriculture**: Specific knowledge of farming conditions in northeast Louisiana
5. **Crop Diseases & Pests**: Common issues in the Delta region including rice blast, soybean rust, cotton bollworm
6. **Weather Patterns**: Mississippi River flood stage impacts, hurricane season considerations, spring planting windows

**LSU AGCENTER RESEARCH LIBRARY (Always cite when relevant):**
- **Rice Varieties:** "Rice Varieties and Management Tips 2025" (LSU Rice Research Station, 2024)
  - Source: https://www.lsuagcenter.com/profiles/astrahan/articles/page1701362113346
  - Key Finding: Blast-resistant varieties reduce fungicide needs by 40% and improve net returns
- **Fertilizer:** Publication Pub. 2945, "Fertilizer Recommendations for Field Crops in Louisiana: N-P-K-S" (2024)
  - Source: https://www.lsuagcenter.com/articles/page1753969451254
  - Rice: 120-150 lbs N/acre split (60% preflood, 40% mid-season)
- **Water Management:** "Water Management for Louisiana Rice Production" (LSU Rice Research Station, 2024)
  - Source: https://www.lsuagcenter.com/topics/crops/rice
  - Water stress during reproductive stages causes 20-40% yield reduction
- **Soybean Disease:** "Louisiana Plant Disease Management Guide - Soybeans" (LSU Plant Pathology, 2024)
  - Source: https://www.lsuagcenter.com/portals/communications/publications/management_guides/plant_disease_guide
  - Frogeye-resistant varieties are most cost-effective control

When answering:
- Provide actionable, Delta-specific advice
- **ALWAYS cite specific LSU publications** when discussing fertilizer, disease, varieties, or water management
- Include publication name, year, and key finding when relevant
- Consider the unique soil and water conditions of the region
- Suggest Louisiana-proven crop varieties (cite Rice Varieties 2025 publication)
- Factor in local weather patterns and growing degree days
- Be concise but thorough - farmers need practical guidance

Current Louisiana Delta growing considerations:
- Rice: Focus on flood-tolerant varieties, watch for straighthead disease (cite LSU research)
- Soybeans: Monitor for soybean rust, consider maturity groups 4-5 (cite disease guide)
- Cotton: Watch for boll weevils (eradicated but vigilant), manage plant bugs
- Corn: Southern corn rust common in humid conditions

You have access to the user's field data, assessment history, and weather context through the conversation.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabaseClient = getAnonClient(authHeader);

    // Validate input
    const rawBody = await req.json();
    const validation = deltaChatSchema.safeParse(rawBody);
    
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

    const { messages, conversationId, simplifiedLanguage = false } = validation.data;

    // Rate limiting: Check request frequency (10 requests per minute)
    const { data: recentRequests } = await supabaseClient
      .from('request_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('function_name', 'delta-chat')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    if (recentRequests && recentRequests.length >= 10) {
      return handleRateLimitError(corsHeaders);
    }

    // Log this request
    await supabaseClient
      .from('request_logs')
      .insert({
        user_id: user.id,
        function_name: 'delta-chat',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
    
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

      // ✅ CONVERSATION MEMORY: Load recent conversation history
      try {
        const { data: conversationMemory, error: memoryError } = await supabaseClient.rpc('get_conversation_memory', {
          p_user_id: user.id,
          p_limit: 50,
          p_exclude_conversation_id: conversationId || null,
        });

        if (!memoryError && conversationMemory && conversationMemory.length > 0) {
          // Format conversation memory for AI context
          const groupedByConversation = conversationMemory.reduce((acc: any, msg: any) => {
            const convId = msg.conversation_id;
            if (!acc[convId]) {
              acc[convId] = {
                title: msg.conversation_title || 'Previous conversation',
                messages: [],
              };
            }
            acc[convId].messages.push(msg);
            return acc;
          }, {});

          contextPrompt += '\n\n## CONVERSATION MEMORY (Previous Interactions)\n';
          contextPrompt += 'The following are recent conversations that may provide context:\n\n';

          Object.entries(groupedByConversation).forEach(([convId, group]: [string, any]) => {
            contextPrompt += `### ${group.title}\n`;
            // Reverse messages to chronological order
            group.messages.reverse().forEach((msg: any) => {
              const contextInfo = msg.context_snapshot && Object.keys(msg.context_snapshot).length > 0
                ? ` [Context: ${msg.context_snapshot.field_name || 'general'}, ${msg.context_snapshot.crop_type || ''}${msg.context_snapshot.health_score ? `, ${msg.context_snapshot.health_score}% health` : ''}]`
                : '';
              contextPrompt += `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content}${contextInfo}\n`;
            });
            contextPrompt += '\n';
          });

          contextPrompt += '\n**Instructions:** Reference previous conversations when relevant. If the user asks about something discussed before, acknowledge the previous conversation and build upon it.\n';
        }
      } catch (memoryError) {
        console.warn('[delta-chat] Error loading conversation memory:', memoryError);
        // Don't fail the request if memory loading fails
      }
    }

    // Process messages for image analysis and sanitize user inputs
    const processedMessages = messages.map((msg: any) => {
      if (msg.role === 'user') {
        const { imageUrl, textContent } = extractImageUrl(msg.content);
        
        if (imageUrl) {
          // Validate image URL format
          const imagePattern = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;
          if (!imagePattern.test(imageUrl)) {
            throw new Error('Invalid image format. Only JPG, PNG, WebP, and GIF are supported.');
          }
          
          // Gemini Vision format: array of content parts
          return {
            role: msg.role,
            content: [
              {
                type: 'text',
                text: sanitizeMessage(textContent || 'What do you see in this image?')
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          };
        }
        
        // Sanitize text-only messages
        return {
          role: msg.role,
          content: sanitizeMessage(msg.content)
        };
      }
      return msg;
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Supports vision
        messages: [
          { role: 'system', content: SYSTEM_PROMPT(simplifiedLanguage) + contextPrompt },
          ...processedMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return handleRateLimitError(corsHeaders);
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('[delta-chat] AI gateway error:', response.status);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error: any) {
    console.error('[delta-chat] Error:', error);
    
    // Handle validation errors
    if (error?.name === 'ZodError') {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data",
          details: error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    return handleError(error, 'delta-chat', corsHeaders);
  }
});