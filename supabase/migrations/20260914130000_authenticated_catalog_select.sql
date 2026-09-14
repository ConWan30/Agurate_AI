-- Closed beta: catalog/reference tables readable by authenticated users only (not anon).

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'lsu_publications',
        'best_practices_network',
        'conservation_adoption_metrics',
        'weather_events'
      )
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Recreate authenticated SELECT policies when tables exist.
DO $$
BEGIN
  IF to_regclass('public.lsu_publications') IS NOT NULL THEN
    CREATE POLICY "Authenticated users can view publications"
      ON public.lsu_publications FOR SELECT TO authenticated USING (true);
  END IF;
  IF to_regclass('public.best_practices_network') IS NOT NULL THEN
    CREATE POLICY "Authenticated users can view best practices"
      ON public.best_practices_network FOR SELECT TO authenticated USING (true);
  END IF;
  IF to_regclass('public.conservation_adoption_metrics') IS NOT NULL THEN
    CREATE POLICY "Authenticated users can view conservation metrics"
      ON public.conservation_adoption_metrics FOR SELECT TO authenticated USING (true);
  END IF;
  IF to_regclass('public.weather_events') IS NOT NULL THEN
    CREATE POLICY "Authenticated users can view weather events"
      ON public.weather_events FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
