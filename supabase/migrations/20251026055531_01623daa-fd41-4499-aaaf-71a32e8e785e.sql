-- LSU Researcher Integration
CREATE TABLE IF NOT EXISTS lsu_researchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  expertise TEXT[] NOT NULL,
  department VARCHAR(100) NOT NULL,
  availability VARCHAR(20) DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
  research_areas TEXT[] NOT NULL,
  contact_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Publications with Researcher Links
CREATE TABLE IF NOT EXISTS lsu_publications (
  id VARCHAR(50) PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL,
  year INTEGER NOT NULL,
  url TEXT NOT NULL,
  crops TEXT[] NOT NULL,
  topics TEXT[] NOT NULL,
  key_findings TEXT[] NOT NULL,
  researcher_id UUID REFERENCES lsu_researchers(id),
  impact_score DECIMAL(3,2) DEFAULT 0.0,
  farmer_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farmer-Researcher Interactions
CREATE TABLE IF NOT EXISTS farmer_researcher_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  researcher_id UUID REFERENCES lsu_researchers(id) NOT NULL,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('question', 'collaboration', 'research_participation')),
  question TEXT,
  response TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conservation Predictions (AI-generated)
CREATE TABLE IF NOT EXISTS conservation_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) NOT NULL,
  practice_type VARCHAR(50) NOT NULL,
  current_impact DECIMAL(10,2) NOT NULL,
  predicted_impact_1_year DECIMAL(10,2) NOT NULL,
  predicted_impact_5_year DECIMAL(10,2) NOT NULL,
  climate_factor DECIMAL(3,2) NOT NULL,
  soil_health_improvement DECIMAL(3,2) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conservation Adoption Metrics
CREATE TABLE IF NOT EXISTS conservation_adoption_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_type VARCHAR(50) NOT NULL,
  total_adopters INTEGER DEFAULT 0,
  total_acres DECIMAL(10,2) DEFAULT 0,
  average_savings DECIMAL(10,2) DEFAULT 0,
  lsu_validation_score DECIMAL(3,2) DEFAULT 0.0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Stress Events (Enhanced)
CREATE TABLE IF NOT EXISTS water_stress_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) NOT NULL,
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  stress_score DECIMAL(3,2) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  confidence DECIMAL(3,2) NOT NULL,
  weather_context JSONB NOT NULL,
  symptoms_detected TEXT[] NOT NULL,
  dirt_recommendation BOOLEAN DEFAULT FALSE,
  dirt_clicked BOOLEAN DEFAULT FALSE,
  irrigation_applied BOOLEAN DEFAULT FALSE,
  outcome_improvement DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DIRT Referral Tracking
CREATE TABLE IF NOT EXISTS dirt_referral_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) NOT NULL,
  water_stress_score DECIMAL(3,2) NOT NULL,
  dirt_clicked BOOLEAN DEFAULT FALSE,
  irrigation_scheduled BOOLEAN DEFAULT FALSE,
  water_savings DECIMAL(10,2),
  lsu_researcher_id UUID REFERENCES lsu_researchers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variety Performance Tracking
CREATE TABLE IF NOT EXISTS variety_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) NOT NULL,
  variety_name VARCHAR(100) NOT NULL,
  crop_type VARCHAR(50) NOT NULL,
  performance_score DECIMAL(3,2) NOT NULL,
  disease_resistance DECIMAL(3,2) NOT NULL,
  yield_performance DECIMAL(3,2) NOT NULL,
  input_efficiency DECIMAL(3,2) NOT NULL,
  lsu_variety BOOLEAN DEFAULT FALSE,
  lsu_researcher_id UUID REFERENCES lsu_researchers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variety Recommendations (AI-generated)
CREATE TABLE IF NOT EXISTS variety_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID REFERENCES fields(id) NOT NULL,
  current_variety VARCHAR(100),
  recommended_variety VARCHAR(100) NOT NULL,
  expected_improvement DECIMAL(3,2) NOT NULL,
  risk_assessment VARCHAR(20) NOT NULL CHECK (risk_assessment IN ('low', 'medium', 'high')),
  lsu_research_basis TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Intelligence
