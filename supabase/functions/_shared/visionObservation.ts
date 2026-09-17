export type CropType = 'rice' | 'soybean' | 'cotton' | 'corn';

export type VisionOntologyTag =
  | 'healthy_uncertain_tissue'
  | 'foliar_discoloration'
  | 'lesions_spots'
  | 'defoliation'
  | 'insect_feeding_damage'
  | 'lodging_stem_abnormalities'
  | 'canopy_stress'
  | 'image_quality_problem';

export const VISION_ONTOLOGY: readonly VisionOntologyTag[] = [
  'healthy_uncertain_tissue',
  'foliar_discoloration',
  'lesions_spots',
  'defoliation',
  'insect_feeding_damage',
  'lodging_stem_abnormalities',
  'canopy_stress',
  'image_quality_problem',
] as const;

export type VisionObservationStatus = 'supported_observation' | 'insufficient_evidence';

export interface VisionDetection {
  label: VisionOntologyTag;
  confidence: number | null;
  box?: { x: number; y: number; width: number; height: number };
  evidence: string[];
  source: 'multimodal_model' | 'specialist_detector';
}

export interface VisionMask {
  label: VisionOntologyTag;
  confidence: number | null;
  polygon?: Array<{ x: number; y: number }>;
  rle?: string;
  source: 'specialist_segmenter';
}

export interface SpecialistVisionInput {
  imageUrl: string;
  imageReference: string;
  cropType: CropType;
  growthStage?: string | null;
  context?: Record<string, unknown>;
}

export interface SpecialistVisionResult {
  detectorName: string;
  modelVersion: string;
  detections: VisionDetection[];
  masks: VisionMask[];
}

export interface SpecialistVisionDetector {
  analyze(input: SpecialistVisionInput): Promise<SpecialistVisionResult>;
}

export interface VisionObservation {
  schema_version: 'agurateai.vision_observation.v1';
  status: VisionObservationStatus;
  image_reference: string;
  crop_type: CropType;
  scope: {
    parish: 'Morehouse';
    crop: 'soybean';
    validated: false;
    note: string;
  };
  growth_stage: string | null;
  context: {
    location: string | null;
    field_id: string | null;
    weather_available: boolean;
  };
  visible_findings: Array<{
    tag: VisionOntologyTag;
    description: string;
    confidence: number | null;
    evidence: string[];
  }>;
  interpretations: Array<{
    label: string;
    confidence: number | null;
    evidence: string[];
    caveat: string;
  }>;
  detections: VisionDetection[];
  masks: VisionMask[];
  confidence: number | null;
  supporting_evidence: string[];
  provenance: {
    provider: string;
    model: string;
    model_version: string | null;
    specialist_detector: string | null;
    specialist_model_version: string | null;
    observed_at: string;
  };
  fail_closed_reason: string | null;
}

interface ProviderConfig {
  provider: string;
  model: string;
  modelVersion?: string | null;
}

interface ObservationInput {
  imageReference: string;
  cropType: CropType;
  fieldId?: string | null;
  location?: string | null;
  weatherAvailable: boolean;
  modelConfig: ProviderConfig;
  imageAnalysis: Record<string, unknown>;
  specialistResult?: SpecialistVisionResult | null;
  observedAt?: string;
}

const INSUFFICIENT_EVIDENCE =
  'Insufficient visible evidence for a crop-health interpretation. Retake a clear close-up and field-context image before acting.';

export function isVisionOntologyTag(value: unknown): value is VisionOntologyTag {
  return typeof value === 'string' && (VISION_ONTOLOGY as readonly string[]).includes(value);
}

export function normalizeConfidence(value: unknown): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const n = Number(value);
  if (n < 0 || n > 1) return null;
  return Math.round(n * 1000) / 1000;
}

export function getServerVisionProvider(env: (name: string) => string | undefined, aiUrl: string): string {
  const configured = env('AI_PROVIDER')?.trim();
  if (configured) return configured;
  try {
    return new URL(aiUrl).hostname;
  } catch {
    return 'configured-ai-provider';
  }
}

export function getConfiguredSpecialistDetector(
  _env: (name: string) => string | undefined = (name) => Deno.env.get(name)?.trim()
): SpecialistVisionDetector | null {
  // Future extension point for soybean-specific YOLO/RT-DETR/segmentation services.
  // Returning null is intentional: no trained specialist model is bundled or claimed.
  return null;
}

