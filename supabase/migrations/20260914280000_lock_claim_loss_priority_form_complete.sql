-- Claim loss % CHECK + clamp; expert consultation priority freeze;
-- conversational-form completed requires 100% metrics; field_uniformity CHECK.

-- ---------------------------------------------------------------------------
-- insurance_claims.estimated_loss_percentage: 0–100 honesty
-- ---------------------------------------------------------------------------

ALTER TABLE public.insurance_claims
  DROP CONSTRAINT IF EXISTS insurance_claims_estimated_loss_percentage_check;

ALTER TABLE public.insurance_claims
  ADD CONSTRAINT insurance_claims_estimated_loss_percentage_check
  CHECK (
    estimated_loss_percentage IS NULL
    OR (
      estimated_loss_percentage >= 0
      AND estimated_loss_percentage <= 100
    )
  );

CREATE OR REPLACE FUNCTION public.protect_insurance_claim_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Clients cannot invent out-of-range loss percentages
  IF NEW.estimated_loss_percentage IS NOT NULL THEN
    IF NEW.estimated_loss_percentage < 0 OR NEW.estimated_loss_percentage > 100 THEN
      RAISE EXCEPTION
        'estimated_loss_percentage must be between 0 and 100'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status IS NULL OR NEW.status = '' THEN
      NEW.status := 'draft';
    ELSIF NEW.status NOT IN ('draft', 'submitted') THEN
      NEW.status := 'draft';
    END IF;
    IF NEW.status = 'submitted' THEN
      NEW.submitted_at := COALESCE(NEW.submitted_at, now());
    ELSE
      NEW.submitted_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.field_id := OLD.field_id;
  NEW.created_at := OLD.created_at;

  IF OLD.status IS DISTINCT FROM 'draft' AND OLD.status IS NOT NULL THEN
    NEW.status := OLD.status;
    NEW.submitted_at := OLD.submitted_at;
    RETURN NEW;
  END IF;

  IF NEW.status IS NULL OR NEW.status = '' THEN
    NEW.status := 'draft';
  ELSIF NEW.status NOT IN ('draft', 'submitted') THEN
    NEW.status := COALESCE(OLD.status, 'draft');
  END IF;

  IF NEW.status = 'submitted' AND COALESCE(OLD.status, 'draft') IS DISTINCT FROM 'submitted' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_insurance_claim_status_trg ON public.insurance_claims;
CREATE TRIGGER protect_insurance_claim_status_trg
  BEFORE INSERT OR UPDATE ON public.insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_insurance_claim_status();

-- ---------------------------------------------------------------------------
-- expert_consultations: freeze priority invent (clients cannot self-urgent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_expert_consultation_response_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.response := NULL;
    NEW.responded_at := NULL;
    -- Confidence-based urgency stays UI-only; DB priority is not forged urgent
    NEW.priority := 'medium';
    RETURN NEW;
  END IF;

  NEW.response := OLD.response;
  NEW.responded_at := OLD.responded_at;
  NEW.researcher_id := OLD.researcher_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.id := OLD.id;
  NEW.priority := OLD.priority;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('pending', 'cancelled') THEN
    RAISE EXCEPTION
      'expert_consultations status may only stay pending or be cancelled by clients'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_expert_consultation_response_columns_trg
  ON public.expert_consultations;
CREATE TRIGGER protect_expert_consultation_response_columns_trg
  BEFORE INSERT OR UPDATE ON public.expert_consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_expert_consultation_response_columns();

-- ---------------------------------------------------------------------------
-- conversational_form_sessions: completed only when metrics are 100%
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_conversational_form_session_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.completion_percentage := 0;
    NEW.extracted_data := COALESCE(NEW.extracted_data, '{}'::jsonb);
    IF NEW.status IS NULL OR NEW.status NOT IN ('active', 'in_progress') THEN
      NEW.status := 'active';
    END IF;
    NEW.completed_at := NULL;
    NEW.abandoned_at := NULL;
    RETURN NEW;
  END IF;

  NEW.completion_percentage := OLD.completion_percentage;
  NEW.extracted_data := OLD.extracted_data;
  NEW.form_type := OLD.form_type;
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;
  NEW.started_at := OLD.started_at;
  NEW.context_data := OLD.context_data;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('active', 'in_progress', 'abandoned', 'completed') THEN
    RAISE EXCEPTION
      'conversational_form_sessions status may only be active, abandoned, or completed'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'completed'
     AND COALESCE(OLD.completion_percentage, 0) <> 100 THEN
    RAISE EXCEPTION
      'conversational_form_sessions cannot be marked completed below 100%% completion'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conversational_form_session_metrics_trg
  ON public.conversational_form_sessions;
CREATE TRIGGER protect_conversational_form_session_metrics_trg
  BEFORE INSERT OR UPDATE ON public.conversational_form_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conversational_form_session_metrics();

-- ---------------------------------------------------------------------------
-- assessments.field_uniformity_score: documented 0–1 scale
-- Normalize legacy 0–100 rows, then enforce CHECK.
-- ---------------------------------------------------------------------------

UPDATE public.assessments
SET field_uniformity_score = field_uniformity_score / 100.0
WHERE field_uniformity_score IS NOT NULL
  AND field_uniformity_score > 1
  AND field_uniformity_score <= 100;

UPDATE public.assessments
SET field_uniformity_score = NULL
WHERE field_uniformity_score IS NOT NULL
  AND (field_uniformity_score < 0 OR field_uniformity_score > 1);

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_field_uniformity_score_check;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_field_uniformity_score_check
  CHECK (
    field_uniformity_score IS NULL
    OR (
      field_uniformity_score >= 0
      AND field_uniformity_score <= 1
    )
  );
