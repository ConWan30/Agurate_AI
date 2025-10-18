-- AgurateAI Supabase Database Schema
-- Database for AI-powered crop health monitoring in Morehouse Parish, Louisiana
-- Supports: Rice, Soybean, Cotton, Corn

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users (Farmers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    farm_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fields (Farm zones/plots)
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL CHECK (crop_type IN ('rice', 'soybean', 'cotton', 'corn')),
    acreage DECIMAL(10, 2),
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments (Image uploads and AI analysis results)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    health_score DECIMAL(3, 2) CHECK (health_score >= 0.00 AND health_score <= 1.00),
    stress_level TEXT CHECK (stress_level IN ('Healthy', 'Moderate', 'Severe')),
    symptoms TEXT[],
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    weather_temp_f DECIMAL(5, 2),
    weather_precipitation_mm DECIMAL(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations (AI-generated farming advice)
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    recommendation_text TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('urgent', 'normal', 'low')) DEFAULT 'normal',
    category TEXT CHECK (category IN ('irrigation', 'fertilization', 'pest_management', 'weather_alert', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback (User ratings of recommendation accuracy)
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    was_helpful BOOLEAN,
    user_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_fields_user_id ON fields(user_id);
CREATE INDEX idx_fields_crop_type ON fields(crop_type);
CREATE INDEX idx_assessments_field_id ON assessments(field_id);
CREATE INDEX idx_assessments_analyzed_at ON assessments(analyzed_at DESC);
CREATE INDEX idx_assessments_stress_level ON assessments(stress_level);
CREATE INDEX idx_recommendations_assessment_id ON recommendations(assessment_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_feedback_recommendation_id ON feedback(recommendation_id);
CREATE INDEX idx_feedback_assessment_id ON feedback(assessment_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users: Can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Fields: Users can only see/modify their own fields
CREATE POLICY "Users can view own fields" ON fields
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fields" ON fields
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fields" ON fields
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fields" ON fields
    FOR DELETE USING (auth.uid() = user_id);

-- Assessments: Users can only see assessments for their own fields
CREATE POLICY "Users can view own assessments" ON assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM fields
            WHERE fields.id = assessments.field_id
            AND fields.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own assessments" ON assessments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM fields
            WHERE fields.id = assessments.field_id
            AND fields.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own assessments" ON assessments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM fields
            WHERE fields.id = assessments.field_id
            AND fields.user_id = auth.uid()
        )
    );

-- Recommendations: Users can view recommendations for their own assessments
CREATE POLICY "Users can view own recommendations" ON recommendations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assessments
            JOIN fields ON fields.id = assessments.field_id
            WHERE assessments.id = recommendations.assessment_id
            AND fields.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own recommendations" ON recommendations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM assessments
            JOIN fields ON fields.id = assessments.field_id
            WHERE assessments.id = recommendations.assessment_id
            AND fields.user_id = auth.uid()
        )
    );

-- Feedback: Users can provide feedback on their own recommendations
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recommendations
            JOIN assessments ON assessments.id = recommendations.assessment_id
            JOIN fields ON fields.id = assessments.field_id
            WHERE recommendations.id = feedback.recommendation_id
            AND fields.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recommendations
            JOIN assessments ON assessments.id = recommendations.assessment_id
            JOIN fields ON fields.id = assessments.field_id
            WHERE recommendations.id = feedback.recommendation_id
            AND fields.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update 'updated_at' on users and fields
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at
    BEFORE UPDATE ON fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (for testing - OPTIONAL)
-- ============================================================================

-- Insert sample user (replace with actual auth.uid() after authentication setup)
-- INSERT INTO users (id, email, full_name, phone, farm_name) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'farmer@example.com', 'John Farmer', '318-555-0100', 'Waller Family Farms');

-- Insert sample field
-- INSERT INTO fields (user_id, name, crop_type, acreage, location_lat, location_lng) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'North Field', 'rice', 45.5, 32.7300, -91.7600);

-- Insert sample assessment
-- INSERT INTO assessments (field_id, image_url, health_score, stress_level, symptoms, confidence_score, weather_temp_f, weather_precipitation_mm) VALUES
-- ((SELECT id FROM fields WHERE name = 'North Field'), 'https://example.com/rice-field.jpg', 0.68, 'Moderate', ARRAY['Yellowing observed in 30% of field', 'Possible nitrogen deficiency'], 0.85, 92.0, 0.0);

-- Insert sample recommendation
-- INSERT INTO recommendations (assessment_id, recommendation_text, priority, category) VALUES
-- ((SELECT id FROM assessments LIMIT 1), 'Apply nitrogen-based fertilizer to affected zones within 5 days', 'urgent', 'fertilization'),
-- ((SELECT id FROM assessments LIMIT 1), 'Increase irrigation frequency to every 2 days', 'normal', 'irrigation'),
-- ((SELECT id FROM assessments LIMIT 1), 'Monitor for pest activity near stressed areas', 'normal', 'pest_management');

-- ============================================================================
-- VIEWS (Optional - for simplified queries)
-- ============================================================================

-- View: Complete assessment data with field and user info
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
    u.id AS user_id,
    u.full_name AS farmer_name,
    u.farm_name
FROM assessments a
JOIN fields f ON f.id = a.field_id
JOIN users u ON u.id = f.user_id;

-- View: Recommendations with assessment context
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

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. After creating tables, set up authentication in Supabase dashboard
-- 2. Test RLS policies by creating test users and attempting cross-user access
-- 3. Use Supabase Storage for image uploads (image_url references Storage bucket)
-- 4. Monitor query performance and add additional indexes as needed
-- 5. Consider adding audit logging for sensitive operations
-- 6. Implement soft deletes if you want to retain historical data

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
