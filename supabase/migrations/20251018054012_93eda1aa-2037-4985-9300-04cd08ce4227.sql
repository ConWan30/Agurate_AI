-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    farm_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fields table (farm zones/plots)
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL CHECK (crop_type IN ('rice', 'soybean', 'cotton', 'corn')),
    acreage DECIMAL(10, 2),
    location_lat DECIMAL(10, 7),
    location_lng DECIMAL(10, 7),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table (AI analysis results)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    health_score DECIMAL(3, 2) CHECK (health_score >= 0.00 AND health_score <= 1.00),
    stress_level TEXT CHECK (stress_level IN ('Healthy', 'Moderate', 'Severe')),
    symptoms TEXT[],
    confidence_score DECIMAL(3, 2),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    weather_temp_f DECIMAL(5, 2),
    weather_precipitation_mm DECIMAL(6, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
    recommendation_text TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('urgent', 'normal', 'low')) DEFAULT 'normal',
    category TEXT CHECK (category IN ('irrigation', 'fertilization', 'pest_management', 'weather_alert', 'general')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id UUID REFERENCES recommendations(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    was_helpful BOOLEAN,
    user_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fields_user_id ON fields(user_id);
CREATE INDEX idx_assessments_field_id ON assessments(field_id);
CREATE INDEX idx_recommendations_assessment_id ON recommendations(assessment_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for fields
CREATE POLICY "Users can view own fields" ON fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fields" ON fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fields" ON fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fields" ON fields FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assessments
CREATE POLICY "Users can view own assessments" ON assessments FOR SELECT USING (
    EXISTS (SELECT 1 FROM fields WHERE fields.id = assessments.field_id AND fields.user_id = auth.uid())
);
CREATE POLICY "Users can insert own assessments" ON assessments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM fields WHERE fields.id = assessments.field_id AND fields.user_id = auth.uid())
);

-- RLS Policies for recommendations
CREATE POLICY "Users can view own recommendations" ON recommendations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM assessments
        JOIN fields ON fields.id = assessments.field_id
        WHERE assessments.id = recommendations.assessment_id AND fields.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own recommendations" ON recommendations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM assessments
        JOIN fields ON fields.id = assessments.field_id
        WHERE assessments.id = recommendations.assessment_id AND fields.user_id = auth.uid()
    )
);

-- RLS Policies for feedback
CREATE POLICY "Users can view own feedback" ON feedback FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recommendations
        JOIN assessments ON assessments.id = recommendations.assessment_id
        JOIN fields ON fields.id = assessments.field_id
        WHERE recommendations.id = feedback.recommendation_id AND fields.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert own feedback" ON feedback FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM recommendations
        JOIN assessments ON assessments.id = recommendations.assessment_id
        JOIN fields ON fields.id = assessments.field_id
        WHERE recommendations.id = feedback.recommendation_id AND fields.user_id = auth.uid()
    )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at
    BEFORE UPDATE ON fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();