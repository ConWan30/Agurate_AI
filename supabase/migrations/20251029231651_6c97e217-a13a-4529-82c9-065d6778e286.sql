-- ============================================================================
-- MIGRATION: Beta Program Integration - Database Schema
-- PURPOSE: Add beta farmer tracking, feedback, success stories, and metrics
-- ============================================================================

-- ============================================================================
-- PART 1: Beta Farmer Tracking in Profiles
-- ============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS beta_farmer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS beta_signup_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifetime_discount DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS beta_welcome_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS farm_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS parish VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_acreage DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS primary_crops TEXT[],
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';

-- Create index for beta farmer queries
CREATE INDEX IF NOT EXISTS idx_profiles_beta_farmer ON profiles(beta_farmer) WHERE beta_farmer = TRUE;

-- ============================================================================
-- PART 2: Beta Feedback System
-- ============================================================================
CREATE TABLE IF NOT EXISTS beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  feature_context VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT NOT NULL,
  screenshot_url TEXT,
  user_agent TEXT,
  page_url TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for feedback tables
CREATE INDEX IF NOT EXISTS idx_beta_feedback_user ON beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);

-- Enable RLS for feedback tables
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback
CREATE POLICY "Users can view own feedback" ON beta_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create feedback" ON beta_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports" ON bug_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bug reports" ON bug_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PART 3: Success Stories
-- ============================================================================
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  assessment_id UUID REFERENCES assessments(id),
  problem_encountered TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  outcome TEXT NOT NULL,
  estimated_savings DECIMAL(10,2),
  acres_protected DECIMAL(10,2),
  testimonial TEXT NOT NULL,
  allow_public_use BOOLEAN DEFAULT FALSE,
  allow_name BOOLEAN DEFAULT FALSE,
  allow_farm_name BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for success stories
CREATE INDEX IF NOT EXISTS idx_success_stories_user ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_public ON success_stories(allow_public_use) WHERE allow_public_use = TRUE;

-- Enable RLS for success stories
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for success stories
CREATE POLICY "Users can view own stories" ON success_stories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create stories" ON success_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view public stories" ON success_stories FOR SELECT USING (allow_public_use = TRUE);

-- ============================================================================
-- PART 4: Beta Metrics View
-- ============================================================================
CREATE OR REPLACE VIEW beta_metrics AS
SELECT
  COUNT(DISTINCT p.id) as total_signups,
  COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '7 days' THEN p.id END) as active_users_7d,
  COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '30 days' THEN p.id END) as active_users_30d,
  COUNT(a.id) as total_assessments,
  AVG(bf.rating) as avg_rating,
  COUNT(bf.id) as feedback_count,
  COUNT(DISTINCT CASE WHEN p.onboarding_completed = TRUE THEN p.id END) as completed_onboarding,
  COUNT(DISTINCT ss.id) FILTER (WHERE ss.allow_public_use = TRUE) as public_success_stories
FROM profiles p
LEFT JOIN fields f ON p.id = f.user_id
LEFT JOIN assessments a ON f.id = a.field_id
LEFT JOIN beta_feedback bf ON p.id = bf.user_id
LEFT JOIN success_stories ss ON p.id = ss.user_id
WHERE p.beta_farmer = TRUE;

-- Grant access to authenticated users
GRANT SELECT ON beta_metrics TO authenticated;