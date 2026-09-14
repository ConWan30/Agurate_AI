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
  /** @deprecated Ignored — scores are loaded from the persisted assessment. */
  health_score?: number;
  /** @deprecated Ignored — scores are loaded from the persisted assessment. */
  stress_level?: string;
  diseases?: unknown;
  pests?: unknown;
  /** @deprecated Ignored — yield impact is loaded from the persisted assessment. */
  estimated_yield_impact_percent?: number;
  field_acreage?: number;
  crop_type?: string;
  /** Optional $/acre from caller — USD loss omitted when not provided. */
  crop_value_per_acre?: number;
}

interface UrgencyFactors {
  healthScore: number | null;
  stressLevel: string;
  diseaseSeverity: number;
  pestSeverity: number;
  yieldImpact: number | null;
  fieldSize: number | null;
  cropValue: number | null;
}

type ThreatItem = { name: string; severity: string; confidence: number | null };

function normalizeThreatList(raw: unknown): ThreatItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') {
      // Name-only — do not invent severity or confidence
      return { name: item, severity: 'unknown', confidence: null };
    }
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const conf = typeof o.confidence === 'number' && Number.isFinite(o.confidence)
        ? o.confidence
        : null;
      return {
        name: String(o.name ?? o.disease ?? o.pest ?? 'unknown'),
        severity: String(o.severity ?? 'unknown'),
        confidence: conf,
      };
    }
    return { name: 'unknown', severity: 'unknown', confidence: null };
  }).filter((d) => d.name && d.name !== 'unknown');
}

function threatSeverityWeight(severity: string, confidence: number | null): number {
  // Missing confidence must not invent a measured 0% — omit from urgency weighting.
  if (confidence == null || !Number.isFinite(confidence)) return 0;
  const level =
    severity === 'severe' ? 3 : severity === 'moderate' ? 2 : severity === 'mild' || severity === 'low' ? 1 : 0;
  return level * confidence;
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
      diseases,
      pests,
      field_acreage,
      crop_type,
      crop_value_per_acre,
    }: CriticalAlertInput = await req.json();

    if (!field_id || !assessment_id) {
      return new Response(
        JSON.stringify({ error: 'field_id and assessment_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: field, error: fieldError } = await supabaseClient
      .from('fields')
      .select('id, name, user_id, acreage, crop_type')
      .eq('id', field_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fieldError || !field) {
      return new Response(JSON.stringify({ error: 'Field not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trust persisted assessment scores only — never client-supplied health_score / stress_level
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .select(
        'id, field_id, health_score, stress_level, estimated_yield_impact_percent, disease_identified, pest_identified'
      )
      .eq('id', assessment_id)
      .eq('field_id', field_id)
      .maybeSingle();

    if (assessmentError || !assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const health_score = assessment.health_score;
    const stress_level = assessment.stress_level ?? 'unknown';
    const estimated_yield_impact_percent = assessment.estimated_yield_impact_percent;

    const normalizedDiseases = normalizeThreatList(
      Array.isArray(diseases) && diseases.length > 0 ? diseases : assessment.disease_identified
    );
    const normalizedPests = normalizeThreatList(
      Array.isArray(pests) && pests.length > 0 ? pests : assessment.pest_identified
    );

    const finiteHealth =
      typeof health_score === 'number' && Number.isFinite(health_score) ? health_score : null;
    const finiteYield =
      estimated_yield_impact_percent != null && Number.isFinite(Number(estimated_yield_impact_percent))
        ? Number(estimated_yield_impact_percent)
        : null;
    const finiteAcreage =
      field_acreage != null && Number.isFinite(Number(field_acreage))
        ? Number(field_acreage)
        : field.acreage != null && Number.isFinite(Number(field.acreage))
          ? Number(field.acreage)
          : null;
    const resolvedCropType = crop_type || field.crop_type || 'crop';

    const urgencyScore = calculateUrgencyScore({
      healthScore: finiteHealth,
      stressLevel: stress_level,
      diseaseSeverity:
        normalizedDiseases.reduce((max, d) => Math.max(max, threatSeverityWeight(d.severity, d.confidence)), 0),
      pestSeverity:
        normalizedPests.reduce((max, p) => Math.max(max, threatSeverityWeight(p.severity, p.confidence)), 0),
      yieldImpact: finiteYield,
      fieldSize: finiteAcreage,
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
    const { title, message, estimatedLoss } = generateAlertContent({
      alertType,
      fieldName: field.name || 'Field',
      cropType: resolvedCropType,
      diseases: normalizedDiseases,
      pests: normalizedPests,
      yieldImpact: finiteYield,
      acreage: finiteAcreage,
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
  // Missing health must not invent critical urgency (null < 50 is true in JS).
  if (factors.healthScore != null && Number.isFinite(factors.healthScore)) {
    if (factors.healthScore < 50) score += 40;
    else if (factors.healthScore < 65) score += 25;
    else if (factors.healthScore < 75) score += 10;
  }

  if (factors.stressLevel === 'severe') score += 20;
  else if (factors.stressLevel === 'moderate') score += 10;

  score += Math.min(factors.diseaseSeverity * 5, 15);
  score += Math.min(factors.pestSeverity * 3, 10);

  if (factors.yieldImpact != null && Number.isFinite(factors.yieldImpact)) {
    if (factors.yieldImpact > 30) score += 10;
    else if (factors.yieldImpact > 20) score += 7;
    else if (factors.yieldImpact > 10) score += 4;
  }

  if (factors.fieldSize != null && Number.isFinite(factors.fieldSize)) {
    if (factors.fieldSize > 200) score += 5;
    else if (factors.fieldSize > 100) score += 3;
    else if (factors.fieldSize > 50) score += 1;
  }

  return Math.min(score, 100);
}

function determineAlertType(
  diseases?: ThreatItem[],
  pests?: ThreatItem[],
  stressLevel?: string
): string {
  if (diseases?.length) {
    const severeDisease = diseases.find(
      (d) => d.severity === 'severe' && d.confidence != null && d.confidence > 0.7,
    );
    if (severeDisease) return 'disease';
  }
  if (pests?.length) {
    const severePest = pests.find(
      (p) => p.severity === 'severe' && p.confidence != null && p.confidence > 0.7,
    );
    if (severePest) return 'pest';
  }
  if (stressLevel === 'severe') return 'water_stress';
  return 'general';
}

function generateAlertContent(params: {
  alertType: string;
  fieldName: string;
  cropType: string;
  diseases?: ThreatItem[];
  pests?: ThreatItem[];
  yieldImpact: number | null;
  acreage: number | null;
  cropValue: number | null;
}): { title: string; message: string; estimatedLoss: number | null } {
  const { alertType, cropType, diseases, pests, yieldImpact, acreage, cropValue } = params;
  const hasYieldImpact =
    yieldImpact != null &&
    Number.isFinite(yieldImpact) &&
    acreage != null &&
    acreage > 0 &&
    cropValue != null &&
    Number.isFinite(cropValue) &&
    cropValue > 0;
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
