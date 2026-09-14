-- Freeze claim↔assessment / claim_number invent after draft; require owned assessment
-- links on claims & success stories; peer outcomes must own recommendation;
-- variety/prediction/water-stress metric honesty CHECKs + outcome_improvement freeze.

-- ---------------------------------------------------------------------------
-- insurance_claims: assessment must belong to claim field; freeze link after draft
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

  -- assessment_id must belong to the same field as the claim when set
  IF NEW.assessment_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.assessments a
      WHERE a.id = NEW.assessment_id
        AND a.field_id = NEW.field_id
    ) THEN
      RAISE EXCEPTION
        'insurance_claims.assessment_id must belong to the claim field'
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
    -- After draft, clients cannot invent claim content or linkage
    NEW.estimated_loss_percentage := OLD.estimated_loss_percentage;
    NEW.event_type := OLD.event_type;
    NEW.event_date := OLD.event_date;
    NEW.description := OLD.description;
    NEW.notes := OLD.notes;
    NEW.assessment_id := OLD.assessment_id;
    NEW.claim_number := OLD.claim_number;
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

DROP POLICY IF EXISTS "Users can create claims for own fields" ON public.insurance_claims;

CREATE POLICY "Users can create claims for own fields"
  ON public.insurance_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.id = insurance_claims.field_id
        AND f.user_id = auth.uid()
    )
    AND (
      assessment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.assessments a
        WHERE a.id = insurance_claims.assessment_id
          AND a.field_id = insurance_claims.field_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- success_stories: assessment_id must be owned by the inserting user
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create stories" ON public.success_stories;

CREATE POLICY "Users can create stories"
  ON public.success_stories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      assessment_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.assessments a
        JOIN public.fields f ON f.id = a.field_id
        WHERE a.id = success_stories.assessment_id
          AND f.user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes: recommendation must be owned (same field)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Farmers can insert treatment outcomes for own fields"
  ON public.peer_treatment_outcomes;

CREATE POLICY "Farmers can insert treatment outcomes for own fields"
  ON public.peer_treatment_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    farmer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.fields f
      WHERE f.id = peer_treatment_outcomes.field_id
        AND f.user_id = auth.uid()
    )
    AND (
      recommendation_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.recommendations r
        JOIN public.assessments a ON a.id = r.assessment_id
        WHERE r.id = peer_treatment_outcomes.recommendation_id
          AND a.field_id = peer_treatment_outcomes.field_id
      )
    )
  );

-- ---------------------------------------------------------------------------
-- variety_performance_metrics: scores must be 0–1
-- ---------------------------------------------------------------------------

UPDATE public.variety_performance_metrics
SET performance_score = GREATEST(0, LEAST(1, performance_score))
WHERE performance_score < 0 OR performance_score > 1;

UPDATE public.variety_performance_metrics
SET disease_resistance = GREATEST(0, LEAST(1, disease_resistance))
WHERE disease_resistance < 0 OR disease_resistance > 1;

UPDATE public.variety_performance_metrics
SET yield_performance = GREATEST(0, LEAST(1, yield_performance))
WHERE yield_performance < 0 OR yield_performance > 1;

UPDATE public.variety_performance_metrics
SET input_efficiency = GREATEST(0, LEAST(1, input_efficiency))
WHERE input_efficiency < 0 OR input_efficiency > 1;

ALTER TABLE public.variety_performance_metrics
  DROP CONSTRAINT IF EXISTS variety_performance_metrics_performance_score_check;
ALTER TABLE public.variety_performance_metrics
  ADD CONSTRAINT variety_performance_metrics_performance_score_check
  CHECK (performance_score >= 0 AND performance_score <= 1);

ALTER TABLE public.variety_performance_metrics
  DROP CONSTRAINT IF EXISTS variety_performance_metrics_disease_resistance_check;
ALTER TABLE public.variety_performance_metrics
  ADD CONSTRAINT variety_performance_metrics_disease_resistance_check
  CHECK (disease_resistance >= 0 AND disease_resistance <= 1);

ALTER TABLE public.variety_performance_metrics
  DROP CONSTRAINT IF EXISTS variety_performance_metrics_yield_performance_check;
ALTER TABLE public.variety_performance_metrics
  ADD CONSTRAINT variety_performance_metrics_yield_performance_check
  CHECK (yield_performance >= 0 AND yield_performance <= 1);

ALTER TABLE public.variety_performance_metrics
  DROP CONSTRAINT IF EXISTS variety_performance_metrics_input_efficiency_check;
ALTER TABLE public.variety_performance_metrics
  ADD CONSTRAINT variety_performance_metrics_input_efficiency_check
  CHECK (input_efficiency >= 0 AND input_efficiency <= 1);

-- ---------------------------------------------------------------------------
-- prediction_outcomes.accuracy_achieved: 0–1 honesty
-- ---------------------------------------------------------------------------

UPDATE public.prediction_outcomes
SET accuracy_achieved = GREATEST(0, LEAST(1, accuracy_achieved))
WHERE accuracy_achieved < 0 OR accuracy_achieved > 1;

ALTER TABLE public.prediction_outcomes
  DROP CONSTRAINT IF EXISTS prediction_outcomes_accuracy_achieved_check;

ALTER TABLE public.prediction_outcomes
  ADD CONSTRAINT prediction_outcomes_accuracy_achieved_check
  CHECK (accuracy_achieved >= 0 AND accuracy_achieved <= 1);

-- ---------------------------------------------------------------------------
-- water_stress_events.outcome_improvement: freeze + 0–1 CHECK
-- ---------------------------------------------------------------------------

UPDATE public.water_stress_events
SET outcome_improvement = NULL
WHERE outcome_improvement IS NOT NULL
  AND (outcome_improvement < 0 OR outcome_improvement > 1);

ALTER TABLE public.water_stress_events
  DROP CONSTRAINT IF EXISTS water_stress_events_outcome_improvement_check;

ALTER TABLE public.water_stress_events
  ADD CONSTRAINT water_stress_events_outcome_improvement_check
  CHECK (
    outcome_improvement IS NULL
    OR (outcome_improvement >= 0 AND outcome_improvement <= 1)
  );

CREATE OR REPLACE FUNCTION public.protect_water_stress_ai_columns()
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
      'water_stress_events may only be created by trusted backends'
      USING ERRCODE = '42501';
  END IF;

  -- Clients may only change dirt_clicked (and dirt_recommendation / irrigation flags if present)
  NEW.field_id := OLD.field_id;
  NEW.assessment_id := OLD.assessment_id;
  NEW.stress_score := OLD.stress_score;
  NEW.severity := OLD.severity;
  NEW.symptoms_detected := OLD.symptoms_detected;
  NEW.confidence := OLD.confidence;
  NEW.weather_context := OLD.weather_context;
  NEW.outcome_improvement := OLD.outcome_improvement;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_water_stress_ai_columns_trg ON public.water_stress_events;
CREATE TRIGGER protect_water_stress_ai_columns_trg
  BEFORE INSERT OR UPDATE ON public.water_stress_events
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_water_stress_ai_columns();
