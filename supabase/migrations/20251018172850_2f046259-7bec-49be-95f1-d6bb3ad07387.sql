-- Add GPS tracking and offline sync to assessments
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS photo_location_lat DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS photo_location_lng DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS gps_accuracy_meters DECIMAL(6, 2),
ADD COLUMN IF NOT EXISTS captured_offline BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for map queries
CREATE INDEX IF NOT EXISTS idx_assessments_gps ON assessments(photo_location_lat, photo_location_lng);

-- Weather events table for timeline visualization
CREATE TABLE IF NOT EXISTS weather_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL,
    event_type TEXT CHECK (event_type IN ('heavy_rain', 'heat_wave', 'frost', 'high_wind', 'drought')),
    description TEXT,
    temperature_f DECIMAL(5, 2),
    precipitation_inches DECIMAL(5, 2),
    location_lat DECIMAL(10, 7) DEFAULT 32.73,
    location_lng DECIMAL(10, 7) DEFAULT -91.76,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for timeline queries
CREATE INDEX IF NOT EXISTS idx_weather_events_date ON weather_events(event_date);

-- RLS policies for weather events
ALTER TABLE weather_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view weather events" ON weather_events;
CREATE POLICY "All users can view weather events" ON weather_events 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can insert weather events" ON weather_events;
CREATE POLICY "System can insert weather events" ON weather_events 
FOR INSERT WITH CHECK (true);