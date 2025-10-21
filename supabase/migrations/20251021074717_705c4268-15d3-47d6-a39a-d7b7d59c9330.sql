-- Add enhanced analytical fields to assessments table
ALTER TABLE public.assessments
ADD COLUMN IF NOT EXISTS growth_stage TEXT,
ADD COLUMN IF NOT EXISTS disease_identified TEXT[],
ADD COLUMN IF NOT EXISTS pest_identified TEXT[],
ADD COLUMN IF NOT EXISTS nutrient_deficiencies JSONB,
ADD COLUMN IF NOT EXISTS severity_ratings JSONB,
ADD COLUMN IF NOT EXISTS field_uniformity_score NUMERIC,
ADD COLUMN IF NOT EXISTS estimated_yield_impact_percent NUMERIC,
ADD COLUMN IF NOT EXISTS canopy_coverage_percent NUMERIC,
ADD COLUMN IF NOT EXISTS plant_density_assessment TEXT,
ADD COLUMN IF NOT EXISTS root_health_indicators TEXT[],
ADD COLUMN IF NOT EXISTS detailed_visual_analysis TEXT;

COMMENT ON COLUMN public.assessments.growth_stage IS 'Current growth stage of the crop (e.g., V6, R3, flowering, etc.)';
COMMENT ON COLUMN public.assessments.disease_identified IS 'Array of specific diseases identified';
COMMENT ON COLUMN public.assessments.pest_identified IS 'Array of specific pests identified';
COMMENT ON COLUMN public.assessments.nutrient_deficiencies IS 'JSON object with nutrient deficiency details and severity';
COMMENT ON COLUMN public.assessments.severity_ratings IS 'JSON object with severity ratings for different issues';
COMMENT ON COLUMN public.assessments.field_uniformity_score IS 'Score 0-1 indicating field uniformity';
COMMENT ON COLUMN public.assessments.estimated_yield_impact_percent IS 'Estimated percentage yield impact';
COMMENT ON COLUMN public.assessments.canopy_coverage_percent IS 'Percentage of ground covered by crop canopy';
COMMENT ON COLUMN public.assessments.plant_density_assessment IS 'Assessment of plant population density';
COMMENT ON COLUMN public.assessments.root_health_indicators IS 'Array of indicators about root health from visible plant symptoms';
COMMENT ON COLUMN public.assessments.detailed_visual_analysis IS 'Extended detailed visual analysis narrative';