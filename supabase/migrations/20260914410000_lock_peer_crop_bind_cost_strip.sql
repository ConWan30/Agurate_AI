-- Peer INSERT: bind crop_type to owned field; strip client cost_usd invent;
-- freeze crop_type on UPDATE.

CREATE OR REPLACE FUNCTION public.protect_peer_treatment_outcome_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owned_field uuid;
  field_crop text;
  rec_field uuid;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated'
        USING ERRCODE = '42501';
    END IF;

    NEW.farmer_id := auth.uid();

    SELECT f.id, f.crop_type INTO owned_field, field_crop
    FROM public.fields f
    WHERE f.id = NEW.field_id
      AND f.user_id = auth.uid();

    IF owned_field IS NULL THEN
      RAISE EXCEPTION 'peer_treatment_outcomes.field_id must be owned by the authenticated user'
        USING ERRCODE = '42501';
    END IF;

    -- Never trust client-supplied crop_type for peer aggregates.
    NEW.crop_type := field_crop;

    IF NEW.recommendation_id IS NULL THEN
      RAISE EXCEPTION 'peer_treatment_outcomes.recommendation_id is required'
        USING ERRCODE = '23514';
    END IF;

    SELECT a.field_id INTO rec_field
    FROM public.recommendations r
    JOIN public.assessments a ON a.id = r.assessment_id
    WHERE r.id = NEW.recommendation_id;

    IF rec_field IS NULL OR rec_field IS DISTINCT FROM NEW.field_id THEN
      RAISE EXCEPTION 'peer_treatment_outcomes.recommendation_id must belong to the same owned field'
        USING ERRCODE = '23514';
    END IF;

    -- Client money invent must not enter peer comparison averages.
    NEW.cost_usd := NULL;

    RETURN NEW;
  END IF;

  NEW.effectiveness_score := OLD.effectiveness_score;
  NEW.cost_usd := OLD.cost_usd;
  NEW.outcome := OLD.outcome;
  NEW.field_id := OLD.field_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.recommendation_id := OLD.recommendation_id;
  NEW.crop_type := OLD.crop_type;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_peer_treatment_outcome_metrics_trg
  ON public.peer_treatment_outcomes;
CREATE TRIGGER protect_peer_treatment_outcome_metrics_trg
  BEFORE INSERT OR UPDATE ON public.peer_treatment_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_peer_treatment_outcome_metrics();
