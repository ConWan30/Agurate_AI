-- ============================================================================
-- SECURITY FIX: Remove SECURITY DEFINER from views if present
-- DATE: 2025-11-01  
-- PURPOSE: Fix security linter warning about SECURITY DEFINER views
-- ============================================================================

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS public.assessment_details;
DROP VIEW IF EXISTS public.beta_metrics;
DROP VIEW IF EXISTS public.recommendation_details;

-- Recreate assessment_details view (without SECURITY DEFINER)
CREATE VIEW public.assessment_details AS
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

-- Recreate beta_metrics view (without SECURITY DEFINER)
CREATE VIEW public.beta_metrics AS
SELECT 
    COUNT(DISTINCT p.id) AS total_signups,
    COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '7 days' THEN p.id END) AS active_users_7d,
    COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '30 days' THEN p.id END) AS active_users_30d,
    COUNT(a.id) AS total_assessments,
    AVG(bf.rating) AS avg_rating,
    COUNT(bf.id) AS feedback_count,
    COUNT(DISTINCT CASE WHEN p.onboarding_completed = true THEN p.id END) AS completed_onboarding,
    COUNT(DISTINCT ss.id) FILTER (WHERE ss.allow_public_use = true) AS public_success_stories
FROM profiles p
LEFT JOIN fields f ON p.id = f.user_id
LEFT JOIN assessments a ON f.id = a.field_id
LEFT JOIN beta_feedback bf ON p.id = bf.user_id
LEFT JOIN success_stories ss ON p.id = ss.user_id
WHERE p.beta_farmer = true;

-- Recreate recommendation_details view (without SECURITY DEFINER)
CREATE VIEW public.recommendation_details AS
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