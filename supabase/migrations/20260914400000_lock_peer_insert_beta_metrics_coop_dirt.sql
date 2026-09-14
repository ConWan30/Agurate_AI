-- Peer INSERT ownership/recommendation bind; peer RPC farmer_count;
-- beta_metrics fanout fix; coop alert INSERT status normalize;
-- dirt referral strip water_savings on GUC path.

-- ---------------------------------------------------------------------------
-- peer_treatment_outcomes: bind INSERT identity + recommendation ownership
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_peer_treatment_outcome_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owned_field uuid;
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

    SELECT f.id INTO owned_field
    FROM public.fields f
    WHERE f.id = NEW.field_id
      AND f.user_id = auth.uid();

    IF owned_field IS NULL THEN
      RAISE EXCEPTION 'peer_treatment_outcomes.field_id must be owned by the authenticated user'
        USING ERRCODE = '42501';
    END IF;

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

    RETURN NEW;
  END IF;

  NEW.effectiveness_score := OLD.effectiveness_score;
  NEW.cost_usd := OLD.cost_usd;
  NEW.outcome := OLD.outcome;
  NEW.field_id := OLD.field_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.recommendation_id := OLD.recommendation_id;
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

-- ---------------------------------------------------------------------------
-- get_peer_comparison: require linked recommendation; expose farmer_count
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.get_peer_comparison(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.get_peer_comparison(
  p_field_id UUID,
  p_crop_type TEXT,
  p_problem TEXT
)
RETURNS TABLE(
  treatment_type TEXT,
  success_rate NUMERIC,
  avg_effectiveness INTEGER,
  sample_size BIGINT,
  farmer_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE f.id = p_field_id
      AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    pto.treatment_type,
    ROUND(
      (COUNT(*) FILTER (WHERE pto.outcome = 'successful')::NUMERIC
        / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      1
    ) AS success_rate,
    ROUND(AVG(pto.effectiveness_score))::INTEGER AS avg_effectiveness,
    COUNT(*) AS sample_size,
    COUNT(DISTINCT pto.farmer_id) AS farmer_count
  FROM public.peer_treatment_outcomes pto
  WHERE
    pto.crop_type = p_crop_type
    AND pto.problem_addressed ILIKE '%' || p_problem || '%'
    AND pto.farmer_id IS DISTINCT FROM auth.uid()
    AND pto.recommendation_id IS NOT NULL
  GROUP BY pto.treatment_type
  HAVING COUNT(DISTINCT pto.farmer_id) >= 3
  ORDER BY success_rate DESC
  LIMIT 5;
END;
$$;

REVOKE ALL ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_peer_comparison(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- beta_metrics: stop join fanout invent of counts/ratings
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.beta_metrics
WITH (security_invoker = true)
AS
SELECT
  (SELECT COUNT(*)::bigint FROM public.profiles p WHERE p.beta_farmer = true)
    AS total_signups,
  (
    SELECT COUNT(DISTINCT p.id)::bigint
    FROM public.profiles p
    JOIN public.fields f ON f.user_id = p.id
    WHERE p.beta_farmer = true
      AND f.created_at > NOW() - INTERVAL '7 days'
  ) AS active_users_7d,
  (
    SELECT COUNT(DISTINCT p.id)::bigint
    FROM public.profiles p
    JOIN public.fields f ON f.user_id = p.id
    WHERE p.beta_farmer = true
      AND f.created_at > NOW() - INTERVAL '30 days'
  ) AS active_users_30d,
  (
    SELECT COUNT(*)::bigint
    FROM public.assessments a
    JOIN public.fields f ON f.id = a.field_id
    JOIN public.profiles p ON p.id = f.user_id
    WHERE p.beta_farmer = true
  ) AS total_assessments,
  (
    SELECT AVG(bf.rating)
    FROM public.beta_feedback bf
    JOIN public.profiles p ON p.id = bf.user_id
    WHERE p.beta_farmer = true
  ) AS avg_rating,
  (
    SELECT COUNT(*)::bigint
    FROM public.beta_feedback bf
    JOIN public.profiles p ON p.id = bf.user_id
    WHERE p.beta_farmer = true
  ) AS feedback_count,
  (
    SELECT COUNT(*)::bigint
    FROM public.profiles p
    WHERE p.beta_farmer = true
      AND p.onboarding_completed = true
  ) AS completed_onboarding,
  (
    SELECT COUNT(*)::bigint
    FROM public.success_stories ss
    JOIN public.profiles p ON p.id = ss.user_id
    WHERE p.beta_farmer = true
      AND ss.allow_public_use = true
      AND ss.approved = true
  ) AS public_success_stories;

GRANT SELECT ON public.beta_metrics TO authenticated;

-- ---------------------------------------------------------------------------
-- cooperative_alerts: client INSERT cannot invent resolved status
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_cooperative_alert_insert_status()
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
    NEW.status := 'active';
    NEW.resolved_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cooperative_alert_insert_status_trg
  ON public.cooperative_alerts;
CREATE TRIGGER protect_cooperative_alert_insert_status_trg
  BEFORE INSERT ON public.cooperative_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cooperative_alert_insert_status();

-- ---------------------------------------------------------------------------
-- dirt_referral_metrics: GUC path cannot invent water_savings
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
    -- Click RPC may insert a row, but never invent dollar/water savings.
    NEW.water_savings := NULL;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'dirt_referral_metrics may only be created by trusted backends or dirt click RPC'
    USING ERRCODE = '42501';
END;
$$;
