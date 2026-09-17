import { fetchAI, getAIKey } from '../_shared/ai.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { requireAuthenticatedUser, getAnonClient, getServiceClient } from '../_shared/auth.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

// Input validation schema
const analyzeCropSchema = z
  .object({
    imageUrl: z.string().url().max(2048),
    cropType: z.enum(['rice', 'soybean', 'cotton', 'corn']).optional(),
    fieldId: z.string().uuid().optional(),
    location: z.string().max(200).optional(),
    mediaType: z.enum(['image', 'video']).default('image'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    /** Durable storage object path (not a signed URL). When set with fieldId, edge persists the assessment. */
    storagePath: z
      .string()
      .min(1)
      .max(1024)
      .regex(/^[a-zA-Z0-9/_.\-]+$/)
      .refine((p) => !p.includes('://'), { message: 'storagePath must be a storage object path' })
      .optional(),
    photoLocationLat: z.number().min(-90).max(90).optional(),
    photoLocationLng: z.number().min(-180).max(180).optional(),
    gpsAccuracyMeters: z.number().min(0).max(100_000).optional(),
    capturedOffline: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.storagePath && !data.fieldId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fieldId is required when storagePath is provided',
        path: ['fieldId'],
      });
    }
  });

// Validate image URL has proper file extension
function validateImageUrl(url: string, mediaType: string): boolean {
  if (mediaType === 'image') {
    const imagePattern = /\.(jpg|jpeg|png|webp|gif|bmp|tiff)(\?.*)?$/i;
    return imagePattern.test(url);
  } else if (mediaType === 'video') {
    const videoPattern = /\.(mp4|mov|avi|webm)(\?.*)?$/i;
    return videoPattern.test(url);
  }
  return false;
}


/** Canonical assessment scores are 0–100 (DB check). AI often returns 0–1. */
function toHealthPercent(score: number | null | undefined): number {
  if (score == null || Number.isNaN(Number(score))) return 0;
  const n = Number(score);
  if (n < 0) return 0;
  if (n <= 1) return Math.round(n * 1000) / 10;
  return Math.min(100, Math.round(n * 10) / 10);
}

function hasHealthScore(score: unknown): score is number {
  return score != null && !Number.isNaN(Number(score));
}

function requireHealthScore(score: unknown, label = 'health_score'): number {
  if (!hasHealthScore(score)) {
    throw new Error(`AI analysis omitted ${label}`);
  }
  return toHealthPercent(Number(score));
}

function formatHealthForPrompt(score: unknown): string {
  if (!hasHealthScore(score)) return 'not recorded';
  return `${toHealthPercent(Number(score))}%`;
}

/** field_uniformity_score is stored 0–1; AI may emit 0–100. Reject invent outside range. */
function toUniformityFraction(score: unknown): number | null {
  if (!hasHealthScore(score)) return null;
  const n = Number(score);
  if (n < 0) return null;
  if (n <= 1) return Math.round(n * 1000) / 1000;
  if (n <= 100) return Math.round(n * 10) / 1000;
  return null;
}

