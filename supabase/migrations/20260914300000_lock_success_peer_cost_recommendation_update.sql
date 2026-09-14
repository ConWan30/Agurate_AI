-- Success-story / peer cost numeric honesty + freeze recommendation AI columns on UPDATE.

-- ---------------------------------------------------------------------------
-- success_stories: estimated_savings and acres_protected must be non-negative
-- ---------------------------------------------------------------------------

UPDATE public.success_stories
SET estimated_savings = NULL
WHERE estimated_savings IS NOT NULL AND estimated_savings < 0;

UPDATE public.success_stories
SET acres_protected = NULL
WHERE acres_protected IS NOT NULL AND acres_protected < 0;

ALTER TABLE public.success_stories
  DROP CONSTRAINT IF EXISTS success_stories_estimated_savings_check;

ALTER TABLE public.success_stories
  ADD CONSTRAINT success_stories_estimated_savings_check
  CHECK (estimated_savings IS NULL OR estimated_savings >= 0);

ALTER TABLE public.success_stories
  DROP CONSTRAINT IF EXISTS success_stories_acres_protected_check;

ALTER TABLE public.success_stories
  ADD CONSTRAINT success_stories_acres_protected_check
  CHECK (acres_protected IS NULL OR acres_protected >= 0);

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes.cost_usd: non-negative
-- ---------------------------------------------------------------------------

UPDATE public.peer_treatment_outcomes
SET cost_usd = NULL
WHERE cost_usd IS NOT NULL AND cost_usd < 0;

ALTER TABLE public.peer_treatment_outcomes
  DROP CONSTRAINT IF EXISTS peer_treatment_outcomes_cost_usd_check;

ALTER TABLE public.peer_treatment_outcomes
  ADD CONSTRAINT peer_treatment_outcomes_cost_usd_check
  CHECK (cost_usd IS NULL OR cost_usd >= 0);

-- ---------------------------------------------------------------------------
-- recommendations: freeze AI columns on client UPDATE (defense in depth)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_recommendation_inserts()
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
      'recommendations may only be created by trusted backends'
      USING ERRCODE = '42501';
  END IF;

  -- Clients must not rewrite AI recommendation content / linkage
  NEW.recommendation_text := OLD.recommendation_text;
  NEW.priority := OLD.priority;
  NEW.category := OLD.category;
  NEW.assessment_id := OLD.assessment_id;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_recommendation_inserts_trg ON public.recommendations;
CREATE TRIGGER protect_recommendation_inserts_trg
  BEFORE INSERT OR UPDATE ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_recommendation_inserts();
