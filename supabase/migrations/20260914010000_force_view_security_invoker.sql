-- ============================================================================
-- SECURITY FIX: Force SECURITY INVOKER on all application views
-- PURPOSE: Ensure views respect the querying user's RLS policies
-- rather than running with the view owner's privileges.
-- ============================================================================

-- Core assessment / recommendation views
ALTER VIEW IF EXISTS public.assessment_details SET (security_invoker = true);
ALTER VIEW IF EXISTS public.recommendation_details SET (security_invoker = true);
ALTER VIEW IF EXISTS public.beta_metrics SET (security_invoker = true);

-- Alert views
ALTER VIEW IF EXISTS public.unacknowledged_critical_alerts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.active_cooperative_alerts SET (security_invoker = true);

-- Feature views
ALTER VIEW IF EXISTS public.peer_comparison_data SET (security_invoker = true);
ALTER VIEW IF EXISTS public.conversation_memory_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.user_consultations SET (security_invoker = true);
