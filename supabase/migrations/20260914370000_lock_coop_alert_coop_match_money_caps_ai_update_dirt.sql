-- Coop alert field must align with cooperative; money caps; AI metric UPDATE
-- freezes; expert link freeze; dirt INSERT reject with RPC GUC allow.

-- ---------------------------------------------------------------------------
-- cooperative_alerts: owned field must belong to the same cooperative
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Cooperative admins can create alerts for owned fields"
  ON public.cooperative_alerts;

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
          AND (
            f.cooperative_id = cooperative_alerts.cooperative_id
            OR (
              f.cooperative_id IS NULL
              AND public.is_cooperative_member(
                cooperative_alerts.cooperative_id,
                auth.uid()
              )
            )
          )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- success_stories / peer_treatment_outcomes: upper honesty caps
-- ---------------------------------------------------------------------------

UPDATE public.success_stories
SET estimated_savings = NULL
WHERE estimated_savings IS NOT NULL AND estimated_savings > 10000000;

UPDATE public.success_stories
SET acres_protected = NULL
WHERE acres_protected IS NOT NULL AND acres_protected > 100000;

ALTER TABLE public.success_stories
  DROP CONSTRAINT IF EXISTS success_stories_estimated_savings_upper_check;
ALTER TABLE public.success_stories
  ADD CONSTRAINT success_stories_estimated_savings_upper_check
  CHECK (estimated_savings IS NULL OR estimated_savings <= 10000000);

ALTER TABLE public.success_stories
  DROP CONSTRAINT IF EXISTS success_stories_acres_protected_upper_check;
ALTER TABLE public.success_stories
  ADD CONSTRAINT success_stories_acres_protected_upper_check
  CHECK (acres_protected IS NULL OR acres_protected <= 100000);

UPDATE public.peer_treatment_outcomes
SET cost_usd = NULL
WHERE cost_usd IS NOT NULL AND cost_usd > 1000000;

ALTER TABLE public.peer_treatment_outcomes
  DROP CONSTRAINT IF EXISTS peer_treatment_outcomes_cost_usd_upper_check;
ALTER TABLE public.peer_treatment_outcomes
  ADD CONSTRAINT peer_treatment_outcomes_cost_usd_upper_check
  CHECK (cost_usd IS NULL OR cost_usd <= 1000000);

-- ---------------------------------------------------------------------------
-- expert_consultations: freeze field_id / assessment_id on client UPDATE
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
    NEW.priority := 'medium';
    RETURN NEW;
  END IF;

  NEW.response := OLD.response;
  NEW.responded_at := OLD.responded_at;
  NEW.researcher_id := OLD.researcher_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.field_id := OLD.field_id;
  NEW.assessment_id := OLD.assessment_id;
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
-- AI metric tables: freeze invent columns on client UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_analytics_insight_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.field_id := OLD.field_id;
  NEW.insight_type := OLD.insight_type;
  NEW.insight_data := OLD.insight_data;
  NEW.actionable_recommendations := OLD.actionable_recommendations;
  NEW.lsu_research_basis := OLD.lsu_research_basis;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_analytics_insight_ai_columns_trg ON public.analytics_insights;
CREATE TRIGGER protect_analytics_insight_ai_columns_trg
  BEFORE UPDATE ON public.analytics_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_analytics_insight_ai_columns();

CREATE OR REPLACE FUNCTION public.protect_ai_intelligence_pool_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.field_id := OLD.field_id;
  NEW.community_patterns := OLD.community_patterns;
  NEW.confidence_scores := OLD.confidence_scores;
  NEW.conservation_effectiveness := OLD.conservation_effectiveness;
  NEW.image_analysis_patterns := OLD.image_analysis_patterns;
  NEW.predictive_insights := OLD.predictive_insights;
  NEW.variety_intelligence := OLD.variety_intelligence;
  NEW.weather_correlations := OLD.weather_correlations;
  NEW.snapshot_date := OLD.snapshot_date;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_ai_intelligence_pool_columns_trg ON public.ai_intelligence_pool;
CREATE TRIGGER protect_ai_intelligence_pool_columns_trg
  BEFORE UPDATE ON public.ai_intelligence_pool
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_ai_intelligence_pool_columns();

CREATE OR REPLACE FUNCTION public.protect_conservation_prediction_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.field_id := OLD.field_id;
  NEW.practice_type := OLD.practice_type;
  NEW.current_impact := OLD.current_impact;
  NEW.predicted_impact_1_year := OLD.predicted_impact_1_year;
  NEW.predicted_impact_5_year := OLD.predicted_impact_5_year;
  NEW.climate_factor := OLD.climate_factor;
  NEW.soil_health_improvement := OLD.soil_health_improvement;
  NEW.confidence_score := OLD.confidence_score;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conservation_prediction_ai_columns_trg
  ON public.conservation_predictions;
CREATE TRIGGER protect_conservation_prediction_ai_columns_trg
  BEFORE UPDATE ON public.conservation_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conservation_prediction_ai_columns();

CREATE OR REPLACE FUNCTION public.protect_variety_recommendation_ai_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.field_id := OLD.field_id;
  NEW.current_variety := OLD.current_variety;
  NEW.recommended_variety := OLD.recommended_variety;
  NEW.expected_improvement := OLD.expected_improvement;
  NEW.risk_assessment := OLD.risk_assessment;
  NEW.lsu_research_basis := OLD.lsu_research_basis;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_variety_recommendation_ai_columns_trg
  ON public.variety_recommendations;
CREATE TRIGGER protect_variety_recommendation_ai_columns_trg
  BEFORE UPDATE ON public.variety_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_variety_recommendation_ai_columns();

-- ---------------------------------------------------------------------------
-- dirt_referral_metrics: reject client INSERT unless RPC GUC allow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_client_dirt_referral_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.allow_dirt_referral_insert', true) = '1' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'dirt_referral_metrics may only be created by trusted backends or dirt click RPC'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS reject_client_dirt_referral_insert_trg ON public.dirt_referral_metrics;
CREATE TRIGGER reject_client_dirt_referral_insert_trg
  BEFORE INSERT ON public.dirt_referral_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_dirt_referral_insert();

CREATE OR REPLACE FUNCTION public.mark_water_stress_dirt_clicked(event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owned_field_id uuid;
  owned_stress_score numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT wse.field_id, wse.stress_score
  INTO owned_field_id, owned_stress_score
  FROM public.water_stress_events wse
  JOIN public.fields f ON f.id = wse.field_id
  WHERE wse.id = event_id
    AND f.user_id = auth.uid()
  FOR UPDATE OF wse;

  IF owned_field_id IS NULL THEN
    RAISE EXCEPTION 'Water stress event not found or not authorized';
  END IF;

  UPDATE public.water_stress_events
  SET dirt_clicked = true
  WHERE id = event_id;

  PERFORM set_config('app.allow_dirt_referral_insert', '1', true);

  INSERT INTO public.dirt_referral_metrics (field_id, water_stress_score, dirt_clicked)
  VALUES (owned_field_id, owned_stress_score, true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_water_stress_dirt_clicked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_water_stress_dirt_clicked(uuid) TO authenticated;
