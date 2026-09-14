-- Freeze cooperative_members identity on UPDATE; require membership for
-- fields.cooperative_id; expand predictive_models AI freeze; reject client
-- prediction_outcomes invent; score range CHECKs.

-- ---------------------------------------------------------------------------
-- cooperative_members: freeze user_id / cooperative_id on client UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_cooperative_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.cooperative_id := OLD.cooperative_id;
  NEW.joined_at := OLD.joined_at;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NEW.role IS NULL OR NEW.role NOT IN ('admin', 'member') THEN
      NEW.role := OLD.role;
    ELSIF NOT public.is_cooperative_admin(OLD.cooperative_id, auth.uid()) THEN
      NEW.role := OLD.role;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_member_update_trg ON public.cooperative_members;
CREATE TRIGGER protect_cooperative_member_update_trg
  BEFORE UPDATE ON public.cooperative_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_member_update();

-- ---------------------------------------------------------------------------
-- fields.cooperative_id: must be null or a coop the owner belongs to
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_field_cooperative_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.cooperative_id IS NOT NULL THEN
    IF auth.uid() IS NULL
       OR NOT public.is_cooperative_member(NEW.cooperative_id, auth.uid()) THEN
      RAISE EXCEPTION
        'fields.cooperative_id requires membership in that cooperative'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_field_cooperative_link_trg ON public.fields;
CREATE TRIGGER protect_field_cooperative_link_trg
  BEFORE INSERT OR UPDATE OF cooperative_id ON public.fields
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_field_cooperative_link();

-- ---------------------------------------------------------------------------
-- predictive_models: freeze AI invent columns + 0–1 score CHECKs
-- ---------------------------------------------------------------------------

UPDATE public.predictive_models
SET confidence_score = NULL
WHERE confidence_score IS NOT NULL
  AND (confidence_score < 0 OR confidence_score > 1);

UPDATE public.predictive_models
SET accuracy_score = NULL
WHERE accuracy_score IS NOT NULL
  AND (accuracy_score < 0 OR accuracy_score > 1);

ALTER TABLE public.predictive_models
  DROP CONSTRAINT IF EXISTS predictive_models_confidence_score_check;
ALTER TABLE public.predictive_models
  ADD CONSTRAINT predictive_models_confidence_score_check
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

ALTER TABLE public.predictive_models
  DROP CONSTRAINT IF EXISTS predictive_models_accuracy_score_check;
ALTER TABLE public.predictive_models
  ADD CONSTRAINT predictive_models_accuracy_score_check
  CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 1));

CREATE OR REPLACE FUNCTION public.protect_predictive_model_lsu_validation()
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
    RAISE EXCEPTION
      'predictive_models may only be created by trusted backends'
      USING ERRCODE = '42501';
  END IF;

  NEW.field_id := OLD.field_id;
  NEW.model_type := OLD.model_type;
  NEW.prediction_data := OLD.prediction_data;
  NEW.prediction_horizon := OLD.prediction_horizon;
  NEW.confidence_score := OLD.confidence_score;
  NEW.accuracy_score := OLD.accuracy_score;
  NEW.lsu_validation := OLD.lsu_validation;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_predictive_model_lsu_validation_trg ON public.predictive_models;
CREATE TRIGGER protect_predictive_model_lsu_validation_trg
  BEFORE INSERT OR UPDATE ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_predictive_model_lsu_validation();

-- ---------------------------------------------------------------------------
-- prediction_outcomes: reject client INSERT; freeze invent columns on UPDATE
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS reject_client_insert_prediction_outcomes_trg ON public.prediction_outcomes;
CREATE TRIGGER reject_client_insert_prediction_outcomes_trg
  BEFORE INSERT ON public.prediction_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

CREATE OR REPLACE FUNCTION public.protect_prediction_outcome_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.prediction_id := OLD.prediction_id;
  NEW.accuracy_achieved := OLD.accuracy_achieved;
  NEW.actual_outcome := OLD.actual_outcome;
  NEW.lsu_researcher_feedback := OLD.lsu_researcher_feedback;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  -- farmer_feedback may be updated by the owning farmer when policy allows

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_prediction_outcome_ai_columns_trg ON public.prediction_outcomes;
CREATE TRIGGER protect_prediction_outcome_ai_columns_trg
  BEFORE UPDATE ON public.prediction_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_prediction_outcome_ai_columns();