/** Yield/canopy percents are 0–100. Reject invent outside range (do not clamp). */
function toPercentScore(score: unknown): number | null {
  if (!hasHealthScore(score)) return null;
  const n = Number(score);
  if (n < 0 || n > 100) return null;
  return Math.round(n * 10) / 10;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabaseAuth = getAnonClient(authHeader);

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

    const {
      imageUrl,
      fieldId,
      location,
      mediaType,
      latitude,
      longitude,
      storagePath,
      photoLocationLat,
      photoLocationLng,
      gpsAccuracyMeters,
      capturedOffline,
    } = validation.data;
    let cropType = validation.data.cropType;
    
    // Validate image/video file format
    if (!validateImageUrl(imageUrl, mediaType)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid file format',
          details: mediaType === 'image' 
            ? 'Only JPG, JPEG, PNG, WebP, GIF, BMP, and TIFF images are supported'
            : 'Only MP4, MOV, AVI, and WebM videos are supported'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    

    // When fieldId is present, field.crop_type + field coords are authoritative — never trust client invent.
    let resolvedCropType = cropType ?? null;
    let ownedFieldLat: number | null = null;
    let ownedFieldLng: number | null = null;
    if (fieldId) {
      const { data: ownedField, error: cropFieldError } = await supabaseAuth
        .from('fields')
        .select('user_id, crop_type, location_lat, location_lng')
        .eq('id', fieldId)
        .maybeSingle();

      if (cropFieldError || !ownedField) {
        return new Response(JSON.stringify({ error: 'Field not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (ownedField.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const fieldCrop = typeof ownedField.crop_type === 'string'
        ? (ownedField.crop_type.toLowerCase() === 'soybeans' ? 'soybean' : ownedField.crop_type.toLowerCase())
        : null;
      if (!fieldCrop || !['rice', 'soybean', 'cotton', 'corn'].includes(fieldCrop)) {
        return new Response(JSON.stringify({ error: 'Field crop_type is missing or unsupported' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      resolvedCropType = fieldCrop as 'rice' | 'soybean' | 'cotton' | 'corn';
      if (ownedField.location_lat != null && Number.isFinite(Number(ownedField.location_lat))) {
        ownedFieldLat = Number(ownedField.location_lat);
      }
      if (ownedField.location_lng != null && Number.isFinite(Number(ownedField.location_lng))) {
        ownedFieldLng = Number(ownedField.location_lng);
      }
    }
    if (!resolvedCropType) {
      return new Response(JSON.stringify({ error: 'cropType is required when fieldId is not provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    cropType = resolvedCropType;


    console.log('Analyzing crop media with unified context:', { imageUrl, cropType, fieldId, location, mediaType });


    const rateLimit = await enforceRateLimit(supabaseAuth, user.id, {
      functionName: 'analyze-crop',
      maxRequests: RATE_LIMITS['analyze-crop'].maxRequests,
      windowMs: RATE_LIMITS['analyze-crop'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before analyzing more images.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const AI_API_KEY = getAIKey();
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY not configured');
    }

    // STEP 0: Gather unified context if fieldId provided (use service role after auth check)
    let unifiedContext = '';
    if (fieldId) {
      const supabase = getServiceClient();

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
UNIFIED FIELD INTELLIGENCE (recorded history only — do not invent missing values)
═══════════════════════════════════════════════════════════════

FIELD PROFILE:
- Variety: ${fieldData?.rice_variety || fieldData?.soybean_variety || fieldData?.cotton_variety || fieldData?.corn_hybrid || 'Unknown'}
- Acreage: ${fieldData?.acreage != null && Number.isFinite(Number(fieldData.acreage)) ? `${fieldData.acreage} acres` : 'not recorded'}
- Soil Type: ${fieldData?.soil_type || 'Not specified'}

HISTORICAL HEALTH TREND (Last 5 Assessments):
${assessmentHistory && assessmentHistory.length > 0 
  ? assessmentHistory.map((a: any, i: number) => 
      `${i + 1}. ${new Date(a.analyzed_at).toLocaleDateString()}: Health ${formatHealthForPrompt(a.health_score)}, Stress: ${a.stress_level ?? 'not recorded'}${a.symptoms?.length > 0 ? `, Symptoms: ${a.symptoms.join(', ')}` : ''}`
    ).join('\n') 
  : '- No historical data available (first assessment)'}

ACTIVE CONSERVATION PRACTICES:
${conservationData && conservationData.length > 0 
  ? conservationData.map((c: any) => {
      const impact = Number(c.current_impact);
      const confidence = Number(c.confidence_score);
      // current_impact is already a 0–100 planning index; confidence_score is 0–1
      const impactLabel = Number.isFinite(impact) ? `${impact.toFixed(0)}/100 planning index` : 'not recorded';
      const confidenceLabel = Number.isFinite(confidence)
        ? `${(confidence <= 1 ? confidence * 100 : confidence).toFixed(0)}%`
        : 'not recorded';
      return `- ${c.practice_type}: Current Impact ${impactLabel}, Confidence ${confidenceLabel}`;
    }).join('\n')
  : '- No conservation practices recorded'}

VARIETY PERFORMANCE (recorded metrics only):
${varietyData && varietyData.length > 0
  ? varietyData.map((v: any) => {
      const perf = v.performance_score != null && Number.isFinite(Number(v.performance_score))
        ? `${(Number(v.performance_score) <= 1 ? Number(v.performance_score) * 100 : Number(v.performance_score)).toFixed(0)}%`
        : 'not recorded';
      const resist = v.disease_resistance != null && Number.isFinite(Number(v.disease_resistance))
        ? `${(Number(v.disease_resistance) <= 1 ? Number(v.disease_resistance) * 100 : Number(v.disease_resistance)).toFixed(0)}%`
        : 'not recorded';
      return `- ${v.variety_name}: Performance ${perf}, Disease Resistance ${resist}`;
    }).join('\n')
  : '- No variety performance data available'}

RECENT WATER STRESS EVENTS (Last 30 days):
${waterStressData && waterStressData.length > 0
  ? waterStressData.map((w: any) => {
      const stress = w.stress_score != null && Number.isFinite(Number(w.stress_score))
        ? `${(Number(w.stress_score) <= 1 ? Number(w.stress_score) * 100 : Number(w.stress_score)).toFixed(0)}%`
        : 'not recorded';
      return `- ${new Date(w.created_at).toLocaleDateString()}: Stress Score ${stress}, Severity: ${w.severity ?? 'not recorded'}`;
    }).join('\n')
  : '- No water stress events recorded'}

ANALYSIS DIRECTIVE:
Prefer the current media as ground truth. Use recorded history only when it clearly supports a visible finding:
1. Note progression only when prior assessments exist and symptoms visibly align
2. Do not invent worsening/improving trends from missing history
3. Mention variety vulnerabilities only when listed above and visually relevant
4. Do not invent conservation or water-stress effects that are not recorded
5. Keep recommendations tied to visible evidence and cited public guidance

═══════════════════════════════════════════════════════════════
`;
      console.log('Unified context gathered for field:', fieldId);
    }

    // STEP 1: Fetch weather from owned field coords when fieldId is set — ignore client lat/lng invent.
    // Client lat/lng may still be stored as photo_location_* metadata only.
    let weatherData = null;
    let weatherLat: number | null = null;
    let weatherLng: number | null = null;
    if (fieldId) {
      weatherLat = ownedFieldLat;
      weatherLng = ownedFieldLng;
    } else {
      weatherLat = latitude ?? null;
      weatherLng = longitude ?? null;
    }
    try {
      if (weatherLat != null && weatherLng != null) {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${weatherLat}&longitude=${weatherLng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&forecast_days=7&timezone=America/Chicago`
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
          console.log('Weather data fetched for field coordinates:', weatherLat, weatherLng, weatherData);
        }
      } else {
        console.log('Skipping weather fetch — no field/photo coordinates available');
      }
    } catch (err) {
      console.warn('Weather fetch failed, continuing without it:', err);
    }

    // STEP 2: Analyze crop media (image or video)
    // Use gemini-2.5-pro for video analysis
    const model = mediaType === 'video' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';
    
    const analysisResponse = await fetchAI({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an expert agricultural AI for Louisiana Delta farmers with access to comprehensive field intelligence history.

CONTEXT:
- Region: Louisiana Delta (subtropical climate, high disease pressure); use provided coordinates/location when present — do not invent a parish
- Soils: Alluvial/claypan soils typical of Mississippi Delta
- Climate: Warm, humid with high rainfall

${unifiedContext ? 'You have unified field intelligence history. Use it only as supporting context — never invent scores, diseases, or yield impact not visible in the current media.' : ''}

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

Analyze this ${cropType} field ${mediaType === 'video' ? 'drone video' : 'image'}${location ? ` from ${location}` : ' (location not provided — do not invent a parish)'}.

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

**STRESS SCORING (estimate from visible evidence only — use null/omit fields you cannot support):**
- 0.0-0.3 = Severe stress when clear visual evidence warrants it
- 0.3-0.6 = Moderate stress when symptoms are present but limited
- 0.6-1.0 = Healthy when the crop appears vigorous with no clear stress cues
- If the image is unclear or not a crop, keep confidence low and say so in visual_cues — do not invent disease names or yield %

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
  \"estimated_yield_impact_percent\": <float 0-100 estimated % yield loss, OR null when not visually estimable — never invent>,
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
    const recommendationsResponse = await fetchAI({
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an agricultural advisor for Louisiana Delta farmers. Cite publicly available LSU AgCenter publications when relevant. AgurateAI is not an official LSU partner and does not claim LSU validation. Use the provided field location when present; if location is unknown, do not invent a parish.

Generate actionable recommendations informed by publicly available LSU AgCenter guidance for Louisiana Delta farmers.

**PUBLIC LSU AGCENTER RESEARCH REFERENCES (cite published ranges when applicable; not farm-specific guarantees or an official partnership):**
- Fertilizer: LSU AgCenter Publication Pub. 2945, "Fertilizer Recommendations for Field Crops in Louisiana: N-P-K-S" (2024)
  - Rice: cite Pub. 2945 published N guidance only — do not invent farm-specific lbs N/acre; ask for farmer-recorded rates before asserting any rate
  - Soybeans: Minimal N (legume fixation), focus on K and P
- Rice Disease: LSU AgCenter Rice Research Station, "Rice Varieties and Management Tips 2025" (2024)
  - Blast-resistant varieties may reduce fungicide needs in published trial contexts — do not assert a farm-specific % without visible evidence
  - Source: https://www.lsuagcenter.com/profiles/astrahan/articles/page1701362113346
- Water Management: LSU Rice Research Station, "Water Management for Louisiana Rice Production" (2024)
  - Published guidance discusses yield risk from water stress in reproductive stages — cite ranges only when relevant; do not invent farm loss %
- Soybean Disease: LSU AgCenter Plant Pathology, "Louisiana Plant Disease Management Guide - Soybeans" (2024)
  - Frogeye-resistant varieties are often described as cost-effective control options in published guidance

**DECISION RULES (planning aid — cite pub ranges; do not invent farm-specific rates):**
1. If stress_score indicates elevated stress → Flag for urgent farmer review within 24-48 hours
2. Disease symptoms → Suggest treatment categories + cite LSU research framing
3. Nitrogen deficiency → Reference Pub. 2945 qualitatively; ask for farmer-recorded rates before asserting lbs/acre
4. Hot/dry conditions without recorded precip → Flag irrigation review (cite LSU water management)
5. Heavy recent precip → Flag fertilizer timing/runoff risk per LSU guidelines

Use clear, farmer-friendly language. Cite specific public LSU AgCenter publications when applicable. Never claim an official LSU partnership or validation. Never invent farm-specific yield %, dollar savings, or prescription rates without visible evidence or farmer inputs.

Respond ONLY in JSON format.`
          },
          {
            role: 'user',
            content: `Generate recommendations for this ${cropType} field${location ? ` in ${location}` : ' (location unknown — do not invent a parish)'}:

**FIELD ANALYSIS:**
- Stress Score: ${imageAnalysis.stress_score != null && Number.isFinite(Number(imageAnalysis.stress_score)) ? Number(imageAnalysis.stress_score).toFixed(2) : 'not recorded'}/1.0
- Condition: ${imageAnalysis.condition ?? 'not recorded'}
- Visual Cues: ${imageAnalysis.visual_cues ?? 'not recorded'}
- Symptoms: ${Array.isArray(imageAnalysis.symptoms) ? imageAnalysis.symptoms.join(', ') : 'not recorded'}
- Confidence: ${imageAnalysis.confidence_score != null && Number.isFinite(Number(imageAnalysis.confidence_score)) ? Number(imageAnalysis.confidence_score).toFixed(2) : 'not recorded'}

${weatherData ? `**CURRENT WEATHER (at field coordinates):**
- Current Temp: ${weatherData.temp_f != null && Number.isFinite(Number(weatherData.temp_f)) ? weatherData.temp_f : 'not recorded'}°F
- 7-Day Rainfall: ${weatherData.precipitation_7day != null && Number.isFinite(Number(weatherData.precipitation_7day)) ? Number(weatherData.precipitation_7day).toFixed(2) : 'not recorded'} inches
- High: ${weatherData.temp_max != null && Number.isFinite(Number(weatherData.temp_max)) ? weatherData.temp_max : 'not recorded'}°F | Low: ${weatherData.temp_min != null && Number.isFinite(Number(weatherData.temp_min)) ? weatherData.temp_min : 'not recorded'}°F` : '**WEATHER:** Data unavailable'}

**TASK:**
Provide 1-3 specific, actionable recommendations. Prioritize based on stress severity and weather conditions.

Respond with JSON:
{
  \"recommendations\": [
    {
      \"text\": \"<actionable recommendation citing public LSU ranges or asking for farmer-recorded rates — never invent farm-specific oz/acre or lbs/acre>\",
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
      throw new Error(`Unrecognized stress condition from AI: ${condition}`);
    };

    // Combine both AI outputs — fail closed if health_score is missing (do not invent 0%)
    const healthScore = requireHealthScore(imageAnalysis.health_score);
    const stressLevel = normalizeStressLevel(imageAnalysis.condition);
    const confidenceScore =
      imageAnalysis.confidence_score == null || Number.isNaN(Number(imageAnalysis.confidence_score))
        ? null
        : toHealthPercent(imageAnalysis.confidence_score);
    const symptoms = Array.isArray(imageAnalysis.symptoms) ? imageAnalysis.symptoms : [];
    const recommendationList = Array.isArray(recommendations.recommendations)
      ? recommendations.recommendations
      : [];

    const finalResult: Record<string, unknown> = {
      // From image analysis
      health_score: healthScore,
      stress_level: stressLevel,
      stress_score: imageAnalysis.stress_score,
      symptoms,
      visual_cues: imageAnalysis.visual_cues,
      confidence_score: confidenceScore,
      
      // Enhanced analytical fields
      growth_stage: imageAnalysis.growth_stage,
      disease_identified: imageAnalysis.disease_identified,
      pest_identified: imageAnalysis.pest_identified,
      nutrient_deficiencies: imageAnalysis.nutrient_deficiencies,
      severity_ratings: imageAnalysis.severity_ratings,
      field_uniformity_score: toUniformityFraction(imageAnalysis.field_uniformity_score),
      estimated_yield_impact_percent: toPercentScore(imageAnalysis.estimated_yield_impact_percent),
      canopy_coverage_percent: toPercentScore(imageAnalysis.canopy_coverage_percent),
      plant_density_assessment: imageAnalysis.plant_density_assessment,
      root_health_indicators: imageAnalysis.root_health_indicators,
      detailed_visual_analysis: imageAnalysis.detailed_visual_analysis,
      
      // From recommendations
      recommendations: recommendationList,
      analysis_summary: recommendations.analysis_summary,
      weather_note: recommendations.weather_note,
      
      // Weather data
      weather_data: weatherData
    };

    // Persist scored assessment server-side (clients cannot write health_score via RLS)
    if (fieldId && storagePath) {
      const admin = getServiceClient();
      const weatherTemp =
        weatherData?.temp_f != null && Number.isFinite(Number(weatherData.temp_f))
          ? Number(weatherData.temp_f)
          : null;
      const weatherPrecipMm =
        weatherData?.precipitation_7day != null && Number.isFinite(Number(weatherData.precipitation_7day))
          ? Number(weatherData.precipitation_7day) * 25.4
          : null;

      const { data: assessment, error: assessmentError } = await admin
        .from('assessments')
        .insert({
          field_id: fieldId,
          image_url: storagePath,
          health_score: healthScore,
          stress_level: stressLevel,
          symptoms,
          confidence_score: confidenceScore,
          weather_temp_f: weatherTemp,
          weather_precipitation_mm: weatherPrecipMm,
          growth_stage: imageAnalysis.growth_stage ?? null,
          disease_identified: imageAnalysis.disease_identified ?? null,
          pest_identified: imageAnalysis.pest_identified ?? null,
          nutrient_deficiencies: imageAnalysis.nutrient_deficiencies ?? null,
          severity_ratings: imageAnalysis.severity_ratings ?? null,
          field_uniformity_score: toUniformityFraction(imageAnalysis.field_uniformity_score),
          estimated_yield_impact_percent: toPercentScore(imageAnalysis.estimated_yield_impact_percent),
          canopy_coverage_percent: toPercentScore(imageAnalysis.canopy_coverage_percent),
          plant_density_assessment: imageAnalysis.plant_density_assessment ?? null,
          root_health_indicators: imageAnalysis.root_health_indicators ?? null,
          detailed_visual_analysis: imageAnalysis.detailed_visual_analysis ?? null,
          photo_location_lat: photoLocationLat ?? latitude ?? null,
          photo_location_lng: photoLocationLng ?? longitude ?? null,
          gps_accuracy_meters: gpsAccuracyMeters ?? null,
          captured_offline: capturedOffline ?? false,
        })
        .select('id')
        .single();

      if (assessmentError || !assessment?.id) {
        console.error('Failed to persist assessment:', assessmentError);
        throw new Error('Failed to save assessment');
      }

      if (recommendationList.length > 0) {
        const rows = recommendationList
          .filter((rec: { text?: unknown }) => typeof rec?.text === 'string' && rec.text.trim().length > 0)
          .map((rec: { text: string; priority?: string; category?: string }) => ({
            assessment_id: assessment.id,
            recommendation_text: rec.text,
            priority: ['urgent', 'normal', 'low'].includes(rec.priority ?? '') ? rec.priority : 'normal',
            category: ['irrigation', 'fertilization', 'pest_management', 'weather_alert', 'general'].includes(
              rec.category ?? ''
            )
              ? rec.category
              : 'general',
          }));

        if (rows.length > 0) {
          const { error: recError } = await admin.from('recommendations').insert(rows);
          if (recError) {
            console.error('Failed to persist recommendations:', recError);
            throw new Error('Failed to save recommendations');
          }
        }
      }

      finalResult.assessment_id = assessment.id;
    }

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
