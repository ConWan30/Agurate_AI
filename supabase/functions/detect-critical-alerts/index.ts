import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { corsHeaders, handleAuthError, handleError } from '../_shared/errorHandler.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';

interface CriticalAlertInput {
  assessment_id: string;
  field_id: string;
  health_score: number;
  stress_level: string;
  diseases?: Array<{ name: string; severity: string; confidence: number }>;
  pests?: Array<{ name: string; severity: string; confidence: number }>;
  estimated_yield_impact_percent?: number;
  field_acreage?: number;
  crop_type?: string;
}

interface UrgencyFactors {
  healthScore: number;
  stressLevel: string;
  diseaseSeverity: number;
  pestSeverity: number;
  yieldImpact: number;
  fieldSize: number;
  cropValue: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return handleAuthError(corsHeaders);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return handleAuthError(corsHeaders);
    }

    // Rate limiting: 20 detections per minute
    const rateLimitResponse = await checkRateLimit(req, supabaseClient, {
      functionName: 'detect-critical-alerts',
      limit: 20,
    }, corsHeaders);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { assessment_id, field_id, health_score, stress_level, diseases, pests, estimated_yield_impact_percent, field_acreage, crop_type }: CriticalAlertInput = await req.json();

    // Calculate urgency score
    const urgencyScore = calculateUrgencyScore({
      healthScore: health_score,
      stressLevel: stress_level,
      diseaseSeverity: diseases?.reduce((max, d) => {
        const severity = d.severity === 'severe' ? 3 : d.severity === 'moderate' ? 2 : 1;
        return Math.max(max, severity * d.confidence);
      }, 0) || 0,
      pestSeverity: pests?.reduce((max, p) => {
        const severity = p.severity === 'severe' ? 3 : p.severity === 'moderate' ? 2 : 1;
        return Math.max(max, severity * p.confidence);
      }, 0) || 0,
      yieldImpact: estimated_yield_impact_percent || 0,
      fieldSize: field_acreage || 100,
      cropValue: getCropValuePerAcre(crop_type || 'rice'),
    });

    // Only create alert if urgency is high enough (>= 60)
    if (urgencyScore < 60) {
      return new Response(
        JSON.stringify({ 
          alert_created: false, 
          urgency_score: urgencyScore,
          message: 'Alert urgency below threshold' 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Determine alert type and message
    const alertType = determineAlertType(diseases, pests, stress_level);
    const { title, message, estimatedLoss } = generateAlertContent({
      alertType,
      fieldName: 'Field', // Will be fetched if needed
      cropType: crop_type || 'crop',
      diseases,
      pests,
      yieldImpact: estimated_yield_impact_percent || 0,
      acreage: field_acreage || 100,
      cropValue: getCropValuePerAcre(crop_type || 'rice'),
    });

    // Create critical alert record
    const { data: alert, error: alertError } = await supabaseClient
      .from('critical_alerts')
      .insert({
        user_id: user.id,
        field_id,
        assessment_id,
        alert_type: alertType,
        severity: urgencyScore >= 80 ? 'critical' : urgencyScore >= 70 ? 'high' : 'medium',
        title,
        message,
        estimated_loss_usd: estimatedLoss,
        urgency_score: urgencyScore,
        in_app_notification_sent: true,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
      })
      .select()
      .single();

    if (alertError) {
      throw alertError;
    }

    // For critical alerts (urgency >= 80), trigger SMS escalation
    // Note: SMS/voice integration would go here (Twilio, etc.)
    // For now, we'll just mark it for escalation
    if (urgencyScore >= 80) {
      console.log(`[CRITICAL ALERT] Alert ${alert.id} requires SMS escalation`);
      // In production: await sendSMS(user.phone, generateSMSMessage(alert));
    }

    return new Response(
      JSON.stringify({ 
        alert_created: true,
        alert_id: alert.id,
        urgency_score: urgencyScore,
        requires_escalation: urgencyScore >= 80,
        message: 'Critical alert created successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return handleError(error, 'detect-critical-alerts', corsHeaders);
  }
});

function calculateUrgencyScore(factors: UrgencyFactors): number {
  let score = 0;

  // Health score (0-40 points)
  if (factors.healthScore < 50) score += 40;
  else if (factors.healthScore < 65) score += 25;
  else if (factors.healthScore < 75) score += 10;

  // Stress level (0-20 points)
  if (factors.stressLevel === 'severe') score += 20;
  else if (factors.stressLevel === 'moderate') score += 10;

  // Disease severity (0-15 points)
  score += Math.min(factors.diseaseSeverity * 5, 15);

  // Pest severity (0-10 points)
  score += Math.min(factors.pestSeverity * 3, 10);

  // Yield impact (0-10 points)
  if (factors.yieldImpact > 30) score += 10;
  else if (factors.yieldImpact > 20) score += 7;
  else if (factors.yieldImpact > 10) score += 4;

  // Field size multiplier (0-5 points)
  if (factors.fieldSize > 200) score += 5;
  else if (factors.fieldSize > 100) score += 3;
  else if (factors.fieldSize > 50) score += 1;

  return Math.min(score, 100);
}

function determineAlertType(
  diseases?: Array<{ name: string; severity: string; confidence: number }>,
  pests?: Array<{ name: string; severity: string; confidence: number }>,
  stressLevel?: string
): string {
  if (diseases && diseases.length > 0) {
    const severeDisease = diseases.find(d => d.severity === 'severe' && d.confidence > 0.7);
    if (severeDisease) return 'disease';
  }
  if (pests && pests.length > 0) {
    const severePest = pests.find(p => p.severity === 'severe' && p.confidence > 0.7);
    if (severePest) return 'pest';
  }
  if (stressLevel === 'severe') return 'water_stress';
  return 'general';
}

function generateAlertContent(params: {
  alertType: string;
  fieldName: string;
  cropType: string;
  diseases?: Array<{ name: string; severity: string; confidence: number }>;
  pests?: Array<{ name: string; severity: string; confidence: number }>;
  yieldImpact: number;
  acreage: number;
  cropValue: number;
}): { title: string; message: string; estimatedLoss: number } {
  const { alertType, fieldName, cropType, diseases, pests, yieldImpact, acreage, cropValue } = params;

  let title = '';
  let message = '';
  const estimatedLoss = (yieldImpact / 100) * acreage * cropValue;

  if (alertType === 'disease' && diseases && diseases.length > 0) {
    const disease = diseases[0];
    title = `🚨 Critical: ${disease.name} Detected`;
    message = `${disease.name} has been detected in your ${cropType} field. This disease can spread rapidly and cause significant yield loss. Immediate treatment is recommended. Estimated potential loss: $${estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`;
  } else if (alertType === 'pest' && pests && pests.length > 0) {
    const pest = pests[0];
    title = `🚨 Critical: ${pest.name} Infestation`;
    message = `Severe ${pest.name} infestation detected in your ${cropType} field. Immediate pest control action is required to prevent further damage. Estimated potential loss: $${estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`;
  } else if (alertType === 'water_stress') {
    title = `🚨 Critical: Severe Water Stress`;
    message = `Your ${cropType} field is experiencing severe water stress. This can lead to significant yield reduction if not addressed. Estimated potential loss: $${estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`;
  } else {
    title = `🚨 Critical Alert: Field Health Issue`;
    message = `A critical health issue has been detected in your ${cropType} field requiring immediate attention. Estimated potential loss: $${estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`;
  }

  return { title, message, estimatedLoss };
}

function getCropValuePerAcre(cropType: string): number {
  // Louisiana Delta average crop values per acre (2024 estimates)
  const values: Record<string, number> = {
    rice: 1387, // $18.50/cwt * 75 cwt/acre
    soybeans: 702, // $13.50/bu * 52 bu/acre
    cotton: 825, // $0.75/lb * 1100 lb/acre
    corn: 1044, // $5.80/bu * 180 bu/acre
  };
  return values[cropType.toLowerCase()] || 1000;
}

