-- Fix numeric precision for predictive_models
ALTER TABLE predictive_models 
ALTER COLUMN confidence_score TYPE NUMERIC(5,2),
ALTER COLUMN accuracy_score TYPE NUMERIC(5,2);

-- Add constraints
ALTER TABLE predictive_models
DROP CONSTRAINT IF EXISTS predictive_models_confidence_score_check,
DROP CONSTRAINT IF EXISTS predictive_models_accuracy_score_check;

ALTER TABLE predictive_models
ADD CONSTRAINT predictive_models_confidence_score_check CHECK (confidence_score >= 0 AND confidence_score <= 100),
ADD CONSTRAINT predictive_models_accuracy_score_check CHECK (accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 100));