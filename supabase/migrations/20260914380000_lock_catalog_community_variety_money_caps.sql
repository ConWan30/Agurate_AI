-- Catalog metric invent locks; complete community/variety freezes;
-- money upper caps; peer/success/testimonial UPDATE freezes.

-- ---------------------------------------------------------------------------
-- Money / metric upper honesty caps
-- ---------------------------------------------------------------------------

UPDATE public.critical_alerts
SET estimated_loss_usd = NULL
WHERE estimated_loss_usd IS NOT NULL AND estimated_loss_usd > 10000000;

ALTER TABLE public.critical_alerts
  DROP CONSTRAINT IF EXISTS critical_alerts_estimated_loss_usd_upper_check;
ALTER TABLE public.critical_alerts
  ADD CONSTRAINT critical_alerts_estimated_loss_usd_upper_check
  CHECK (estimated_loss_usd IS NULL OR estimated_loss_usd <= 10000000);

UPDATE public.community_insights
SET savings_achieved = NULL
WHERE savings_achieved IS NOT NULL AND savings_achieved > 10000000;

ALTER TABLE public.community_insights
  DROP CONSTRAINT IF EXISTS community_insights_savings_achieved_upper_check;
ALTER TABLE public.community_insights
  ADD CONSTRAINT community_insights_savings_achieved_upper_check
  CHECK (savings_achieved IS NULL OR savings_achieved <= 10000000);

UPDATE public.dirt_referral_metrics
SET water_savings = NULL
WHERE water_savings IS NOT NULL AND water_savings > 100000000;

ALTER TABLE public.dirt_referral_metrics
  DROP CONSTRAINT IF EXISTS dirt_referral_metrics_water_savings_upper_check;
ALTER TABLE public.dirt_referral_metrics
  ADD CONSTRAINT dirt_referral_metrics_water_savings_upper_check
  CHECK (water_savings IS NULL OR water_savings <= 100000000);

UPDATE public.farmer_testimonials
SET roi_achieved = NULL
WHERE roi_achieved IS NOT NULL AND roi_achieved > 10000000;

ALTER TABLE public.farmer_testimonials
  DROP CONSTRAINT IF EXISTS farmer_testimonials_roi_achieved_upper_check;
ALTER TABLE public.farmer_testimonials
  ADD CONSTRAINT farmer_testimonials_roi_achieved_upper_check
  CHECK (roi_achieved IS NULL OR roi_achieved <= 10000000);

UPDATE public.best_practices_network
SET average_savings = NULL
WHERE average_savings IS NOT NULL AND average_savings > 10000000;

ALTER TABLE public.best_practices_network
  DROP CONSTRAINT IF EXISTS best_practices_network_average_savings_upper_check;
ALTER TABLE public.best_practices_network
  ADD CONSTRAINT best_practices_network_average_savings_upper_check
  CHECK (average_savings IS NULL OR average_savings <= 10000000);

UPDATE public.conservation_adoption_metrics
SET average_savings = NULL
WHERE average_savings IS NOT NULL AND average_savings > 10000000;

ALTER TABLE public.conservation_adoption_metrics
  DROP CONSTRAINT IF EXISTS conservation_adoption_metrics_average_savings_upper_check;
ALTER TABLE public.conservation_adoption_metrics
  ADD CONSTRAINT conservation_adoption_metrics_average_savings_upper_check
  CHECK (average_savings IS NULL OR average_savings <= 10000000);

UPDATE public.lsu_publications
SET impact_score = NULL
WHERE impact_score IS NOT NULL
  AND (impact_score < 0 OR impact_score > 100);

ALTER TABLE public.lsu_publications
  DROP CONSTRAINT IF EXISTS lsu_publications_impact_score_check;
ALTER TABLE public.lsu_publications
  ADD CONSTRAINT lsu_publications_impact_score_check
  CHECK (
    impact_score IS NULL
    OR (impact_score >= 0 AND impact_score <= 100)
  );

-- ---------------------------------------------------------------------------
-- Catalog tables: reject client INSERT; freeze invent columns on UPDATE
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS reject_client_insert_best_practices_network_trg
  ON public.best_practices_network;
CREATE TRIGGER reject_client_insert_best_practices_network_trg
  BEFORE INSERT ON public.best_practices_network
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_conservation_adoption_metrics_trg
  ON public.conservation_adoption_metrics;
CREATE TRIGGER reject_client_insert_conservation_adoption_metrics_trg
  BEFORE INSERT ON public.conservation_adoption_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

