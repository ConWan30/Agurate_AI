-- Lock AI/system metric tables to service_role writes.
-- Field-owner INSERT policies from 20260914030000 still allowed forging
-- stress scores, predictions, alerts, and intelligence-pool rows via PostgREST.

-- ---------------------------------------------------------------------------
-- Drop client INSERT (and broad UPDATE) policies on AI metric tables
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert critical alerts for own fields" ON public.critical_alerts;

DROP POLICY IF EXISTS "Users can insert conservation predictions for own fields" ON public.conservation_predictions;

DROP POLICY IF EXISTS "Users can insert water stress events for own fields" ON public.water_stress_events;
DROP POLICY IF EXISTS "Users can update water stress events for own fields" ON public.water_stress_events;

DROP POLICY IF EXISTS "Users can insert variety metrics for own fields" ON public.variety_performance_metrics;
DROP POLICY IF EXISTS "Users can insert variety recommendations for own fields" ON public.variety_recommendations;

DROP POLICY IF EXISTS "Users can insert predictive models for own fields" ON public.predictive_models;

DROP POLICY IF EXISTS "Users can insert analytics insights for own fields" ON public.analytics_insights;

DROP POLICY IF EXISTS "Users can insert dirt referrals for own fields" ON public.dirt_referral_metrics;

DROP POLICY IF EXISTS "Users can insert AI intelligence pool for own fields" ON public.ai_intelligence_pool;
DROP POLICY IF EXISTS "Users can update AI intelligence pool for own fields" ON public.ai_intelligence_pool;

-- Community insights: farmer INSERT was never locked in 20260914030000
DROP POLICY IF EXISTS "System can create community insights" ON public.community_insights;

-- ---------------------------------------------------------------------------
-- Water stress / DIRT: clients flip dirt_clicked via RPC only (no score rewrites)
-- ---------------------------------------------------------------------------

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

  INSERT INTO public.dirt_referral_metrics (field_id, water_stress_score, dirt_clicked)
  VALUES (owned_field_id, owned_stress_score, true);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_water_stress_dirt_clicked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_water_stress_dirt_clicked(uuid) TO authenticated;

-- Defense in depth: freeze AI columns if a broad UPDATE policy is re-added later
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

-- ---------------------------------------------------------------------------
-- Defense in depth: reject client INSERTs on core AI metric tables
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_client_ai_metric_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    '% rows may only be created by trusted backends', TG_TABLE_NAME
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS reject_client_insert_critical_alerts_trg ON public.critical_alerts;
CREATE TRIGGER reject_client_insert_critical_alerts_trg
  BEFORE INSERT ON public.critical_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_conservation_predictions_trg ON public.conservation_predictions;
CREATE TRIGGER reject_client_insert_conservation_predictions_trg
  BEFORE INSERT ON public.conservation_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_predictive_models_trg ON public.predictive_models;
CREATE TRIGGER reject_client_insert_predictive_models_trg
  BEFORE INSERT ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_variety_recommendations_trg ON public.variety_recommendations;
CREATE TRIGGER reject_client_insert_variety_recommendations_trg
  BEFORE INSERT ON public.variety_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_variety_performance_metrics_trg ON public.variety_performance_metrics;
CREATE TRIGGER reject_client_insert_variety_performance_metrics_trg
  BEFORE INSERT ON public.variety_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_analytics_insights_trg ON public.analytics_insights;
CREATE TRIGGER reject_client_insert_analytics_insights_trg
  BEFORE INSERT ON public.analytics_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

-- dirt_referral_metrics: no reject trigger — SECURITY DEFINER RPC
-- mark_water_stress_dirt_clicked inserts referral rows after RLS policy drop.

DROP TRIGGER IF EXISTS reject_client_insert_ai_intelligence_pool_trg ON public.ai_intelligence_pool;
CREATE TRIGGER reject_client_insert_ai_intelligence_pool_trg
  BEFORE INSERT ON public.ai_intelligence_pool
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_community_insights_trg ON public.community_insights;
CREATE TRIGGER reject_client_insert_community_insights_trg
  BEFORE INSERT ON public.community_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();
