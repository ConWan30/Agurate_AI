-- Shared weather_events catalog must not retain farmer field GPS.
-- Authenticated SELECT remains catalog-wide (events are regional alerts),
-- but exact coordinates written from owned fields are scrubbed and blocked on insert.

UPDATE public.weather_events
SET
  location_lat = NULL,
  location_lng = NULL
WHERE location_lat IS NOT NULL
   OR location_lng IS NOT NULL;

CREATE OR REPLACE FUNCTION public.strip_weather_events_gps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.location_lat := NULL;
  NEW.location_lng := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS strip_weather_events_gps_trg ON public.weather_events;
CREATE TRIGGER strip_weather_events_gps_trg
  BEFORE INSERT OR UPDATE ON public.weather_events
  FOR EACH ROW
  EXECUTE FUNCTION public.strip_weather_events_gps();
