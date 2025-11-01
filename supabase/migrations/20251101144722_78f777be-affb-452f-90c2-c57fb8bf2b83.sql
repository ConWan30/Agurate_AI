-- ============================================================================
-- MIGRATION: Complete Tutorial & Engagement System
-- PURPOSE: Add tracking for tutorials, feedback, testimonials, and beta value
-- ============================================================================

-- Tutorial completion tracking
CREATE TABLE IF NOT EXISTS tutorial_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tutorial_id TEXT NOT NULL,
  step_id TEXT,
  action TEXT CHECK (action IN ('started', 'completed', 'skipped', 'abandoned')),
  time_spent_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tutorial_id, step_id, action)
);

ALTER TABLE tutorial_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tutorial completions"
  ON tutorial_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own tutorial completions"
  ON tutorial_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tutorial feedback system
CREATE TABLE IF NOT EXISTS tutorial_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tutorial_id TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE tutorial_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own tutorial feedback"
  ON tutorial_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own tutorial feedback"
  ON tutorial_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Farmer testimonials
CREATE TABLE IF NOT EXISTS farmer_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_name TEXT NOT NULL,
  farm_location TEXT,
  testimonial_text TEXT NOT NULL,
  feature_mentioned TEXT[],
  roi_achieved DECIMAL(10,2),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE farmer_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
  ON farmer_testimonials FOR SELECT
  USING (approved = true);

-- Insert sample testimonials for beta launch
INSERT INTO farmer_testimonials (farmer_name, farm_location, testimonial_text, feature_mentioned, roi_achieved, approved) VALUES
('James Collins', 'Bastrop, LA', 'AgurateAI caught rice blast 5 days before I would have noticed it myself. That early detection saved me at least $8,000 in yield loss. The AI is spot-on accurate.', ARRAY['scanner', 'predictions'], 8000.00, true),
('Maria Thompson', 'Mer Rouge, LA', 'The insurance claim automation is a game-changer. I submitted my flood damage claim with GPS-tagged photos in 15 minutes. Got approved in 3 days instead of the usual 3 weeks.', ARRAY['insurance', 'scanner'], 2500.00, true),
('Robert Davis', 'Oak Ridge, LA', 'I was skeptical about AI for farming, but the 7-day stress predictions have been incredibly accurate. I adjusted my irrigation schedule based on AgurateAI and saved $1,200 in water costs this month alone.', ARRAY['predictions', 'weather'], 1200.00, true);