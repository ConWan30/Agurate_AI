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

    // STEP 1: Fetch current weather data for Louisiana
    let weatherData = null;
    try {
      // Using Open-Meteo API for Louisiana (approximate center coordinates)
      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=31.0&longitude=-92.0&current=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&forecast_days=3'
      );
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        weatherData = {
          temp_f: weather.current.temperature_2m,
          precipitation_inch: weather.current.precipitation,
          humidity: weather.current.relative_humidity_2m,
          wind_speed: weather.current.wind_speed_10m
        };
        console.log('Weather data fetched:', weatherData);
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
            content: `You are an agricultural AI assistant analyzing crop health from field images.

Given an image of a crop field, analyze for visible signs of plant stress such as discoloration, dryness, leaf damage, or patchy growth. Rate stress severity on a scale from 0.0 (no stress) to 1.0 (severe stress).

Respond ONLY in JSON format.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${cropType} field image. Respond with JSON:
{
  "crop_type": "${cropType}",
  "stress_score": <float 0.0-1.0>,
  "condition": "Healthy" | "Mild Stress" | "Severe Stress",
  "visual_cues": "<brief description of what you see>",
  "symptoms": [<array of 3-5 specific observations>],
  "health_score": <float 0.0-1.0, inverse of stress>,
  "confidence_score": <float 0.0-1.0>
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
            content: `You are an agronomic advisor generating field recommendations for Louisiana Delta farmers.

Given crop analysis and weather data, provide actionable recommendations. Focus on irrigation, pest management, or nutrient correction as appropriate. Make it practical and Louisiana-specific.

Respond ONLY in JSON format.`
          },
          {
            role: 'user',
            content: `Generate recommendations for this ${cropType} field:

Analysis Results:
- Stress Score: ${imageAnalysis.stress_score}
- Condition: ${imageAnalysis.condition}
- Visual Cues: ${imageAnalysis.visual_cues}
- Symptoms: ${imageAnalysis.symptoms?.join(', ')}

${weatherData ? `Current Weather (Louisiana):
- Temperature: ${weatherData.temp_f}°F
- Precipitation: ${weatherData.precipitation_inch}" 
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.wind_speed} mph` : 'Weather data unavailable'}

Location: ${location || 'Louisiana Delta region'}

Respond with JSON:
{
  "recommendations": [
    {
      "text": "<actionable recommendation>",
      "priority": "high" | "normal" | "low",
      "category": "irrigation" | "fertilization" | "pest_control" | "disease_management" | "general",
      "reasoning": "<why this is recommended>"
    }
  ],
  "weather_note": "<how weather affects crop health>",
  "analysis_summary": "<plain-language insight for farmer>"
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

    // Combine both AI outputs
    const finalResult = {
      // From image analysis
      health_score: imageAnalysis.health_score,
      stress_level: imageAnalysis.condition,
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