export function buildVisionObservation(input: ObservationInput): VisionObservation {
  const confidence = normalizeConfidence(input.imageAnalysis.confidence_score);
  const rawFindings = Array.isArray(input.imageAnalysis.visible_findings)
    ? input.imageAnalysis.visible_findings
    : [];
  const symptoms = Array.isArray(input.imageAnalysis.symptoms)
    ? input.imageAnalysis.symptoms.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const visualCues = typeof input.imageAnalysis.visual_cues === 'string' ? input.imageAnalysis.visual_cues.trim() : '';
  const visible_findings = rawFindings
    .map((item) => normalizeVisibleFinding(item))
    .filter((item): item is VisionObservation['visible_findings'][number] => Boolean(item));

  if (visible_findings.length === 0) {
    for (const symptom of symptoms) {
      visible_findings.push({
        tag: inferTag(symptom),
        description: symptom,
        confidence,
        evidence: visualCues ? [visualCues] : [symptom],
      });
    }
  }

  const hasQualityProblem = visible_findings.some((finding) => finding.tag === 'image_quality_problem');
  const hasEvidence = visible_findings.some((finding) => finding.evidence.length > 0 || finding.description.length > 0);
  const diseaseNames = Array.isArray(input.imageAnalysis.disease_identified)
    ? input.imageAnalysis.disease_identified.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const pestNames = Array.isArray(input.imageAnalysis.pest_identified)
    ? input.imageAnalysis.pest_identified.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  const failClosedReason =
    confidence == null || confidence < 0.45
      ? 'Model confidence is too low for an evidence-supported interpretation.'
      : !hasEvidence
        ? 'No visible findings were returned by the model.'
        : hasQualityProblem
          ? 'Image quality limits crop-health interpretation.'
          : null;

  const status: VisionObservationStatus = failClosedReason ? 'insufficient_evidence' : 'supported_observation';
  const interpretations = status === 'supported_observation'
    ? [...diseaseNames.map((label) => interpretation(label, confidence, visualCues)), ...pestNames.map((label) => interpretation(label, confidence, visualCues))]
    : [];

  return {
    schema_version: 'agurateai.vision_observation.v1',
    status,
    image_reference: input.imageReference,
    crop_type: input.cropType,
    scope: {
      parish: 'Morehouse',
      crop: 'soybean',
      validated: false,
      note: 'Current public crop-analysis evidence is scoped to Morehouse Parish soybean observations and is not a diagnosis.',
    },
    growth_stage: typeof input.imageAnalysis.growth_stage === 'string' ? input.imageAnalysis.growth_stage : null,
    context: {
      location: input.location ?? null,
      field_id: input.fieldId ?? null,
      weather_available: input.weatherAvailable,
    },
    visible_findings: visible_findings.length > 0
      ? visible_findings
      : [{ tag: 'image_quality_problem', description: INSUFFICIENT_EVIDENCE, confidence, evidence: [INSUFFICIENT_EVIDENCE] }],
    interpretations,
    detections: input.specialistResult?.detections ?? [],
    masks: input.specialistResult?.masks ?? [],
    confidence,
    supporting_evidence: visualCues ? [visualCues, ...symptoms] : symptoms,
    provenance: {
      provider: input.modelConfig.provider,
      model: input.modelConfig.model,
      model_version: input.modelConfig.modelVersion ?? null,
      specialist_detector: input.specialistResult?.detectorName ?? null,
      specialist_model_version: input.specialistResult?.modelVersion ?? null,
      observed_at: input.observedAt ?? new Date().toISOString(),
    },
    fail_closed_reason: failClosedReason,
  };
}

function normalizeVisibleFinding(item: unknown): VisionObservation['visible_findings'][number] | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as { tag?: unknown; description?: unknown; confidence?: unknown; evidence?: unknown };
  if (!isVisionOntologyTag(raw.tag) || typeof raw.description !== 'string' || raw.description.trim().length === 0) {
    return null;
  }
  const evidence = Array.isArray(raw.evidence)
    ? raw.evidence.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
  return {
    tag: raw.tag,
    description: raw.description.trim(),
    confidence: normalizeConfidence(raw.confidence),
    evidence,
  };
}

function interpretation(label: string, confidence: number | null, visualCues: string): VisionObservation['interpretations'][number] {
  return {
    label,
    confidence,
    evidence: visualCues ? [visualCues] : [],
    caveat: 'Interpretation only; confirm with local agronomic review, scouting, and lab or Extension guidance when needed.',
  };
}

function inferTag(text: string): VisionOntologyTag {
  const value = text.toLowerCase();
  if (value.includes('spot') || value.includes('lesion')) return 'lesions_spots';
  if (value.includes('yellow') || value.includes('chlor') || value.includes('discolor')) return 'foliar_discoloration';
  if (value.includes('defoli')) return 'defoliation';
  if (value.includes('insect') || value.includes('feeding') || value.includes('chew')) return 'insect_feeding_damage';
  if (value.includes('lodg') || value.includes('stem')) return 'lodging_stem_abnormalities';
  if (value.includes('blur') || value.includes('unclear') || value.includes('quality')) return 'image_quality_problem';
  if (value.includes('canopy') || value.includes('stress')) return 'canopy_stress';
  return 'healthy_uncertain_tissue';
}
