import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import {
  corsHeaders,
  handleError,
  handleRateLimitError,
} from '../_shared/errorHandler.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { checkRateLimit, logRequest, RATE_LIMITS } from '../_shared/rateLimiter.ts';

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
    const auth = await requireAuthenticatedUser(req, corsHeaders);
    if (auth instanceof Response) return auth;
    const { user, authHeader } = auth;
    const supabaseClient = getAnonClient(authHeader);

    const rateLimit = await checkRateLimit(supabaseClient, user.id, {
      functionName: 'detect-critical-alerts',
      maxRequests: RATE_LIMITS['detect-critical-alerts'].maxRequests,
      windowMs: RATE_LIMITS['detect-critical-alerts'].windowMs,
    });
    if (!rateLimit.allowed) {
      return handleRateLimitError(corsHeaders);
    }
    await logRequest(
      supabaseClient,
      user.id,
      'detect-critical-alerts',
      req.headers.get('x-forwarded-for'),
      req.headers.get('user-agent')
    );

    const {
      assessment_id,
      field_id,
      health_score,
      stress_level,
      diseases,
      pests,
      estimated_yield_impact_percent,
      field_acreage,
      crop_type,
    }: CriticalAlertInput = await req.json();

    if (!field_id || !assessment_id) {
      return new Response(
        JSON.stringify({ error: 'field_id and assessment_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: field, error: fieldError } = await supabaseClient
      .from('fields')
      .select('id, name, user_id')
      .eq('id', field_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fieldError || !field) {
      return new Response(JSON.stringify({ error: 'Field not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const urgencyScore = calculateUrgencyScore({
      healthScore: health_score,
      stressLevel: stress_level,
      diseaseSeverity:
        diseases?.reduce((max, d) => {
          const severity = d.severity === 'severe' ? 3 : d.severity === 'moderate' ? 2 : 1;
          return Math.max(max, severity * d.confidence);
        }, 0) || 0,
      pestSeverity:
        pests?.reduce((max, p) => {
          const severity = p.severity === 'severe' ? 3 : p.severity === 'moderate' ? 2 : 1;
          return Math.max(max, severity * p.confidence);
        }, 0) || 0,
      yieldImpact: estimated_yield_impact_percent || 0,
      fieldSize: field_acreage || 100,
      cropValue: getCropValuePerAcre(crop_type || 'rice'),
    });

    if (urgencyScore < 60) {
      return new Response(
        JSON.stringify({
          alert_created: false,
          urgency_score: urgencyScore,
          message: 'Alert urgency below threshold',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alertType = determineAlertType(diseases, pests, stress_level);
    const { title, message, estimatedLoss } = generateAlertContent({
      alertType,
      fieldName: field.name || 'Field',
      cropType: crop_type || 'crop',
      diseases,
      pests,
      yieldImpact: estimated_yield_impact_percent || 0,
      acreage: field_acreage || 100,
      cropValue: getCropValuePerAcre(crop_type || 'rice'),
    });

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
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (alertError) throw alertError;

    return new Response(
      JSON.stringify({
        alert_created: true,
        alert_id: alert.id,
        urgency_score: urgencyScore,
        requires_escalation: urgencyScore >= 80,
        message: 'Critical alert created successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return handleError(error, 'detect-critical-alerts', corsHeaders);
  }
});

function calculateUrgencyScore(factors: UrgencyFactors): number {
  let score = 0;
  if (factors.healthScore < 50) score += 40;
  else if (factors.healthScore < 65) score += 25;
  else if (factors.healthScore < 75) score += 10;

  if (factors.stressLevel === 'severe') score += 20;
  else if (factors.stressLevel === 'moderate') score += 10;

  score += Math.min(factors.diseaseSeverity * 5, 15);
  score += Math.min(factors.pestSeverity * 3, 10);

  if (factors.yieldImpact > 30) score += 10;
  else if (factors.yieldImpact > 20) score += 7;
  else if (factors.yieldImpact > 10) score += 4;

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
  if (diseases?.length) {
    const severeDisease = diseases.find((d) => d.severity === 'severe' && d.confidence > 0.7);
    if (severeDisease) return 'disease';
  }
  if (pests?.length) {
    const severePest = pests.find((p) => p.severity === 'severe' && p.confidence > 0.7);
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
  const { alertType, cropType, diseases, pests, yieldImpact, acreage, cropValue } = params;
  const estimatedLoss = (yieldImpact / 100) * acreage * cropValue;
  const lossText = estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 });

  if (alertType === 'disease' && diseases?.length) {
    const disease = diseases[0];
    return {
      title: `Critical: ${disease.name} Detected`,
      message: `${disease.name} was flagged in your ${cropType} field. Review treatment options promptly. Illustrative loss estimate if untreated: $${lossText}.`,
      estimatedLoss,
    };
  }
  if (alertType === 'pest' && pests?.length) {
    const pest = pests[0];
    return {
      title: `Critical: ${pest.name} Pressure`,
      message: `Elevated ${pest.name} pressure was flagged in your ${cropType} field. Confirm in-field and consider control measures. Illustrative loss estimate if untreated: $${lossText}.`,
      estimatedLoss,
    };
  }
  if (alertType === 'water_stress') {
    return {
      title: 'Critical: Severe Water Stress',
      message: `Your ${cropType} field shows severe water-stress signals. Verify irrigation/soil moisture soon. Illustrative loss estimate if untreated: $${lossText}.`,
      estimatedLoss,
    };
  }
  return {
    title: 'Critical Alert: Field Health Issue',
    message: `A high-urgency health signal was flagged for your ${cropType} field. Review the assessment details. Illustrative loss estimate if untreated: $${lossText}.`,
    estimatedLoss,
  };
}

function getCropValuePerAcre(cropType: string): number {
  const values: Record<string, number> = {
    rice: 1387,
    soybeans: 702,
    cotton: 825,
    corn: 1044,
  };
  return values[cropType.toLowerCase()] || 1000;
}
