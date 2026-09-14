-- Coop alert field ownership on INSERT; expert consultation field↔assessment match;
-- dirt referral score/savings CHECKs; predictive lsu_validation freeze;
-- critical loss / catalog / testimonial money honesty.

-- ---------------------------------------------------------------------------
-- cooperative_alerts: admin INSERT may only attach owned (or null) field_id
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Cooperative admins can create alerts" ON public.cooperative_alerts;
DROP POLICY IF EXISTS "Admins can create cooperative alerts" ON public.cooperative_alerts;

CREATE POLICY "Cooperative admins can create alerts for owned fields"
  ON public.cooperative_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_cooperative_admin(cooperative_id, auth.uid())
    AND (
      field_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.fields f
        WHERE f.id = cooperative_alerts.field_id
          AND f.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- expert_consultations: when both set, assessment must belong to same field
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers can create consultations for own fields"
  ON public.expert_consultations;

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
          AND (
            expert_consultations.field_id IS NULL
            OR a.field_id = expert_consultations.field_id
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- dirt_referral_metrics: score 0–1, savings >= 0 (RPC insert path preserved)
-- ---------------------------------------------------------------------------

UPDATE public.dirt_referral_metrics
SET water_stress_score = GREATEST(0, LEAST(1, water_stress_score))
WHERE water_stress_score < 0 OR water_stress_score > 1;

UPDATE public.dirt_referral_metrics
SET water_savings = NULL
WHERE water_savings IS NOT NULL AND water_savings < 0;

ALTER TABLE public.dirt_referral_metrics
  DROP CONSTRAINT IF EXISTS dirt_referral_metrics_water_stress_score_check;
ALTER TABLE public.dirt_referral_metrics
  ADD CONSTRAINT dirt_referral_metrics_water_stress_score_check
  CHECK (water_stress_score >= 0 AND water_stress_score <= 1);

ALTER TABLE public.dirt_referral_metrics
  DROP CONSTRAINT IF EXISTS dirt_referral_metrics_water_savings_check;
ALTER TABLE public.dirt_referral_metrics
  ADD CONSTRAINT dirt_referral_metrics_water_savings_check
  CHECK (water_savings IS NULL OR water_savings >= 0);

CREATE OR REPLACE FUNCTION public.protect_dirt_referral_ai_columns()
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
    NEW.field_id := OLD.field_id;
    NEW.water_stress_score := OLD.water_stress_score;
    NEW.water_savings := OLD.water_savings;
    NEW.lsu_researcher_id := OLD.lsu_researcher_id;
    NEW.created_at := OLD.created_at;
    NEW.id := OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_dirt_referral_ai_columns_trg ON public.dirt_referral_metrics;
CREATE TRIGGER protect_dirt_referral_ai_columns_trg
  BEFORE UPDATE ON public.dirt_referral_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_dirt_referral_ai_columns();

-- ---------------------------------------------------------------------------
-- predictive_models.lsu_validation: clients cannot invent research badge
-- ---------------------------------------------------------------------------

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
    NEW.lsu_validation := false;
    RETURN NEW;
  END IF;

  NEW.lsu_validation := OLD.lsu_validation;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_predictive_model_lsu_validation_trg ON public.predictive_models;
CREATE TRIGGER protect_predictive_model_lsu_validation_trg
  BEFORE INSERT OR UPDATE ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_predictive_model_lsu_validation();

-- ---------------------------------------------------------------------------
-- critical_alerts.estimated_loss_usd >= 0
-- ---------------------------------------------------------------------------

UPDATE public.critical_alerts
SET estimated_loss_usd = NULL
WHERE estimated_loss_usd IS NOT NULL AND estimated_loss_usd < 0;

ALTER TABLE public.critical_alerts
  DROP CONSTRAINT IF EXISTS critical_alerts_estimated_loss_usd_check;
ALTER TABLE public.critical_alerts
  ADD CONSTRAINT critical_alerts_estimated_loss_usd_check
  CHECK (estimated_loss_usd IS NULL OR estimated_loss_usd >= 0);

-- ---------------------------------------------------------------------------
-- best_practices_network + conservation_adoption_metrics honesty CHECKs
-- ---------------------------------------------------------------------------

UPDATE public.best_practices_network
SET average_savings = NULL
WHERE average_savings IS NOT NULL AND average_savings < 0;

UPDATE public.best_practices_network
SET success_rate = NULL
WHERE success_rate IS NOT NULL
  AND (success_rate < 0 OR success_rate > 1);

UPDATE public.best_practices_network
SET adoption_count = GREATEST(0, adoption_count)
WHERE adoption_count IS NOT NULL AND adoption_count < 0;

ALTER TABLE public.best_practices_network
  DROP CONSTRAINT IF EXISTS best_practices_network_average_savings_check;
ALTER TABLE public.best_practices_network
  ADD CONSTRAINT best_practices_network_average_savings_check
  CHECK (average_savings IS NULL OR average_savings >= 0);

ALTER TABLE public.best_practices_network
  DROP CONSTRAINT IF EXISTS best_practices_network_success_rate_check;
ALTER TABLE public.best_practices_network
  ADD CONSTRAINT best_practices_network_success_rate_check
  CHECK (success_rate IS NULL OR (success_rate >= 0 AND success_rate <= 1));

ALTER TABLE public.best_practices_network
  DROP CONSTRAINT IF EXISTS best_practices_network_adoption_count_check;
ALTER TABLE public.best_practices_network
  ADD CONSTRAINT best_practices_network_adoption_count_check
  CHECK (adoption_count IS NULL OR adoption_count >= 0);

UPDATE public.conservation_adoption_metrics
SET average_savings = NULL
WHERE average_savings IS NOT NULL AND average_savings < 0;

UPDATE public.conservation_adoption_metrics
SET lsu_validation_score = NULL
WHERE lsu_validation_score IS NOT NULL
  AND (lsu_validation_score < 0 OR lsu_validation_score > 1);

UPDATE public.conservation_adoption_metrics
SET total_acres = NULL
WHERE total_acres IS NOT NULL AND total_acres < 0;

UPDATE public.conservation_adoption_metrics
SET total_adopters = GREATEST(0, total_adopters)
WHERE total_adopters IS NOT NULL AND total_adopters < 0;

ALTER TABLE public.conservation_adoption_metrics
  DROP CONSTRAINT IF EXISTS conservation_adoption_metrics_average_savings_check;
ALTER TABLE public.conservation_adoption_metrics
  ADD CONSTRAINT conservation_adoption_metrics_average_savings_check
  CHECK (average_savings IS NULL OR average_savings >= 0);

ALTER TABLE public.conservation_adoption_metrics
  DROP CONSTRAINT IF EXISTS conservation_adoption_metrics_lsu_validation_score_check;
ALTER TABLE public.conservation_adoption_metrics
  ADD CONSTRAINT conservation_adoption_metrics_lsu_validation_score_check
  CHECK (
    lsu_validation_score IS NULL
    OR (lsu_validation_score >= 0 AND lsu_validation_score <= 1)
  );

ALTER TABLE public.conservation_adoption_metrics
  DROP CONSTRAINT IF EXISTS conservation_adoption_metrics_total_acres_check;
ALTER TABLE public.conservation_adoption_metrics
  ADD CONSTRAINT conservation_adoption_metrics_total_acres_check
  CHECK (total_acres IS NULL OR total_acres >= 0);

ALTER TABLE public.conservation_adoption_metrics
  DROP CONSTRAINT IF EXISTS conservation_adoption_metrics_total_adopters_check;
ALTER TABLE public.conservation_adoption_metrics
  ADD CONSTRAINT conservation_adoption_metrics_total_adopters_check
  CHECK (total_adopters IS NULL OR total_adopters >= 0);

-- ---------------------------------------------------------------------------
-- farmer_testimonials: roi >= 0; clients cannot self-approve
-- ---------------------------------------------------------------------------

UPDATE public.farmer_testimonials
SET roi_achieved = NULL
WHERE roi_achieved IS NOT NULL AND roi_achieved < 0;

ALTER TABLE public.farmer_testimonials
  DROP CONSTRAINT IF EXISTS farmer_testimonials_roi_achieved_check;
ALTER TABLE public.farmer_testimonials
  ADD CONSTRAINT farmer_testimonials_roi_achieved_check
  CHECK (roi_achieved IS NULL OR roi_achieved >= 0);

CREATE OR REPLACE FUNCTION public.protect_farmer_testimonial_approval()
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
    NEW.approved := false;
    RETURN NEW;
  END IF;

  NEW.approved := OLD.approved;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_farmer_testimonial_approval_trg ON public.farmer_testimonials;
CREATE TRIGGER protect_farmer_testimonial_approval_trg
  BEFORE INSERT OR UPDATE ON public.farmer_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_farmer_testimonial_approval();
