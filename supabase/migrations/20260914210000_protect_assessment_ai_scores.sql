-- Assessments health/AI scores must only be written by service_role (analyze-crop).
-- Clients previously could INSERT arbitrary health_score / stress_level via field-owner RLS.

CREATE OR REPLACE FUNCTION public.protect_assessment_ai_scores()
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
      'assessments with AI scores may only be created by trusted backends'
      USING ERRCODE = '42501';
  END IF;

  -- Freeze AI-derived columns on client UPDATE (defense in depth; no UPDATE policy today)
  NEW.health_score := OLD.health_score;
  NEW.stress_level := OLD.stress_level;
  NEW.confidence_score := OLD.confidence_score;
  NEW.symptoms := OLD.symptoms;
  NEW.growth_stage := OLD.growth_stage;
  NEW.disease_identified := OLD.disease_identified;
  NEW.pest_identified := OLD.pest_identified;
  NEW.nutrient_deficiencies := OLD.nutrient_deficiencies;
  NEW.severity_ratings := OLD.severity_ratings;
  NEW.field_uniformity_score := OLD.field_uniformity_score;
  NEW.estimated_yield_impact_percent := OLD.estimated_yield_impact_percent;
  NEW.canopy_coverage_percent := OLD.canopy_coverage_percent;
  NEW.plant_density_assessment := OLD.plant_density_assessment;
  NEW.root_health_indicators := OLD.root_health_indicators;
  NEW.detailed_visual_analysis := OLD.detailed_visual_analysis;
  NEW.weather_temp_f := OLD.weather_temp_f;
  NEW.weather_precipitation_mm := OLD.weather_precipitation_mm;
  NEW.analyzed_at := OLD.analyzed_at;
  NEW.field_id := OLD.field_id;
  NEW.image_url := OLD.image_url;
  NEW.id := OLD.id;
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_assessment_ai_scores_trg ON public.assessments;
CREATE TRIGGER protect_assessment_ai_scores_trg
  BEFORE INSERT OR UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_assessment_ai_scores();

-- Drop client INSERT policies; service_role bypasses RLS for analyze-crop persistence.
DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.recommendations;

-- Recommendations are AI output tied to assessments — clients must not invent them.
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_recommendation_inserts_trg ON public.recommendations;
CREATE TRIGGER protect_recommendation_inserts_trg
  BEFORE INSERT ON public.recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_recommendation_inserts();
