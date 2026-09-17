export type VisionObservationStatus = 'supported_observation' | 'insufficient_evidence';

export interface VisionObservation {
  schema_version?: string;
  status?: VisionObservationStatus;
  fail_closed_reason?: string | null;
  visible_findings?: Array<{
    tag?: string;
    description?: string;
    confidence?: number | null;
    evidence?: string[];
  }>;
  provenance?: {
    provider?: string;
    model?: string;
    model_version?: string | null;
    observed_at?: string;
  };
}

export function isInsufficientEvidenceResult(value: unknown): value is {
  error?: string;
  vision_observation: VisionObservation;
} {
  if (!value || typeof value !== 'object') return false;
  const result = value as { vision_observation?: VisionObservation };
  return result.vision_observation?.status === 'insufficient_evidence';
}

export async function readFunctionErrorPayload(error: unknown): Promise<unknown> {
  const context = error && typeof error === 'object' && 'context' in error
    ? (error as { context?: unknown }).context
    : null;
  if (context && typeof context === 'object' && 'json' in context) {
    const json = (context as { json?: unknown }).json;
    if (typeof json === 'function') {
      try {
        return await json.call(context);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function insufficientEvidenceMessage(result: { vision_observation: VisionObservation }): string {
  return result.vision_observation.fail_closed_reason
    || result.vision_observation.visible_findings?.[0]?.description
    || 'The image does not provide enough visible evidence for an interpretation. Retake a clearer soybean photo.';
}
