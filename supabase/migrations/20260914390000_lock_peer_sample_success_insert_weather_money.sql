-- Peer comparison sample honesty; strip success/testimonial money invent on
-- client INSERT; coop alert acres upper cap; weather parish DEFAULT drop +
-- client INSERT reject.

-- ---------------------------------------------------------------------------
-- get_peer_comparison: require >=3 distinct farmers; exclude caller's rows
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_peer_comparison(
  p_field_id UUID,
  p_crop_type TEXT,
  p_problem TEXT
)
RETURNS TABLE(
  treatment_type TEXT,
  success_rate NUMERIC,
  avg_effectiveness INTEGER,
  sample_size BIGINT
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
    COUNT(*) AS sample_size
  FROM public.peer_treatment_outcomes pto
  WHERE
    pto.crop_type = p_crop_type
    AND pto.problem_addressed ILIKE '%' || p_problem || '%'
    AND pto.farmer_id IS DISTINCT FROM auth.uid()
  GROUP BY pto.treatment_type
  HAVING COUNT(DISTINCT pto.farmer_id) >= 3
  ORDER BY success_rate DESC
  LIMIT 5;
END;
$$;

-- ---------------------------------------------------------------------------
-- success_stories: strip money invent on client INSERT (moderator/service sets)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_success_story_money_columns()
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
    NEW.estimated_savings := NULL;
    NEW.acres_protected := NULL;
    RETURN NEW;
  END IF;

  NEW.estimated_savings := OLD.estimated_savings;
  NEW.acres_protected := OLD.acres_protected;
  NEW.assessment_id := OLD.assessment_id;
  NEW.user_id := OLD.user_id;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_success_story_money_columns_trg ON public.success_stories;
CREATE TRIGGER protect_success_story_money_columns_trg
  BEFORE INSERT OR UPDATE ON public.success_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_success_story_money_columns();

-- ---------------------------------------------------------------------------
-- farmer_testimonials: strip ROI invent on client INSERT
-- ---------------------------------------------------------------------------

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
    NEW.roi_achieved := NULL;
    RETURN NEW;
  END IF;

  NEW.approved := OLD.approved;
  NEW.roi_achieved := OLD.roi_achieved;
  NEW.farmer_name := OLD.farmer_name;
  NEW.testimonial_text := OLD.testimonial_text;
  NEW.farm_location := OLD.farm_location;
  NEW.feature_mentioned := OLD.feature_mentioned;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_farmer_testimonial_approval_trg ON public.farmer_testimonials;
CREATE TRIGGER protect_farmer_testimonial_approval_trg
  BEFORE INSERT OR UPDATE ON public.farmer_testimonials
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_farmer_testimonial_approval();

-- ---------------------------------------------------------------------------
-- cooperative_alerts.affected_area_acres: upper honesty cap
-- ---------------------------------------------------------------------------

UPDATE public.cooperative_alerts
SET affected_area_acres = NULL
WHERE affected_area_acres IS NOT NULL AND affected_area_acres > 100000;

ALTER TABLE public.cooperative_alerts
  DROP CONSTRAINT IF EXISTS cooperative_alerts_affected_area_acres_upper_check;
ALTER TABLE public.cooperative_alerts
  ADD CONSTRAINT cooperative_alerts_affected_area_acres_upper_check
  CHECK (affected_area_acres IS NULL OR affected_area_acres <= 100000);

-- ---------------------------------------------------------------------------
-- weather_events: drop parish DEFAULT invent; reject client INSERT
-- ---------------------------------------------------------------------------

ALTER TABLE public.weather_events
  ALTER COLUMN location_lat DROP DEFAULT;
ALTER TABLE public.weather_events
  ALTER COLUMN location_lng DROP DEFAULT;

DROP TRIGGER IF EXISTS reject_client_insert_weather_events_trg ON public.weather_events;
CREATE TRIGGER reject_client_insert_weather_events_trg
  BEFORE INSERT ON public.weather_events
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();
