-- ============================================================================
-- Fix Security Definer Views - Enable Security Invoker Mode
-- This ensures views respect RLS policies of the querying user
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS assessment_details;
DROP VIEW IF EXISTS recommendation_details;

-- Recreate assessment_details view with SECURITY INVOKER
CREATE OR REPLACE VIEW assessment_details 
WITH (security_invoker=on) AS
SELECT
  a.id AS assessment_id,
  a.image_url,
  a.health_score,
  a.stress_level,
  a.symptoms,
  a.confidence_score,
  a.analyzed_at,
  a.weather_temp_f,
  a.weather_precipitation_mm,
  f.id AS field_id,
  f.name AS field_name,
  f.crop_type,
  f.acreage,
  f.location_lat,
  f.location_lng,
  p.id AS user_id,
  p.full_name AS farmer_name,
  p.farm_name
FROM assessments a
JOIN fields f ON f.id = a.field_id
JOIN profiles p ON p.id = f.user_id;

-- Recreate recommendation_details view with SECURITY INVOKER
CREATE OR REPLACE VIEW recommendation_details
WITH (security_invoker=on) AS
SELECT
  r.id AS recommendation_id,
  r.recommendation_text,
  r.priority,
  r.category,
  r.created_at,
  a.id AS assessment_id,
  a.health_score,
  a.stress_level,
  f.name AS field_name,
  f.crop_type
FROM recommendations r
JOIN assessments a ON a.id = r.assessment_id
JOIN fields f ON f.id = a.field_id;