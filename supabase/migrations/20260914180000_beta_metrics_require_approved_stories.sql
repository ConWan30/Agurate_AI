-- Align beta_metrics public story counts with approved moderation (20260914140000).
CREATE OR REPLACE VIEW public.beta_metrics
WITH (security_invoker = true)
AS
SELECT
    COUNT(DISTINCT p.id) AS total_signups,
    COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '7 days' THEN p.id END) AS active_users_7d,
    COUNT(DISTINCT CASE WHEN f.created_at > NOW() - INTERVAL '30 days' THEN p.id END) AS active_users_30d,
    COUNT(a.id) AS total_assessments,
    AVG(bf.rating) AS avg_rating,
    COUNT(bf.id) AS feedback_count,
    COUNT(DISTINCT CASE WHEN p.onboarding_completed = true THEN p.id END) AS completed_onboarding,
    COUNT(DISTINCT ss.id) FILTER (
      WHERE ss.allow_public_use = true AND ss.approved = true
    ) AS public_success_stories
FROM profiles p
LEFT JOIN fields f ON p.id = f.user_id
LEFT JOIN assessments a ON f.id = a.field_id
LEFT JOIN beta_feedback bf ON p.id = bf.user_id
LEFT JOIN success_stories ss ON p.id = ss.user_id
WHERE p.beta_farmer = true;

GRANT SELECT ON public.beta_metrics TO authenticated;
