-- ============================================================================
-- AgurateAI Schema Improvements - Transaction-Safe Approach
-- ============================================================================

-- Step 1: Remove the old constraint completely
ALTER TABLE assessments DROP CONSTRAINT IF EXISTS assessments_stress_level_check;

-- Step 2: Normalize ALL existing data
UPDATE assessments SET stress_level = 'healthy' WHERE stress_level = 'Healthy';
UPDATE assessments SET stress_level = 'moderate' WHERE stress_level = 'Moderate';  
UPDATE assessments SET stress_level = 'severe' WHERE stress_level = 'Severe';

-- Step 3: Add the new lowercase constraint
ALTER TABLE assessments ADD CONSTRAINT assessments_stress_level_check 
  CHECK (stress_level IN ('healthy', 'moderate', 'severe'));

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_fields_crop_type ON fields(crop_type);
CREATE INDEX IF NOT EXISTS idx_assessments_analyzed_at ON assessments(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_stress_level ON assessments(stress_level);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);

-- Step 5: Add DELETE policy for assessments
DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;
CREATE POLICY "Users can delete own assessments" ON assessments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = assessments.field_id
      AND fields.user_id = auth.uid()
    )
  );

-- Step 6: Create database views for simplified queries
CREATE OR REPLACE VIEW assessment_details AS
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

CREATE OR REPLACE VIEW recommendation_details AS
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