CREATE TABLE IF NOT EXISTS community_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL,
  field_id UUID REFERENCES fields(id) NOT NULL,
  insight_type VARCHAR(50) NOT NULL,
  practice VARCHAR(100) NOT NULL,
  outcome TEXT NOT NULL,
  savings_achieved DECIMAL(10,2),
  lsu_validation BOOLEAN DEFAULT FALSE,
  community_rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Best Practices Network
CREATE TABLE IF NOT EXISTS best_practices_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  lsu_research_basis TEXT[] NOT NULL,
  adoption_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 0.0,
  average_savings DECIMAL(10,2) DEFAULT 0.0,
  lsu_researcher_id UUID REFERENCES lsu_researchers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Models (AI-generated)
CREATE TABLE IF NOT EXISTS predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type VARCHAR(50) NOT NULL,
  field_id UUID REFERENCES fields(id) NOT NULL,
  prediction_horizon INTEGER NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  prediction_data JSONB NOT NULL,
  accuracy_score DECIMAL(3,2),
  lsu_validation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prediction Outcomes
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictive_models(id) NOT NULL,
  actual_outcome JSONB NOT NULL,
  accuracy_achieved DECIMAL(3,2) NOT NULL,
  farmer_feedback TEXT,
  lsu_researcher_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Insights
CREATE TABLE IF NOT EXISTS analytics_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(50) NOT NULL,
  field_id UUID REFERENCES fields(id) NOT NULL,
  insight_data JSONB NOT NULL,
  actionable_recommendations TEXT[] NOT NULL,
  lsu_research_basis TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add variety columns to fields table
ALTER TABLE fields
ADD COLUMN IF NOT EXISTS rice_variety VARCHAR(50),
ADD COLUMN IF NOT EXISTS soybean_variety VARCHAR(50),
ADD COLUMN IF NOT EXISTS cotton_variety VARCHAR(50),
ADD COLUMN IF NOT EXISTS corn_hybrid VARCHAR(50);

-- Enable RLS on all new tables
ALTER TABLE lsu_researchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsu_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_researcher_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservation_adoption_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_stress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dirt_referral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE variety_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE variety_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_practices_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for researchers and publications
CREATE POLICY "Anyone can view researchers" ON lsu_researchers FOR SELECT USING (true);
CREATE POLICY "Anyone can view publications" ON lsu_publications FOR SELECT USING (true);
CREATE POLICY "Anyone can view best practices" ON best_practices_network FOR SELECT USING (true);
CREATE POLICY "Anyone can view conservation metrics" ON conservation_adoption_metrics FOR SELECT USING (true);

-- RLS Policies: Users can manage their own interactions
CREATE POLICY "Users can view own interactions" ON farmer_researcher_interactions FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Users can create interactions" ON farmer_researcher_interactions FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "Users can update own interactions" ON farmer_researcher_interactions FOR UPDATE USING (auth.uid() = farmer_id);

-- RLS Policies: Users can view their field-related data
CREATE POLICY "Users can view own field predictions" ON conservation_predictions FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = conservation_predictions.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can view own water stress events" ON water_stress_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = water_stress_events.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can view own variety metrics" ON variety_performance_metrics FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = variety_performance_metrics.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can view own variety recommendations" ON variety_recommendations FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = variety_recommendations.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can view own insights" ON community_insights FOR SELECT USING (auth.uid() = farmer_id);
CREATE POLICY "Users can view own predictive models" ON predictive_models FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = predictive_models.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can view own analytics insights" ON analytics_insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM fields WHERE fields.id = analytics_insights.field_id AND fields.user_id = auth.uid())
);

-- Insert policies for system/AI to create predictions
CREATE POLICY "System can create conservation predictions" ON conservation_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create water stress events" ON water_stress_events FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create variety metrics" ON variety_performance_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create variety recommendations" ON variety_recommendations FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create community insights" ON community_insights FOR INSERT WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "System can create predictive models" ON predictive_models FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create analytics insights" ON analytics_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create dirt referrals" ON dirt_referral_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "System can create prediction outcomes" ON prediction_outcomes FOR INSERT WITH CHECK (true);