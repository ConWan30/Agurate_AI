import { serve } from 'https://deno.land/std@0.178.0/http/server.ts';
import {
  corsHeaders,
  handleError,
  handleRateLimitError,
} from '../_shared/errorHandler.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuthenticatedUser, getAnonClient } from '../_shared/auth.ts';
import { enforceRateLimit, RATE_LIMITS } from '../_shared/rateLimiter.ts';

interface CriticalAlertInput {
  assessment_id: string;
  field_id: string;
  health_score: number;
  stress_level: string;
  diseases?: unknown;
  pests?: unknown;
  estimated_yield_impact_percent?: number;
  field_acreage?: number;
  crop_type?: string;
  /** Optional $/acre from caller — USD loss omitted when not provided. */
  crop_value_per_acre?: number;
}

interface UrgencyFactors {
  healthScore: number;
  stressLevel: string;
  diseaseSeverity: number;
  pestSeverity: number;
  yieldImpact: number;
  fieldSize: number;
  cropValue: number | null;
}


function normalizeThreatList(raw: unknown): Array<{ name: string; severity: string; confidence: number }> {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') {
      return { name: item, severity: 'unknown', confidence: 0 };
    }
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      return {
        name: String(o.name ?? o.disease ?? o.pest ?? 'unknown'),
        severity: String(o.severity ?? 'unknown'),
        confidence: typeof o.confidence === 'number' ? o.confidence : 0,
      };
    }
    return { name: 'unknown', severity: 'unknown', confidence: 0 };
  }).filter((d) => d.name && d.name !== 'unknown');
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
    const supabaseClient = getAnonClient(authHeader);

    const rateLimit = await enforceRateLimit(supabaseClient, user.id, {
      functionName: 'detect-critical-alerts',
      maxRequests: RATE_LIMITS['detect-critical-alerts'].maxRequests,
      windowMs: RATE_LIMITS['detect-critical-alerts'].windowMs,
    }, req);
    if (!rateLimit.allowed) {
      return handleRateLimitError(corsHeaders);
    }

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
      crop_value_per_acre,
    }: CriticalAlertInput = await req.json();

    const normalizedDiseases = normalizeThreatList(diseases);
    const normalizedPests = normalizeThreatList(pests);

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
        normalizedDiseases.reduce((max, d) => {
          const severity = d.severity === 'severe' ? 3 : d.severity === 'moderate' ? 2 : 1;
          return Math.max(max, severity * d.confidence);
        }, 0),
      pestSeverity:
        normalizedPests.reduce((max, p) => {
          const severity = p.severity === 'severe' ? 3 : p.severity === 'moderate' ? 2 : 1;
          return Math.max(max, severity * p.confidence);
        }, 0),
      yieldImpact: estimated_yield_impact_percent || 0,
      fieldSize: field_acreage ?? 0,
      cropValue: resolveCropValuePerAcre(crop_value_per_acre),
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

    const alertType = determineAlertType(normalizedDiseases, normalizedPests, stress_level);
    const yieldImpact = Number.isFinite(Number(estimated_yield_impact_percent))
      ? Number(estimated_yield_impact_percent)
      : null;
    const { title, message, estimatedLoss } = generateAlertContent({
      alertType,
      fieldName: field.name || 'Field',
      cropType: crop_type || 'crop',
      diseases: normalizedDiseases,
      pests: normalizedPests,
      yieldImpact,
      acreage: field_acreage ?? 0,
      cropValue: resolveCropValuePerAcre(crop_value_per_acre),
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
  yieldImpact: number | null;
  acreage: number;
  cropValue: number | null;
}): { title: string; message: string; estimatedLoss: number | null } {
  const { alertType, cropType, diseases, pests, yieldImpact, acreage, cropValue } = params;
  const hasYieldImpact = yieldImpact != null && Number.isFinite(yieldImpact) && acreage > 0 && cropValue != null && Number.isFinite(cropValue) && cropValue > 0;
  const estimatedLoss = hasYieldImpact
    ? (Number(yieldImpact) / 100) * acreage * cropValue
    : null;
  const lossSuffix = estimatedLoss != null
    ? ` Illustrative planning estimate if untreated (not a measured loss): $${estimatedLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`
    : '';

  if (alertType === 'disease' && diseases?.length) {
    const disease = diseases[0];
    return {
      title: `Critical: ${disease.name} Detected`,
      message: `${disease.name} was flagged in your ${cropType} field. Review treatment options promptly.${lossSuffix}`,
      estimatedLoss,
    };
  }
  if (alertType === 'pest' && pests?.length) {
    const pest = pests[0];
    return {
      title: `Critical: ${pest.name} Pressure`,
      message: `Elevated ${pest.name} pressure was flagged in your ${cropType} field. Confirm in-field and consider control measures.${lossSuffix}`,
      estimatedLoss,
    };
  }
  if (alertType === 'water_stress') {
    return {
      title: 'Critical: Severe Water Stress',
      message: `Your ${cropType} field shows severe water-stress signals. Verify irrigation/soil moisture soon.${lossSuffix}`,
      estimatedLoss,
    };
  }
  return {
    title: 'Critical Alert: Field Health Issue',
    message: `A high-urgency health signal was flagged for your ${cropType} field. Review the assessment details.${lossSuffix}`,
    estimatedLoss,
  };
}

/** Only use caller-provided crop $/acre — never invent commodity defaults. */
function resolveCropValuePerAcre(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
