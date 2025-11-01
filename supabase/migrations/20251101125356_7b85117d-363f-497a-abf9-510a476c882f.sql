-- ============================================================================
-- MIGRATION: Beta Program Signup System
-- DATE: 2025-11-01
-- PURPOSE: Add beta farmer tracking, signup dates, and beta count function
-- ============================================================================

-- Add beta farmer tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beta_farmer BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beta_signup_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS beta_feedback_provided BOOLEAN DEFAULT FALSE;

-- Function to get current beta farmer count
CREATE OR REPLACE FUNCTION get_beta_farmer_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM profiles 
  WHERE beta_farmer = true;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_beta_farmer_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_beta_farmer_count() TO anon;

-- ============================================================================