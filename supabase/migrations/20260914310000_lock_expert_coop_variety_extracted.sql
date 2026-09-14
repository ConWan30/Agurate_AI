-- Expert consultation field/assessment ownership; cooperative alert content freeze;
-- variety recommendation honesty; conversational extracted_data invent-on-insert lock.

-- ---------------------------------------------------------------------------
-- expert_consultations: INSERT must own field / assessment when provided
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers can create consultations" ON public.expert_consultations;
DROP POLICY IF EXISTS "Users can create consultations" ON public.expert_consultations;

CREATE POLICY "Farmers can create consultations for own fields"
  ON public.expert_consultations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    farmer_id = auth.uid()
    AND (
      field_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.fields f
        WHERE f.id = expert_consultations.field_id
          AND f.user_id = auth.uid()
      )
    )
    AND (
      assessment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.assessments a
        JOIN public.fields f ON f.id = a.field_id
        WHERE a.id = expert_consultations.assessment_id
          AND f.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- cooperative_alerts: freeze invent content on client UPDATE; acres >= 0
-- ---------------------------------------------------------------------------

UPDATE public.cooperative_alerts
SET affected_area_acres = NULL
WHERE affected_area_acres IS NOT NULL AND affected_area_acres < 0;

ALTER TABLE public.cooperative_alerts
  DROP CONSTRAINT IF EXISTS cooperative_alerts_affected_area_acres_check;

ALTER TABLE public.cooperative_alerts
  ADD CONSTRAINT cooperative_alerts_affected_area_acres_check
  CHECK (affected_area_acres IS NULL OR affected_area_acres >= 0);

CREATE OR REPLACE FUNCTION public.protect_cooperative_alert_content_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.alert_type IS DISTINCT FROM OLD.alert_type
      OR NEW.severity IS DISTINCT FROM OLD.severity
      OR NEW.title IS DISTINCT FROM OLD.title
      OR NEW.message IS DISTINCT FROM OLD.message
      OR NEW.recommended_action IS DISTINCT FROM OLD.recommended_action
      OR NEW.affected_area_acres IS DISTINCT FROM OLD.affected_area_acres
      OR NEW.crop_type IS DISTINCT FROM OLD.crop_type
      OR NEW.field_id IS DISTINCT FROM OLD.field_id
      OR NEW.cooperative_id IS DISTINCT FROM OLD.cooperative_id
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION
        'cooperative_alerts content columns may only be updated by trusted backends'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_alert_content_columns_trg
  ON public.cooperative_alerts;
CREATE TRIGGER protect_cooperative_alert_content_columns_trg
  BEFORE UPDATE ON public.cooperative_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_alert_content_columns();

-- ---------------------------------------------------------------------------
-- variety_recommendations: expected_improvement nullable 0–1 + risk allowlist
-- ---------------------------------------------------------------------------

ALTER TABLE public.variety_recommendations
  ALTER COLUMN expected_improvement DROP NOT NULL;

UPDATE public.variety_recommendations
SET expected_improvement = NULL
WHERE expected_improvement IS NOT NULL
  AND (expected_improvement < 0 OR expected_improvement > 1);

UPDATE public.variety_recommendations
SET risk_assessment = 'medium'
WHERE risk_assessment IS NOT NULL
  AND lower(risk_assessment) NOT IN ('low', 'medium', 'high');

ALTER TABLE public.variety_recommendations
  DROP CONSTRAINT IF EXISTS variety_recommendations_expected_improvement_check;

ALTER TABLE public.variety_recommendations
  ADD CONSTRAINT variety_recommendations_expected_improvement_check
  CHECK (
    expected_improvement IS NULL
    OR (expected_improvement >= 0 AND expected_improvement <= 1)
  );

ALTER TABLE public.variety_recommendations
  DROP CONSTRAINT IF EXISTS variety_recommendations_risk_assessment_check;

ALTER TABLE public.variety_recommendations
  ADD CONSTRAINT variety_recommendations_risk_assessment_check
  CHECK (
    risk_assessment IS NULL
    OR lower(risk_assessment) IN ('low', 'medium', 'high')
  );

-- ---------------------------------------------------------------------------
-- conversational_form_sessions: force empty extracted_data on client INSERT
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
    -- Clients must not invent extracted answers at session create
    NEW.extracted_data := '{}'::jsonb;
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
