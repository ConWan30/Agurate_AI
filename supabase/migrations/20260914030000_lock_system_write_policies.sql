-- Lock down open "System can …" write policies.
-- These policies used WITH CHECK (true) / USING (true) without a TO role,
-- so anon + authenticated clients could insert (and in some cases update)
-- rows that were intended for trusted backends. Service role bypasses RLS.
--
-- Replace open inserts with ownership-scoped policies where the app/edge
-- functions legitimately write as the authenticated user.

-- ---------------------------------------------------------------------------
-- Drop open write policies (exact names from prior migrations)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "System can insert weather events" ON public.weather_events;

DROP POLICY IF EXISTS "System can create conservation predictions" ON public.conservation_predictions;
DROP POLICY IF EXISTS "System can create water stress events" ON public.water_stress_events;
DROP POLICY IF EXISTS "System can create variety metrics" ON public.variety_performance_metrics;
DROP POLICY IF EXISTS "System can create variety recommendations" ON public.variety_recommendations;
DROP POLICY IF EXISTS "System can create predictive models" ON public.predictive_models;
DROP POLICY IF EXISTS "System can create analytics insights" ON public.analytics_insights;
DROP POLICY IF EXISTS "System can create dirt referrals" ON public.dirt_referral_metrics;
DROP POLICY IF EXISTS "System can create prediction outcomes" ON public.prediction_outcomes;

DROP POLICY IF EXISTS "System can create AI intelligence pool entries" ON public.ai_intelligence_pool;
DROP POLICY IF EXISTS "System can update AI intelligence pool entries" ON public.ai_intelligence_pool;

DROP POLICY IF EXISTS "System can insert analytics" ON public.form_completion_analytics;

DROP POLICY IF EXISTS "System can insert request logs" ON public.request_logs;

DROP POLICY IF EXISTS "System can create critical alerts" ON public.critical_alerts;

-- ---------------------------------------------------------------------------
-- Ownership-scoped inserts (authenticated user owns the field / session / row)
-- ---------------------------------------------------------------------------

CREATE POLICY "Users can insert own request logs"
  ON public.request_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert critical alerts for own fields"
  ON public.critical_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = critical_alerts.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conservation predictions for own fields"
  ON public.conservation_predictions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = conservation_predictions.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert water stress events for own fields"
  ON public.water_stress_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = water_stress_events.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update water stress events for own fields"
  ON public.water_stress_events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = water_stress_events.field_id
        AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = water_stress_events.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variety metrics for own fields"
  ON public.variety_performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = variety_performance_metrics.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variety recommendations for own fields"
  ON public.variety_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = variety_recommendations.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert predictive models for own fields"
  ON public.predictive_models
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = predictive_models.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics insights for own fields"
  ON public.analytics_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = analytics_insights.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert dirt referrals for own fields"
  ON public.dirt_referral_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = dirt_referral_metrics.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert AI intelligence pool for own fields"
  ON public.ai_intelligence_pool
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = ai_intelligence_pool.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update AI intelligence pool for own fields"
  ON public.ai_intelligence_pool
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = ai_intelligence_pool.field_id
        AND f.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.fields f
      WHERE f.id = ai_intelligence_pool.field_id
        AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert form completion analytics for own sessions"
  ON public.form_completion_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversational_form_sessions s
      WHERE s.id = form_completion_analytics.session_id
        AND s.user_id = auth.uid()
    )
  );

-- weather_events + prediction_outcomes: service-role writes only after this migration
