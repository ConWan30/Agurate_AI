import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, cropType, location } = await req.json();
    console.log('Analyzing crop image:', { imageUrl, cropType, location });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    // STEP 2: Analyze crop image
    const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `You are an expert agricultural AI for Louisiana Delta farmers, specializing in rice, soybean, cotton, and corn.

CONTEXT:
- Location: Morehouse Parish, Louisiana (subtropical climate, high disease pressure)
- Soils: Alluvial/claypan soils typical of Mississippi Delta
- Climate: Warm, humid with high rainfall

Analyze crop field images for stress indicators using Louisiana-specific disease and deficiency patterns.

Respond ONLY in JSON format with precise observations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${cropType} field image from ${location || 'Morehouse Parish, Louisiana'}.

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
  "crop_type": "${cropType}",
  "stress_score": <float 0.0-1.0>,
  "condition": "Healthy" | "Mild Stress" | "Severe Stress",
  "visual_cues": "<specific symptoms observed>",
  "symptoms": [<array of 3-5 specific observations>],
  "health_score": <float 0.0-1.0, inverse of stress>,
  "confidence_score": <float 0.0-1.0, your confidence in this assessment>,
  "analysis_summary": "<plain-language insight for Louisiana farmer>"
}`
              },
              {
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
  "recommendations": [
    {
      "text": "<specific actionable recommendation with quantities/timing>",
      "priority": "urgent" | "normal" | "low",
      "category": "irrigation" | "fertilization" | "pest_management" | "weather_alert" | "general",
      "reasoning": "<why this action is needed based on symptoms and weather>"
    }
  ],
  "weather_note": "<how current/forecast weather affects crop health and recommended timing>",
  "analysis_summary": "<2-3 sentence plain-language summary for farmer>"
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
    return new Response(
      JSON.stringify({ error: error.message || 'Analysis failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
