ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS vision_observation jsonb;

COMMENT ON COLUMN public.assessments.vision_observation IS
  'AgurateAI vision observation contract separating visible findings, interpretations, provenance, detections/masks, confidence, context, and fail-closed evidence status.';
