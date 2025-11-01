-- Remove restrictive check constraints on health and confidence scores
ALTER TABLE assessments 
DROP CONSTRAINT IF EXISTS assessments_health_score_check,
DROP CONSTRAINT IF EXISTS assessments_confidence_score_check;

-- Add correct constraints for 0-100 range
ALTER TABLE assessments
ADD CONSTRAINT assessments_health_score_check CHECK (health_score >= 0 AND health_score <= 100),
ADD CONSTRAINT assessments_confidence_score_check CHECK (confidence_score >= 0 AND confidence_score <= 100);