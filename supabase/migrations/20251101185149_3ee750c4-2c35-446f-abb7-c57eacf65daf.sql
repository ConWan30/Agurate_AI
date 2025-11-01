-- Fix numeric precision for assessment scores
-- Drop view, alter columns, recreate view

DROP VIEW IF EXISTS assessment_details;
DROP VIEW IF EXISTS recommendation_details;

ALTER TABLE assessments 
ALTER COLUMN health_score TYPE NUMERIC(5,2),
ALTER COLUMN confidence_score TYPE NUMERIC(5,2);

-- Recreate assessment_details view
CREATE VIEW assessment_details AS
SELECT 
  a.id AS assessment_id,
  a.field_id,
  a.image_url,
  a.health_score,
  a.stress_level,
  a.confidence_score,
  a.symptoms,
  a.analyzed_at,
  a.weather_temp_f,
  a.weather_precipitation_mm,
  a.photo_location_lat,
  a.photo_location_lng,
  f.name AS field_name,
  f.crop_type,
  f.acreage,
  f.location_lat,
  f.location_lng,
  f.user_id,
  p.full_name AS farmer_name,
  p.farm_name
FROM assessments a
JOIN fields f ON a.field_id = f.id
LEFT JOIN profiles p ON f.user_id = p.id;

-- Recreate recommendation_details view
CREATE VIEW recommendation_details AS
SELECT 
  r.id AS recommendation_id,
  r.recommendation_text,
  r.category,
  r.priority,
  r.created_at,
  a.id AS assessment_id,
  a.health_score,
  a.stress_level,
  f.name AS field_name,
  f.crop_type
FROM recommendations r
JOIN assessments a ON r.assessment_id = a.id
JOIN fields f ON a.field_id = f.id;