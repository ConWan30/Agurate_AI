import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const analyzeCropSchema = z.object({
  imageUrl: z.string().url().max(2048),
  cropType: z.enum(['rice', 'soybean', 'cotton', 'corn']),
  fieldId: z.string().uuid().optional(),
  location: z.string().max(200).optional(),
  mediaType: z.enum(['image', 'video']).default('image')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawBody = await req.json();
    const validation = analyzeCropSchema.safeParse(rawBody);
    
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

    const { imageUrl, cropType, fieldId, location, mediaType } = validation.data;
    console.log('🌾 Analyzing crop media with unified context:', { imageUrl, cropType, fieldId, location, mediaType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // STEP 0: Gather unified context if fieldId provided
    let unifiedContext = '';
    if (fieldId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const [
        { data: fieldData },
        { data: assessmentHistory },
        { data: conservationData },
        { data: varietyData },
        { data: waterStressData }
      ] = await Promise.all([
        supabase.from('fields').select('*').eq('id', fieldId).single(),
        supabase.from('assessments').select('health_score, stress_level, symptoms, analyzed_at').eq('field_id', fieldId).order('analyzed_at', { ascending: false }).limit(5),
        supabase.from('conservation_predictions').select('practice_type, current_impact, confidence_score').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(3),
        supabase.from('variety_performance_metrics').select('variety_name, performance_score, disease_resistance').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(3),
        supabase.from('water_stress_events').select('stress_score, severity, created_at').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(3)
      ]);

      unifiedContext = `
═══════════════════════════════════════════════════════════════
🧠 UNIFIED FIELD INTELLIGENCE (Historical Context Integration)
═══════════════════════════════════════════════════════════════

📊 FIELD PROFILE:
- Variety: ${fieldData?.rice_variety || fieldData?.soybean_variety || fieldData?.cotton_variety || fieldData?.corn_hybrid || 'Unknown'}
- Acreage: ${fieldData?.acreage || 'Unknown'} acres
- Soil Type: ${fieldData?.soil_type || 'Not specified'}

📈 HISTORICAL HEALTH TREND (Last 5 Assessments):
${assessmentHistory && assessmentHistory.length > 0 
  ? assessmentHistory.map((a: any, i: number) => 
      `${i + 1}. ${new Date(a.analyzed_at).toLocaleDateString()}: Health ${a.health_score}%, Stress: ${a.stress_level}${a.symptoms?.length > 0 ? `, Symptoms: ${a.symptoms.join(', ')}` : ''}`
    ).join('\n') 
  : '- No historical data available (first assessment)'}

🌱 ACTIVE CONSERVATION PRACTICES:
${conservationData && conservationData.length > 0 
  ? conservationData.map((c: any) => `- ${c.practice_type}: Current Impact ${(c.current_impact * 100).toFixed(0)}%, Confidence ${(c.confidence_score * 100).toFixed(0)}%`).join('\n')
  : '- No conservation practices recorded'}

🔬 VARIETY PERFORMANCE INTELLIGENCE:
${varietyData && varietyData.length > 0
  ? varietyData.map((v: any) => `- ${v.variety_name}: Performance ${(v.performance_score * 100).toFixed(0)}%, Disease Resistance ${(v.disease_resistance * 100).toFixed(0)}%`).join('\n')
  : '- No variety performance data available'}

💧 RECENT WATER STRESS EVENTS (Last 30 days):
${waterStressData && waterStressData.length > 0
  ? waterStressData.map((w: any) => `- ${new Date(w.created_at).toLocaleDateString()}: Stress Score ${(w.stress_score * 100).toFixed(0)}%, Severity: ${w.severity}`).join('\n')
  : '- No water stress events recorded'}

🎯 CRITICAL ANALYSIS DIRECTIVE:
Use ALL historical context above to:
1. Compare current symptoms with historical progression patterns
2. Identify if issues are worsening, stable, or improving
3. Cross-reference variety-specific vulnerabilities
4. Consider conservation practice impacts on current health
5. Provide context-aware recommendations that account for field history

═══════════════════════════════════════════════════════════════
`;
      console.log('✅ Unified context gathered for field:', fieldId);
    }

    // STEP 1: Fetch current weather data for Louisiana (Morehouse Parish coordinates)
    let weatherData = null;
    try {
      // Open-Meteo API for Morehouse Parish, LA (32.73°N, -91.76°W)
      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=32.73&longitude=-91.76&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&forecast_days=7&timezone=America/Chicago'
      );
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        const precipSum = weather.daily.precipitation_sum.reduce((a: number, b: number) => a + b, 0);
        weatherData = {
          temp_f: weather.current_weather.temperature,
          precipitation_7day: precipSum,
          temp_max: Math.max(...weather.daily.temperature_2m_max),
          temp_min: Math.min(...weather.daily.temperature_2m_min)
        };
        console.log('Weather data fetched for Morehouse Parish:', weatherData);
      }
    } catch (err) {
      console.warn('Weather fetch failed, continuing without it:', err);
    }

    // STEP 2: Analyze crop media (image or video)
    // Use gemini-2.5-pro for video analysis
    const model = mediaType === 'video' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';
    
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI for Louisiana Delta farmers with access to comprehensive field intelligence history.

CONTEXT:
- Location: Morehouse Parish, Louisiana (subtropical climate, high disease pressure)
- Soils: Alluvial/claypan soils typical of Mississippi Delta
- Climate: Warm, humid with high rainfall

${unifiedContext ? '🧠 YOU HAVE ACCESS TO UNIFIED FIELD INTELLIGENCE - Use historical context to enhance diagnosis accuracy!' : ''}

${mediaType === 'video' 
  ? 'Analyze drone video footage of crop fields, examining patterns across multiple frames for comprehensive field assessment.'
  : 'Analyze crop field images for stress indicators using Louisiana-specific disease and deficiency patterns.'}

Respond ONLY in JSON format with precise observations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `${unifiedContext}

Analyze this ${cropType} field ${mediaType === 'video' ? 'drone video' : 'image'} from ${location || 'Morehouse Parish, Louisiana'}.

${mediaType === 'video' ? `**DRONE VIDEO ANALYSIS:**
Examine the footage across multiple frames to identify:
- Field-wide patterns of stress or disease
- Variations in crop health across different field zones
- Drainage or irrigation issues visible from aerial view
- Overall field uniformity and coverage
- Any concerning patterns that emerge over the video duration` : ''}


**CROP-SPECIFIC INDICATORS:**

${cropType.toLowerCase().includes('rice') ? `**RICE:** Look for:
- Leaf rolling (water stress)
- Yellowing (nitrogen deficiency)
- Brown diamond spots (blast disease)
- Sheath blight lesions` : ''}

${cropType.toLowerCase().includes('soybean') ? `**SOYBEAN:** Look for:
- Circular lesions (frogeye spot)
- Purple spots (cercospora leaf blight)
- Rust pustules on leaves
- Yellowing (nitrogen/potassium deficiency)` : ''}

${cropType.toLowerCase().includes('cotton') ? `**COTTON:** Look for:
- Wilting symptoms
- Yellowing lower leaves (nitrogen deficiency)
- Purple tint (phosphorus deficiency)
- Leaf spots or boll damage` : ''}

${cropType.toLowerCase().includes('corn') ? `**CORN:** Look for:
- V-shaped yellowing from tip (nitrogen deficiency)
- Leaf rolling (water stress)
- Rectangular lesions (gray leaf spot)
- Rust pustules or stalk rot` : ''}

**STRESS SCORING:**
- 0.0-0.3 = Severe stress (immediate action needed)
- 0.3-0.6 = Moderate stress (monitor closely)
- 0.6-1.0 = Healthy (routine management)

Respond with JSON:
{
  \"crop_type\": \"${cropType}\",
  \"stress_score\": <float 0.0-1.0>,
  \"condition\": \"Healthy\" | \"Mild Stress\" | \"Severe Stress\",
  \"visual_cues\": \"<specific symptoms observed>\",
  \"symptoms\": [<array of 3-5 specific observations>],
  \"health_score\": <float 0.0-1.0, inverse of stress>,
  \"confidence_score\": <float 0.0-1.0, your confidence in this assessment>,
  \"analysis_summary\": \"<plain-language insight for Louisiana farmer>\",
  \"growth_stage\": \"<specific growth stage: e.g., V6, R3, tillering, flowering, grain fill>\",
  \"disease_identified\": [<array of specific disease names if detected, empty if none>],
  \"pest_identified\": [<array of specific pest names if detected, empty if none>],
  \"nutrient_deficiencies\": {
    \"nitrogen\": {\"detected\": <boolean>, \"severity\": \"none\"|\"mild\"|\"moderate\"|\"severe\"},
    \"phosphorus\": {\"detected\": <boolean>, \"severity\": \"none\"|\"mild\"|\"moderate\"|\"severe\"},
    \"potassium\": {\"detected\": <boolean>, \"severity\": \"none\"|\"mild\"|\"moderate\"|\"severe\"},
    \"other\": [<array of other deficiencies with severity>]
  },
  \"severity_ratings\": {
    \"disease_pressure\": \"none\"|\"low\"|\"moderate\"|\"high\"|\"severe\",
    \"pest_pressure\": \"none\"|\"low\"|\"moderate\"|\"high\"|\"severe\",
    \"environmental_stress\": \"none\"|\"low\"|\"moderate\"|\"high\"|\"severe\",
    \"overall_severity\": \"none\"|\"low\"|\"moderate\"|\"high\"|\"severe\"
  },
  \"field_uniformity_score\": <float 0.0-1.0, 1.0 = perfectly uniform>,
  \"estimated_yield_impact_percent\": <float 0-100, estimated % yield loss or negative for gain>,
  \"canopy_coverage_percent\": <float 0-100, % ground covered by crop>,
  \"plant_density_assessment\": \"very_low\"|\"low\"|\"optimal\"|\"high\"|\"very_high\",
  \"root_health_indicators\": [<array of visible signs suggesting root health/issues>],
  \"detailed_visual_analysis\": \"<comprehensive 3-5 sentence analysis covering color patterns, leaf architecture, plant vigor, spatial distribution, and any anomalies>\"${unifiedContext ? `,
  \"historical_comparison\": {
    \"trend\": \"improving\"|\"stable\"|\"declining\",
    \"context\": \"<how current analysis compares to historical field data>\",
    \"pattern_insights\": \"<cross-referenced patterns from historical assessments>\"
  },
  \"context_enhanced_insights\": [\"<insight from unified context>\", \"<another insight>\"]` : ''}
}`
              },
              mediaType === 'video' 
                ? {
                    type: 'video_url',
                    video_url: { url: imageUrl }
                  }
                : {
                    type: 'image_url',
                    image_url: { url: imageUrl }
                  }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('Analysis AI error:', analysisResponse.status, errorText);
      
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (analysisResponse.status === 400 && errorText.includes('Failed to extract')) {
        return new Response(
          JSON.stringify({ error: 'Unsupported image format. Please use JPG, PNG, or WebP format.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const imageAnalysis = JSON.parse(analysisData.choices[0].message.content);
    console.log('Image analysis complete:', imageAnalysis);

    // STEP 3: Generate recommendations based on analysis + weather
    const recommendationsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an LSU AgCenter-aligned agricultural advisor for Morehouse Parish, Louisiana.

Generate actionable recommendations using LSU AgCenter best practices for Louisiana Delta farmers.

**DECISION RULES:**
1. If stress_score < 0.3 → Urgent action within 24-48 hours
2. Disease symptoms → Recommend specific fungicide/treatment
3. Nitrogen deficiency → Recommend 30-50 lbs N/acre
4. Precipitation < 0.5" AND temp > 90°F → Urgent irrigation
5. Precipitation > 2" in 7 days → Delay fertilizer (runoff risk)

Use clear, farmer-friendly language. Reference LSU AgCenter guidelines when applicable.

Respond ONLY in JSON format.`
          },
          {
            role: 'user',
            content: `Generate recommendations for this ${cropType} field in ${location || 'Morehouse Parish, Louisiana'}:

**FIELD ANALYSIS:**
- Stress Score: ${imageAnalysis.stress_score.toFixed(2)}/1.0
- Condition: ${imageAnalysis.condition}
- Visual Cues: ${imageAnalysis.visual_cues}
- Symptoms: ${imageAnalysis.symptoms?.join(', ')}
- Confidence: ${imageAnalysis.confidence_score.toFixed(2)}

${weatherData ? `**CURRENT WEATHER (Morehouse Parish, LA):**
- Current Temp: ${weatherData.temp_f}°F
- 7-Day Rainfall: ${weatherData.precipitation_7day.toFixed(2)} inches
- High: ${weatherData.temp_max}°F | Low: ${weatherData.temp_min}°F` : '**WEATHER:** Data unavailable'}

**TASK:**
Provide 1-3 specific, actionable recommendations. Prioritize based on stress severity and weather conditions.

Respond with JSON:
{
  \"recommendations\": [
    {
      \"text\": \"<specific actionable recommendation with quantities/timing>\",
      \"priority\": \"urgent\" | \"normal\" | \"low\",
      \"category\": \"irrigation\" | \"fertilization\" | \"pest_management\" | \"weather_alert\" | \"general\",
      \"reasoning\": \"<why this action is needed based on symptoms and weather>\"
    }
  ],
  \"weather_note\": \"<how current/forecast weather affects crop health and recommended timing>\",
  \"analysis_summary\": \"<2-3 sentence plain-language summary for farmer>\"
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!recommendationsResponse.ok) {
      console.error('Recommendations AI error:', recommendationsResponse.status);
      throw new Error('Failed to generate recommendations');
    }

    const recData = await recommendationsResponse.json();
    const recommendations = JSON.parse(recData.choices[0].message.content);
    console.log('Recommendations generated:', recommendations);

    // Normalize stress_level to match database constraint (lowercase, no spaces)
    const normalizeStressLevel = (condition: string): string => {
      const normalized = condition.toLowerCase().trim();
      if (normalized.includes('severe')) return 'severe';
      if (normalized.includes('mild') || normalized.includes('moderate')) return 'moderate';
      if (normalized.includes('healthy')) return 'healthy';
      return 'moderate'; // default fallback
    };

    // Combine both AI outputs
    const finalResult = {
      // From image analysis
      health_score: imageAnalysis.health_score,
      stress_level: normalizeStressLevel(imageAnalysis.condition),
      stress_score: imageAnalysis.stress_score,
      symptoms: imageAnalysis.symptoms,
      visual_cues: imageAnalysis.visual_cues,
      confidence_score: imageAnalysis.confidence_score,
      
      // Enhanced analytical fields
      growth_stage: imageAnalysis.growth_stage,
      disease_identified: imageAnalysis.disease_identified,
      pest_identified: imageAnalysis.pest_identified,
      nutrient_deficiencies: imageAnalysis.nutrient_deficiencies,
      severity_ratings: imageAnalysis.severity_ratings,
      field_uniformity_score: imageAnalysis.field_uniformity_score,
      estimated_yield_impact_percent: imageAnalysis.estimated_yield_impact_percent,
      canopy_coverage_percent: imageAnalysis.canopy_coverage_percent,
      plant_density_assessment: imageAnalysis.plant_density_assessment,
      root_health_indicators: imageAnalysis.root_health_indicators,
      detailed_visual_analysis: imageAnalysis.detailed_visual_analysis,
      
      // From recommendations
      recommendations: recommendations.recommendations,
      analysis_summary: recommendations.analysis_summary,
      weather_note: recommendations.weather_note,
      
      // Weather data
      weather_data: weatherData
    };

    return new Response(
      JSON.stringify(finalResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in analyze-crop function:', error);
    
    // Handle validation errors
    if (error.name === 'ZodError') {
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
    
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
