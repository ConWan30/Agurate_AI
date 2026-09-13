ALTER VIEW public.assessment_details SET (security_invoker = on);
ALTER VIEW public.recommendation_details SET (security_invoker = on);
ALTER VIEW public.beta_metrics SET (security_invoker = on);
ALTER VIEW public.active_cooperative_alerts SET (security_invoker = on);
ALTER VIEW public.unacknowledged_critical_alerts SET (security_invoker = on);