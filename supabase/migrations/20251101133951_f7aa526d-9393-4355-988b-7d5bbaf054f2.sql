-- ============================================================================
-- MIGRATION: Add Beta Welcome Tracking
-- PURPOSE: Track beta welcome flow completion for new beta farmers
-- ============================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beta_welcome_shown BOOLEAN DEFAULT FALSE;

-- Index for faster queries on beta farmers
CREATE INDEX IF NOT EXISTS idx_profiles_beta_farmer ON profiles(beta_farmer) WHERE beta_farmer = TRUE;