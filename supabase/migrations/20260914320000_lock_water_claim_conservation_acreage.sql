-- Align water-stress severity with edge allowlist; freeze claim content after draft;
-- conservation prediction numeric CHECKs; profiles.total_acreage >= 0.

-- ---------------------------------------------------------------------------
-- water_stress_events: severity allowlist + 0–1 score/confidence
-- ---------------------------------------------------------------------------

UPDATE public.water_stress_events
SET severity = 'unknown'
WHERE severity IS NOT NULL
  AND lower(severity) NOT IN (
    'none', 'mild', 'moderate', 'severe', 'critical', 'unknown'
  );

UPDATE public.water_stress_events
SET stress_score = NULL
WHERE stress_score IS NOT NULL
  AND (stress_score < 0 OR stress_score > 1);

UPDATE public.water_stress_events
SET confidence = NULL
WHERE confidence IS NOT NULL
  AND (confidence < 0 OR confidence > 1);

ALTER TABLE public.water_stress_events
  DROP CONSTRAINT IF EXISTS water_stress_events_severity_check;

ALTER TABLE public.water_stress_events
  ADD CONSTRAINT water_stress_events_severity_check
  CHECK (
    severity IS NULL
    OR lower(severity) IN (
      'none', 'mild', 'moderate', 'severe', 'critical', 'unknown'
    )
  );

ALTER TABLE public.water_stress_events
  DROP CONSTRAINT IF EXISTS water_stress_events_stress_score_check;

ALTER TABLE public.water_stress_events
  ADD CONSTRAINT water_stress_events_stress_score_check
  CHECK (stress_score IS NULL OR (stress_score >= 0 AND stress_score <= 1));

ALTER TABLE public.water_stress_events
  DROP CONSTRAINT IF EXISTS water_stress_events_confidence_check;

ALTER TABLE public.water_stress_events
  ADD CONSTRAINT water_stress_events_confidence_check
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));

-- ---------------------------------------------------------------------------
-- insurance_claims: freeze content invent after leaving draft
-- ---------------------------------------------------------------------------

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
    -- After draft, clients cannot invent claim content
    NEW.estimated_loss_percentage := OLD.estimated_loss_percentage;
    NEW.event_type := OLD.event_type;
    NEW.event_date := OLD.event_date;
    NEW.description := OLD.description;
    NEW.notes := OLD.notes;
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
-- conservation_predictions: impact 0–100, factors/confidence 0–1
-- ---------------------------------------------------------------------------

UPDATE public.conservation_predictions
SET current_impact = NULL
WHERE current_impact IS NOT NULL
  AND (current_impact < 0 OR current_impact > 100);

UPDATE public.conservation_predictions
SET predicted_impact_1_year = NULL
WHERE predicted_impact_1_year IS NOT NULL
  AND (predicted_impact_1_year < 0 OR predicted_impact_1_year > 100);

UPDATE public.conservation_predictions
SET predicted_impact_5_year = NULL
WHERE predicted_impact_5_year IS NOT NULL
  AND (predicted_impact_5_year < 0 OR predicted_impact_5_year > 100);

UPDATE public.conservation_predictions
SET climate_factor = NULL
WHERE climate_factor IS NOT NULL
  AND (climate_factor < 0 OR climate_factor > 1);

UPDATE public.conservation_predictions
SET soil_health_improvement = NULL
WHERE soil_health_improvement IS NOT NULL
  AND (soil_health_improvement < 0 OR soil_health_improvement > 1);

UPDATE public.conservation_predictions
SET confidence_score = NULL
WHERE confidence_score IS NOT NULL
  AND (confidence_score < 0 OR confidence_score > 1);

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_current_impact_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_current_impact_check
  CHECK (current_impact IS NULL OR (current_impact >= 0 AND current_impact <= 100));

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_predicted_impact_1_year_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_predicted_impact_1_year_check
  CHECK (predicted_impact_1_year IS NULL OR (predicted_impact_1_year >= 0 AND predicted_impact_1_year <= 100));

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_predicted_impact_5_year_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_predicted_impact_5_year_check
  CHECK (predicted_impact_5_year IS NULL OR (predicted_impact_5_year >= 0 AND predicted_impact_5_year <= 100));

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_climate_factor_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_climate_factor_check
  CHECK (climate_factor IS NULL OR (climate_factor >= 0 AND climate_factor <= 1));

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_soil_health_improvement_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_soil_health_improvement_check
  CHECK (soil_health_improvement IS NULL OR (soil_health_improvement >= 0 AND soil_health_improvement <= 1));

ALTER TABLE public.conservation_predictions
  DROP CONSTRAINT IF EXISTS conservation_predictions_confidence_score_check;
ALTER TABLE public.conservation_predictions
  ADD CONSTRAINT conservation_predictions_confidence_score_check
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

-- ---------------------------------------------------------------------------
-- profiles.total_acreage: non-negative
-- ---------------------------------------------------------------------------

UPDATE public.profiles
SET total_acreage = NULL
WHERE total_acreage IS NOT NULL AND total_acreage < 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_total_acreage_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_total_acreage_check
  CHECK (total_acreage IS NULL OR total_acreage >= 0);