DROP TRIGGER IF EXISTS reject_client_insert_lsu_publications_trg
  ON public.lsu_publications;
CREATE TRIGGER reject_client_insert_lsu_publications_trg
  BEFORE INSERT ON public.lsu_publications
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_client_ai_metric_insert();

CREATE OR REPLACE FUNCTION public.protect_best_practices_network_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.practice_name := OLD.practice_name;
  NEW.description := OLD.description;
  NEW.average_savings := OLD.average_savings;
  NEW.success_rate := OLD.success_rate;
  NEW.adoption_count := OLD.adoption_count;
  NEW.lsu_research_basis := OLD.lsu_research_basis;
  NEW.lsu_researcher_id := OLD.lsu_researcher_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_best_practices_network_columns_trg
  ON public.best_practices_network;
CREATE TRIGGER protect_best_practices_network_columns_trg
  BEFORE UPDATE ON public.best_practices_network
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_best_practices_network_columns();

CREATE OR REPLACE FUNCTION public.protect_conservation_adoption_metrics_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.practice_type := OLD.practice_type;
  NEW.average_savings := OLD.average_savings;
  NEW.lsu_validation_score := OLD.lsu_validation_score;
  NEW.total_acres := OLD.total_acres;
  NEW.total_adopters := OLD.total_adopters;
  NEW.last_updated := OLD.last_updated;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_conservation_adoption_metrics_columns_trg
  ON public.conservation_adoption_metrics;
CREATE TRIGGER protect_conservation_adoption_metrics_columns_trg
  BEFORE UPDATE ON public.conservation_adoption_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_conservation_adoption_metrics_columns();

CREATE OR REPLACE FUNCTION public.protect_lsu_publication_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  NEW.title := OLD.title;
  NEW.authors := OLD.authors;
  NEW.year := OLD.year;
  NEW.url := OLD.url;
  NEW.crops := OLD.crops;
  NEW.topics := OLD.topics;
  NEW.key_findings := OLD.key_findings;
  NEW.impact_score := OLD.impact_score;
  NEW.farmer_views := OLD.farmer_views;
  NEW.researcher_id := OLD.researcher_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_lsu_publication_columns_trg ON public.lsu_publications;
CREATE TRIGGER protect_lsu_publication_columns_trg
  BEFORE UPDATE ON public.lsu_publications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_lsu_publication_columns();

-- ---------------------------------------------------------------------------
-- community_insights: freeze invent columns on client UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_community_insight_lsu_validation()
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
  NEW.savings_achieved := OLD.savings_achieved;
  NEW.community_rating := OLD.community_rating;
  NEW.practice := OLD.practice;
  NEW.outcome := OLD.outcome;
  NEW.insight_type := OLD.insight_type;
  NEW.field_id := OLD.field_id;
  NEW.farmer_id := OLD.farmer_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_community_insight_lsu_validation_trg ON public.community_insights;
CREATE TRIGGER protect_community_insight_lsu_validation_trg
  BEFORE INSERT OR UPDATE ON public.community_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_community_insight_lsu_validation();

-- ---------------------------------------------------------------------------
-- variety_performance_metrics: freeze scores on client UPDATE
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_variety_performance_metrics_columns()
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
  NEW.variety_name := OLD.variety_name;
  NEW.crop_type := OLD.crop_type;
  NEW.performance_score := OLD.performance_score;
  NEW.disease_resistance := OLD.disease_resistance;
  NEW.yield_performance := OLD.yield_performance;
  NEW.input_efficiency := OLD.input_efficiency;
  NEW.lsu_variety := OLD.lsu_variety;
  NEW.lsu_researcher_id := OLD.lsu_researcher_id;
  NEW.created_at := OLD.created_at;
  NEW.id := OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_variety_performance_metrics_columns_trg
  ON public.variety_performance_metrics;
CREATE TRIGGER protect_variety_performance_metrics_columns_trg
  BEFORE UPDATE ON public.variety_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_variety_performance_metrics_columns();

-- ---------------------------------------------------------------------------
-- success_stories / farmer_testimonials / peer outcomes: UPDATE freezes
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
  BEFORE UPDATE ON public.success_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_success_story_money_columns();

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

DROP POLICY IF EXISTS "Users can update their own treatment outcomes"
  ON public.peer_treatment_outcomes;

CREATE OR REPLACE FUNCTION public.protect_peer_treatment_outcome_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
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
  BEFORE UPDATE ON public.peer_treatment_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_peer_treatment_outcome_metrics();
