/**
 * Unified AI Intelligence System
 * Gathers context from all AI systems to enhance analysis accuracy
 */

import { supabase } from '@/integrations/supabase/client';

export interface UnifiedContext {
  fieldData: any;
  assessmentHistory: any[];
  conservationData: any[];
  varietyData: any[];
  weatherData: any;
  communityData: any[];
  waterStressData: any[];
  predictiveData: any[];
  intelligencePool: any;
}

/**
 * Gathers unified context from all AI systems for a field
 */
export async function gatherUnifiedContext(fieldId: string): Promise<UnifiedContext> {
  try {
    // Parallel data fetching from all systems
    const [
      { data: fieldData },
      { data: assessmentHistory },
      { data: conservationData },
      { data: varietyData },
      { data: communityDataRaw },
      { data: waterStressData },
      { data: predictiveData },
      { data: intelligencePoolRaw }
    ] = await Promise.all([
      supabase.from('fields').select('*').eq('id', fieldId).single(),
      supabase.from('assessments').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(10),
      supabase.from('conservation_predictions').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
      supabase.from('variety_performance_metrics').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
      supabase.from('community_insights').select('*').limit(20),
      supabase.from('water_stress_events').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(5),
      supabase.from('predictive_models').select('*').eq('field_id', fieldId).order('created_at', { ascending: false }).limit(3),
      supabase.from('ai_intelligence_pool').select('*').eq('field_id', fieldId).order('snapshot_date', { ascending: false }).limit(1)
    ]);

    // Get weather data (simulated for now)
    const weatherData = {
      current_temp: 85,
      humidity: 75,
      precipitation_forecast: [0.1, 0.2, 0, 0.3, 0.5, 0.1, 0],
      days_since_rain: 3
    };

    return {
      fieldData: fieldData || {},
      assessmentHistory: assessmentHistory || [],
      conservationData: conservationData || [],
      varietyData: varietyData || [],
      weatherData,
      communityData: communityDataRaw || [],
      waterStressData: waterStressData || [],
      predictiveData: predictiveData || [],
      intelligencePool: intelligencePoolRaw?.[0] || {}
    };
  } catch (error) {
    console.error('Error gathering unified context:', error);
    return {
      fieldData: {},
      assessmentHistory: [],
      conservationData: [],
      varietyData: [],
      weatherData: {},
      communityData: [],
      waterStressData: [],
      predictiveData: [],
      intelligencePool: {}
    };
  }
}

/**
 * Enriches unified context after new analysis
 */
export async function enrichUnifiedContext(fieldId: string, analysisData: any) {
  try {
    const patterns = {
      image_analysis_patterns: {
        symptom_progression: analysisData.visionAnalysis?.symptoms || [],
        health_score_trend: [analysisData.visionAnalysis?.health_score || 0],
        visual_patterns: analysisData.visionAnalysis?.visual_patterns || []
      },
      variety_intelligence: {
        disease_signatures: analysisData.variety?.disease_signatures || {},
        stress_tolerances: analysisData.variety?.stress_tolerances || {},
        performance_patterns: analysisData.variety?.performance || {}
      },
      conservation_effectiveness: {
        soil_health_trend: analysisData.conservation?.soil_health_indicator || 0,
        practice_impacts: analysisData.conservation?.practice_impacts || {},
        visual_improvements: analysisData.conservation?.improvements || []
      },
      weather_correlations: {
        symptom_weather_patterns: analysisData.weatherCorrelation?.patterns || [],
        stress_triggers: analysisData.waterStress?.triggers || [],
        optimal_conditions: analysisData.weatherCorrelation?.optimal || {}
      },
      community_patterns: {
        similar_field_outcomes: analysisData.community?.similar_fields || [],
        trending_issues: analysisData.community?.trending || [],
        successful_interventions: analysisData.community?.successes || []
      },
      predictive_insights: {
        yield_trajectory: analysisData.predictions?.yield || {},
        disease_risk_timeline: analysisData.predictions?.disease_risk || [],
        intervention_windows: analysisData.predictions?.windows || []
      },
      confidence_scores: {
        vision_analysis: analysisData.visionAnalysis?.confidence_score || 0,
        water_stress: analysisData.waterStress?.confidence || 0,
        variety_match: analysisData.variety?.confidence || 0,
        community_alignment: analysisData.community?.confidence || 0
      }
    };

    await supabase.from('ai_intelligence_pool').insert({
      field_id: fieldId,
      ...patterns
    });

    return true;
  } catch (error) {
    console.error('Error enriching unified context:', error);
    return false;
  }
}

/**
 * Formats unified context for AI prompt
 */
export function formatContextForAI(context: UnifiedContext): string {
  const {
    fieldData,
    assessmentHistory,
    conservationData,
    varietyData,
    weatherData,
    waterStressData,
    intelligencePool
  } = context;

  return `
UNIFIED FIELD INTELLIGENCE CONTEXT:

FIELD INFORMATION:
- Crop Type: ${fieldData.crop_type || 'Unknown'}
- Variety: ${fieldData.rice_variety || fieldData.soybean_variety || fieldData.cotton_variety || fieldData.corn_hybrid || 'Not specified'}
- Acreage: ${fieldData.acreage || 'Unknown'} acres
- Location: ${fieldData.location_lat || 'N/A'}, ${fieldData.location_lng || 'N/A'}

HISTORICAL ASSESSMENT TRENDS (Last 10):
${assessmentHistory.map(a => `- ${new Date(a.analyzed_at).toLocaleDateString()}: Health ${a.health_score}%, Stress Level: ${a.stress_level}, Symptoms: ${a.symptoms?.join(', ') || 'None'}`).join('\n') || '- No historical data'}

CONSERVATION PRACTICES:
${conservationData.length > 0 ? conservationData.map(c => `- ${c.practice_type}: Current Impact ${c.current_impact}, Confidence ${c.confidence_score}`).join('\n') : '- No conservation data available'}

VARIETY PERFORMANCE HISTORY:
${varietyData.length > 0 ? varietyData.map(v => `- ${v.variety_name}: Performance ${v.performance_score}, Disease Resistance ${v.disease_resistance}`).join('\n') : '- No variety data available'}

CURRENT WEATHER CONDITIONS:
- Temperature: ${weatherData.current_temp}°F
- Humidity: ${weatherData.humidity}%
- Days Since Rain: ${weatherData.days_since_rain}
- Precipitation Forecast (7-day): ${weatherData.precipitation_forecast?.join(', ') || 'N/A'} inches

WATER STRESS HISTORY:
${waterStressData.length > 0 ? waterStressData.map(w => `- ${new Date(w.created_at).toLocaleDateString()}: Stress Score ${w.stress_score}, Severity: ${w.severity}`).join('\n') : '- No water stress events recorded'}

AI INTELLIGENCE POOL INSIGHTS:
- Historical Pattern Confidence: ${intelligencePool.confidence_scores?.vision_analysis || 'N/A'}
- Community Pattern Alignment: ${intelligencePool.confidence_scores?.community_alignment || 'N/A'}
${intelligencePool.image_analysis_patterns?.symptom_progression ? `- Symptom Progression Detected: ${JSON.stringify(intelligencePool.image_analysis_patterns.symptom_progression)}` : ''}

CRITICAL: Use all above context to enhance analysis accuracy. Cross-reference current observations with historical patterns, variety-specific traits, conservation impacts, and weather correlations.
`;
}
