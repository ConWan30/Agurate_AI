# Delta Field Command Center - Feature Implementation Guide

**COPY THIS ENTIRE PROMPT INTO LOVABLE TO ADD TIER 1 FEATURES**

---

## Overview

Add 3 game-changing features to AgurateAI that transform it from a crop analysis tool into a complete **Delta Field Command Center** for Morehouse Parish farmers:

1. **Mobile Field Scanner** - Camera-first workflow with GPS auto-tagging and offline capabilities
2. **Interactive Delta Field Map** - Real-time spatial visualization of crop health across all fields
3. **Weather-Correlated Health Timeline** - Visual timeline showing how weather events impact crop health

**Target Users:** Morehouse Parish smallholder farmers managing multiple dispersed plots in rural areas with spotty cell coverage

**Tech Stack:** Lovable (React), Supabase (PostgreSQL + Storage), Leaflet.js (maps), Chart.js (timelines), Open-Meteo API (weather), Browser Geolocation API (GPS)

---

## Why These 3 Features Work Together

```
MOBILE SCANNER          FIELD MAP              WEATHER TIMELINE
      |                     |                         |
  Captures data    →   Visualizes where    →    Explains why
  (photo + GPS)        (spatial patterns)       (weather causes)
      |                     |                         |
   "Take photo"    →   "North field is      →   "Stress appeared
   of stressed         stressed"                2 days after
   rice plants"                                 heavy rain"
```

**Value Proposition:**
- Farmer walks field → Takes photo → GPS auto-tags → Map updates → Timeline shows weather correlation
- **Result:** "I see my north rice field is stressed, and it happened right after we got 2 inches of rain last Tuesday. I need to check for blast disease."

---

## Database Schema Updates

### Step 1: Update Assessments Table for GPS Tracking

Run this SQL in Supabase SQL Editor to add GPS fields to assessments:

```sql
-- Add GPS coordinates to assessments (capture exact photo location)
ALTER TABLE assessments
ADD COLUMN photo_location_lat DECIMAL(10, 7),
ADD COLUMN photo_location_lng DECIMAL(10, 7),
ADD COLUMN gps_accuracy_meters DECIMAL(6, 2);

-- Add offline sync support
ALTER TABLE assessments
ADD COLUMN captured_offline BOOLEAN DEFAULT FALSE,
ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for map queries
CREATE INDEX idx_assessments_gps ON assessments(photo_location_lat, photo_location_lng);
```

### Step 2: Create Weather Events Table

Track significant weather events for timeline correlation:

```sql
-- Weather events table for timeline visualization
CREATE TABLE weather_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    event_type TEXT CHECK (event_type IN ('heavy_rain', 'heat_wave', 'frost', 'high_wind', 'drought')),
    description TEXT,
    temperature_f DECIMAL(5, 2),
    precipitation_inches DECIMAL(5, 2),
    location_lat DECIMAL(10, 7) DEFAULT 32.73, -- Morehouse Parish
    location_lng DECIMAL(10, 7) DEFAULT -91.76,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for timeline queries
CREATE INDEX idx_weather_events_date ON weather_events(event_date);

-- RLS policy (weather events are public for all users in Morehouse Parish)
ALTER TABLE weather_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All users can view weather events" ON weather_events FOR SELECT USING (true);
CREATE POLICY "System can insert weather events" ON weather_events FOR INSERT WITH CHECK (true);
```

---

## Feature 1: Mobile Field Scanner

### Implementation Steps

#### Step 1: Create Mobile Scanner Component

Create a new page: **`/scanner`** with mobile-first design.

```jsx
// Scanner.jsx - Mobile Field Scanner Component
import { useState, useRef } from 'react';
import { Camera, MapPin, Upload, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MobileScanner() {
  const [image, setImage] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedField, setSelectedField] = useState(null);
  const fileInputRef = useRef(null);

  // Capture GPS location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error("GPS error:", error);
        alert("Unable to get GPS location. Using field default.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-capture GPS when component loads
  useEffect(() => {
    captureLocation();

    // Monitor online/offline status
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  // Handle camera capture (mobile)
  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleImageCapture = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image too large. Please use image under 10MB.");
      return;
    }

    setImage(file);

    // Re-capture GPS at photo time (in case farmer moved)
    captureLocation();
  };

  // Upload and analyze
  const handleAnalyze = async () => {
    if (!image || !selectedField) {
      alert("Please select a field and capture an image");
      return;
    }

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage
        .from('crop-images')
        .getPublicUrl(fileName).data.publicUrl;

      // Call AI Action for analysis
      const aiResult = await analyzeCropImage(image, selectedField.crop_type);

      // Save assessment to database
      const { data: assessment, error: dbError } = await supabase
        .from('assessments')
        .insert({
          field_id: selectedField.id,
          image_url: imageUrl,
          health_score: aiResult.health_score,
          stress_level: aiResult.stress_level,
          symptoms: aiResult.symptoms,
          confidence_score: aiResult.confidence_score,
          photo_location_lat: gpsCoords?.lat || selectedField.location_lat,
          photo_location_lng: gpsCoords?.lng || selectedField.location_lng,
          gps_accuracy_meters: gpsCoords?.accuracy,
          captured_offline: !isOnline
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Navigate to results page
      window.location.href = `/results/${assessment.id}`;

    } catch (error) {
      console.error("Analysis failed:", error);

      // If offline, queue for later sync
      if (!isOnline) {
        alert("Offline mode - assessment saved locally and will sync when online");
        // TODO: Implement IndexedDB queue
      } else {
        alert("Analysis failed. Please try again.");
      }
    }
  };

  return (
    <div className="mobile-scanner">
      {/* Online/Offline Indicator */}
      <div className={`status-bar ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
      </div>

      {/* Field Selection */}
      <div className="field-selector">
        <label>Select Field:</label>
        <select onChange={(e) => setSelectedField(JSON.parse(e.target.value))}>
          <option value="">-- Choose Field --</option>
          {fields.map(field => (
            <option key={field.id} value={JSON.stringify(field)}>
              {field.name} ({field.crop_type})
            </option>
          ))}
        </select>
      </div>

      {/* Camera Capture Area */}
      <div className="camera-area">
        {image ? (
          <img src={URL.createObjectURL(image)} alt="Captured crop" />
        ) : (
          <div className="camera-placeholder" onClick={handleCameraClick}>
            <Camera size={64} />
            <p>Tap to capture crop image</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageCapture}
          style={{ display: 'none' }}
        />
      </div>

      {/* GPS Status */}
      {gpsCoords && (
        <div className="gps-status">
          <MapPin size={16} />
          <span>
            Location: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
            {gpsCoords.accuracy && ` (±${gpsCoords.accuracy.toFixed(0)}m)`}
          </span>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!image || !selectedField}
        className="analyze-btn"
      >
        <Upload size={20} />
        Analyze Crop Health
      </button>
    </div>
  );
}
```

#### Step 2: Add CSS for Mobile Scanner

```css
/* Mobile Scanner Styles */
.mobile-scanner {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.status-bar.online {
  background: #D1FAE5;
  color: #065F46;
}

.status-bar.offline {
  background: #FEE2E2;
  color: #991B1B;
}

.camera-area {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #F3F4F6;
  border-radius: 12px;
  overflow: hidden;
  margin: 1rem 0;
}

.camera-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  color: #6B7280;
}

.camera-placeholder:active {
  background: #E5E7EB;
}

.camera-area img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gps-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #EFF6FF;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #1E40AF;
  margin-bottom: 1rem;
}

.analyze-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.analyze-btn:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
}

.analyze-btn:not(:disabled):active {
  background: #059669;
}
```

---

## Feature 2: Interactive Delta Field Map

### Implementation Steps

#### Step 1: Install Leaflet

Add Leaflet to your project (Lovable may auto-install when you reference it):

```bash
npm install leaflet react-leaflet
```

#### Step 2: Create Map Component

Create new page: **`/field-map`**

```jsx
// FieldMap.jsx - Interactive Louisiana Delta Field Map
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import { supabase } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker icons based on health
const getHealthIcon = (healthScore) => {
  let color;
  if (healthScore >= 0.75) color = '#10B981'; // Green - Healthy
  else if (healthScore >= 0.50) color = '#F59E0B'; // Yellow - Moderate
  else color = '#EF4444'; // Red - Severe

  return L.divIcon({
    className: 'custom-health-marker',
    html: `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function FieldMap() {
  const [fields, setFields] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedField, setSelectedField] = useState(null);

  // Morehouse Parish center coordinates
  const MOREHOUSE_CENTER = [32.73, -91.76];

  useEffect(() => {
    fetchFieldsAndAssessments();
  }, []);

  const fetchFieldsAndAssessments = async () => {
    // Fetch user's fields
    const { data: fieldsData } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    setFields(fieldsData || []);

    // Fetch latest assessment for each field
    const { data: assessmentsData } = await supabase
      .from('assessments')
      .select('*, fields(*)')
      .order('analyzed_at', { ascending: false });

    // Group by field, take most recent
    const latestAssessments = {};
    assessmentsData?.forEach(assessment => {
      if (!latestAssessments[assessment.field_id]) {
        latestAssessments[assessment.field_id] = assessment;
      }
    });

    setAssessments(Object.values(latestAssessments));
  };

  return (
    <div className="field-map-container">
      <div className="map-header">
        <h2>Delta Field Command Center</h2>
        <div className="map-legend">
          <span><span className="dot healthy"></span> Healthy (75-100%)</span>
          <span><span className="dot moderate"></span> Moderate (50-74%)</span>
          <span><span className="dot severe"></span> Severe (0-49%)</span>
        </div>
      </div>

      <MapContainer
        center={MOREHOUSE_CENTER}
        zoom={11}
        style={{ height: '600px', width: '100%' }}
      >
        {/* Morehouse Parish base map */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Field Markers */}
        {fields.map(field => {
          if (!field.location_lat || !field.location_lng) return null;

          const assessment = assessments.find(a => a.field_id === field.id);
          const healthScore = assessment?.health_score || 0.5;

          return (
            <Marker
              key={field.id}
              position={[field.location_lat, field.location_lng]}
              icon={getHealthIcon(healthScore)}
              eventHandlers={{
                click: () => setSelectedField({ ...field, assessment })
              }}
            >
              <Popup>
                <div className="field-popup">
                  <h3>{field.name}</h3>
                  <p><strong>Crop:</strong> {field.crop_type}</p>
                  <p><strong>Acreage:</strong> {field.acreage} acres</p>
                  {assessment ? (
                    <>
                      <p><strong>Health Score:</strong> {(assessment.health_score * 100).toFixed(0)}%</p>
                      <p><strong>Status:</strong> {assessment.stress_level}</p>
                      <p><strong>Last Assessed:</strong> {new Date(assessment.analyzed_at).toLocaleDateString()}</p>
                      <button onClick={() => window.location.href = `/results/${assessment.id}`}>
                        View Details →
                      </button>
                    </>
                  ) : (
                    <p className="no-data">No assessments yet</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Assessment Photo Locations (if GPS captured) */}
        {assessments.map(assessment => {
          if (!assessment.photo_location_lat || !assessment.photo_location_lng) return null;

          return (
            <Circle
              key={`photo-${assessment.id}`}
              center={[assessment.photo_location_lat, assessment.photo_location_lng]}
              radius={assessment.gps_accuracy_meters || 10}
              pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.2 }}
            >
              <Popup>
                <div className="photo-popup">
                  <p><strong>Photo Location</strong></p>
                  <p>Accuracy: ±{assessment.gps_accuracy_meters?.toFixed(0) || 'N/A'}m</p>
                  <img src={assessment.image_url} alt="Crop" style={{ width: '100%', marginTop: '8px' }} />
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>

      {/* Field Details Sidebar */}
      {selectedField && (
        <div className="field-sidebar">
          <button onClick={() => setSelectedField(null)} className="close-btn">×</button>
          <h3>{selectedField.name}</h3>
          <div className="field-details">
            <p><strong>Crop Type:</strong> {selectedField.crop_type}</p>
            <p><strong>Size:</strong> {selectedField.acreage} acres</p>
            {selectedField.assessment && (
              <>
                <div className="health-gauge">
                  <div className="gauge-bar">
                    <div
                      className="gauge-fill"
                      style={{
                        width: `${selectedField.assessment.health_score * 100}%`,
                        background: selectedField.assessment.health_score >= 0.75 ? '#10B981' :
                                   selectedField.assessment.health_score >= 0.50 ? '#F59E0B' : '#EF4444'
                      }}
                    ></div>
                  </div>
                  <p>{(selectedField.assessment.health_score * 100).toFixed(0)}% Health</p>
                </div>
                <p><strong>Symptoms:</strong></p>
                <ul>
                  {selectedField.assessment.symptoms?.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={() => window.location.href = `/scanner?field=${selectedField.id}`}>
              Scan This Field →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Step 3: Add Map Styles

```css
/* Field Map Styles */
.field-map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 80px);
}

.map-header {
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-legend {
  display: flex;
  gap: 1.5rem;
  font-size: 0.9rem;
}

.map-legend .dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.dot.healthy { background: #10B981; }
.dot.moderate { background: #F59E0B; }
.dot.severe { background: #EF4444; }

.field-popup {
  min-width: 200px;
}

.field-popup h3 {
  margin: 0 0 0.5rem 0;
  color: #1F2937;
}

.field-popup p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.field-popup button {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  background: #10B981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.field-sidebar {
  position: absolute;
  top: 80px;
  right: 1rem;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 1.5rem;
  z-index: 1000;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6B7280;
}

.health-gauge {
  margin: 1rem 0;
}

.gauge-bar {
  width: 100%;
  height: 24px;
  background: #E5E7EB;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.gauge-fill {
  height: 100%;
  transition: width 0.3s ease;
}
```

---

## Feature 3: Weather-Correlated Health Timeline

### Implementation Steps

#### Step 1: Install Chart.js

```bash
npm install chart.js react-chartjs-2
```

#### Step 2: Create Weather Timeline Component

Create new component: **`WeatherTimeline.jsx`**

```jsx
// WeatherTimeline.jsx - Shows crop health trends correlated with weather events
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '@/lib/supabase';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function WeatherTimeline({ fieldId }) {
  const [chartData, setChartData] = useState(null);
  const [weatherEvents, setWeatherEvents] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (fieldId) {
      fetchTimelineData();
    }
  }, [fieldId]);

  const fetchTimelineData = async () => {
    // Fetch assessments for this field (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: assessments } = await supabase
      .from('assessments')
      .select('*')
      .eq('field_id', fieldId)
      .gte('analyzed_at', sixtyDaysAgo.toISOString())
      .order('analyzed_at', { ascending: true });

    // Fetch weather events (same timeframe)
    const { data: weather } = await supabase
      .from('weather_events')
      .select('*')
      .gte('event_date', sixtyDaysAgo.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    setWeatherEvents(weather || []);

    // Build chart data
    if (assessments && assessments.length > 0) {
      const dates = assessments.map(a => new Date(a.analyzed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const healthScores = assessments.map(a => a.health_score * 100);
      const temperatures = assessments.map(a => a.weather_temp_f || null);

      setChartData({
        labels: dates,
        datasets: [
          {
            label: 'Crop Health (%)',
            data: healthScores,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Temperature (°F)',
            data: temperatures,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      });

      // Generate insights (correlate health drops with weather)
      generateInsights(assessments, weather || []);
    }
  };

  const generateInsights = (assessments, weather) => {
    const insightList = [];

    // Check for health drops after heavy rain
    for (let i = 1; i < assessments.length; i++) {
      const prev = assessments[i - 1];
      const curr = assessments[i];
      const healthDrop = (prev.health_score - curr.health_score) * 100;

      if (healthDrop > 10) {
        // Look for rain events 1-5 days before
        const assessmentDate = new Date(curr.analyzed_at);
        const recentRain = weather.find(w => {
          const eventDate = new Date(w.event_date);
          const daysDiff = (assessmentDate - eventDate) / (1000 * 60 * 60 * 24);
          return w.event_type === 'heavy_rain' && daysDiff >= 0 && daysDiff <= 5;
        });

        if (recentRain) {
          insightList.push({
            date: curr.analyzed_at,
            type: 'correlation',
            message: `Health dropped ${healthDrop.toFixed(0)}% within ${Math.ceil((assessmentDate - new Date(recentRain.event_date)) / (1000 * 60 * 60 * 24))} days of heavy rain (${recentRain.precipitation_inches}" on ${new Date(recentRain.event_date).toLocaleDateString()}). Monitor for disease.`
          });
        }
      }

      // Check for heat stress
      if (curr.weather_temp_f && curr.weather_temp_f > 95 && healthDrop > 5) {
        insightList.push({
          date: curr.analyzed_at,
          type: 'heat',
          message: `Health declined during high temperatures (${curr.weather_temp_f}°F). Possible heat stress - ensure adequate irrigation.`
        });
      }
    }

    setInsights(insightList);
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Crop Health & Weather Timeline (Last 60 Days)'
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            // Show weather events on this date
            const dateLabel = context[0].label;
            const matchingEvents = weatherEvents.filter(w =>
              new Date(w.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) === dateLabel
            );
            if (matchingEvents.length > 0) {
              return matchingEvents.map(e => `⚠ ${e.event_type}: ${e.description}`);
            }
            return [];
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Crop Health (%)'
        },
        min: 0,
        max: 100
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Temperature (°F)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'heavy_rain': return <CloudRain size={20} />;
      case 'heat_wave': return <Sun size={20} />;
      case 'high_wind': return <Wind size={20} />;
      default: return <Cloud size={20} />;
    }
  };

  return (
    <div className="weather-timeline">
      {chartData ? (
        <>
          <Line data={chartData} options={chartOptions} />

          {/* Weather Events Timeline */}
          {weatherEvents.length > 0 && (
            <div className="weather-events">
              <h3>Weather Events</h3>
              <div className="events-list">
                {weatherEvents.map(event => (
                  <div key={event.id} className={`event-badge ${event.event_type}`}>
                    {getEventIcon(event.event_type)}
                    <div>
                      <strong>{new Date(event.event_date).toLocaleDateString()}</strong>
                      <span>{event.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI-Generated Insights */}
          {insights.length > 0 && (
            <div className="insights-panel">
              <h3>Weather Correlation Insights</h3>
              {insights.map((insight, idx) => (
                <div key={idx} className={`insight ${insight.type}`}>
                  <p>{insight.message}</p>
                  <small>{new Date(insight.date).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="no-data">
          <p>No assessment history yet. Upload crop images to build your timeline.</p>
        </div>
      )}
    </div>
  );
}
```

#### Step 3: Add Timeline Styles

```css
/* Weather Timeline Styles */
.weather-timeline {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.weather-events {
  margin-top: 2rem;
}

.weather-events h3 {
  margin-bottom: 1rem;
  color: #1F2937;
}

.events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.event-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.event-badge.heavy_rain {
  background: #DBEAFE;
  color: #1E40AF;
}

.event-badge.heat_wave {
  background: #FEF3C7;
  color: #92400E;
}

.event-badge.high_wind {
  background: #E0E7FF;
  color: #3730A3;
}

.insights-panel {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #F9FAFB;
  border-radius: 8px;
}

.insights-panel h3 {
  margin-bottom: 1rem;
  color: #1F2937;
}

.insight {
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-left: 4px solid #3B82F6;
  background: white;
  border-radius: 6px;
}

.insight.correlation {
  border-color: #3B82F6;
}

.insight.heat {
  border-color: #F59E0B;
}

.insight p {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.insight small {
  color: #6B7280;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: #6B7280;
}
```

---

## Feature Integration: Connecting the Three Components

### Step 1: Update Field Details Page

Add the Weather Timeline to your field details page:

```jsx
// FieldDetails.jsx - Shows individual field with timeline
import WeatherTimeline from '@/components/WeatherTimeline';

export default function FieldDetails({ fieldId }) {
  const [field, setField] = useState(null);

  useEffect(() => {
    fetchField();
  }, [fieldId]);

  const fetchField = async () => {
    const { data } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();
    setField(data);
  };

  return (
    <div className="field-details-page">
      <div className="field-header">
        <h1>{field?.name}</h1>
        <button onClick={() => window.location.href = `/scanner?field=${fieldId}`}>
          Scan This Field
        </button>
      </div>

      {/* Weather Timeline Integration */}
      <WeatherTimeline fieldId={fieldId} />

      {/* Other field details... */}
    </div>
  );
}
```

### Step 2: Create Navigation Between Features

Add quick navigation buttons:

```jsx
// NavigationBar.jsx - Quick access to all 3 features
import { Camera, Map, TrendingUp } from 'lucide-react';

export default function NavigationBar() {
  return (
    <nav className="feature-nav">
      <a href="/scanner" className="nav-item">
        <Camera size={24} />
        <span>Mobile Scanner</span>
      </a>
      <a href="/field-map" className="nav-item">
        <Map size={24} />
        <span>Field Map</span>
      </a>
      <a href="/timeline" className="nav-item">
        <TrendingUp size={24} />
        <span>Timeline</span>
      </a>
    </nav>
  );
}
```

---

## Weather Event Auto-Population

### Background Job to Record Weather Events

Create a Supabase Edge Function to automatically record significant weather events:

```javascript
// supabase/functions/weather-monitor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  // Fetch weather from Open-Meteo for Morehouse Parish
  const lat = 32.73;
  const lng = -91.76;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_sum&temperature_unit=fahrenheit&precipitation_unit=inch&forecast_days=1&timezone=America/Chicago`;

  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();

  const maxTemp = weatherData.daily.temperature_2m_max[0];
  const precipitation = weatherData.daily.precipitation_sum[0];

  // Determine if significant event
  let eventType = null;
  let description = null;

  if (precipitation > 1.0) {
    eventType = 'heavy_rain';
    description = `Heavy rainfall: ${precipitation.toFixed(2)} inches`;
  } else if (maxTemp > 95) {
    eventType = 'heat_wave';
    description = `High temperature: ${maxTemp.toFixed(0)}°F`;
  }

  // Insert event if significant
  if (eventType) {
    await supabase.from('weather_events').insert({
      event_date: new Date().toISOString().split('T')[0],
      event_type: eventType,
      description: description,
      temperature_f: maxTemp,
      precipitation_inches: precipitation
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Schedule this Edge Function to run daily at 8 PM Central (via Supabase cron or external scheduler).**

---

## Testing Checklist

### Mobile Scanner Testing
- [ ] Camera access works on mobile devices (iOS Safari, Android Chrome)
- [ ] GPS coordinates captured with ±10m accuracy in rural areas
- [ ] Offline mode detects network status correctly
- [ ] Images upload to Supabase Storage successfully
- [ ] Assessment saves with GPS coordinates (photo_location_lat/lng)

### Field Map Testing
- [ ] Map centers on Morehouse Parish (32.73, -91.76)
- [ ] Field markers appear in correct locations
- [ ] Health color coding is accurate (red/yellow/green)
- [ ] Clicking marker shows field details popup
- [ ] Sidebar displays latest assessment
- [ ] Performance is smooth with 50+ fields

### Weather Timeline Testing
- [ ] Chart displays assessments from last 60 days
- [ ] Temperature overlay shows on secondary axis
- [ ] Weather events display as badges
- [ ] Insights detect health drops after rain
- [ ] Heat stress correlations are identified
- [ ] Chart is responsive on mobile

### Integration Testing
- [ ] Scanner → Map flow: New assessment appears on map immediately
- [ ] Map → Timeline: Clicking field shows timeline
- [ ] Timeline → Scanner: "Scan this field" button works
- [ ] All 3 features accessible from navigation bar

---

## Louisiana-Specific Enhancements

### Morehouse Parish Weather Thresholds

```javascript
// weatherThresholds.js - Louisiana Delta specific thresholds
export const MOREHOUSE_THRESHOLDS = {
  heavy_rain: 1.0, // inches (triggers disease monitoring)
  heat_wave: 95, // °F (critical for rice and cotton)
  frost_warning: 32, // °F (early/late season risk)
  high_wind: 25, // mph (affects pesticide application)
  drought_days: 7 // consecutive days with no rain
};

export const CROP_SENSITIVE_STAGES = {
  rice: {
    flooding: 'Permanent flood stage (panicle initiation)',
    flowering: 'Heading and flowering (water critical)'
  },
  soybean: {
    flowering: 'R1-R2 (flowering)',
    pod_fill: 'R5-R6 (seed fill)'
  },
  cotton: {
    flowering: 'First bloom',
    boll_development: 'Boll development'
  },
  corn: {
    tasseling: 'VT (tasseling)',
    silking: 'R1 (silking)'
  }
};
```

### LSU AgCenter Weather Alerts

Add automatic alerts based on LSU AgCenter recommendations:

```jsx
// LSUWeatherAlerts.jsx
export default function LSUWeatherAlerts({ cropType, weatherData }) {
  const alerts = [];

  // Rice blast disease alert (heavy rain + warm temps)
  if (cropType === 'rice' && weatherData.precipitation > 1.0 && weatherData.maxTemp > 80) {
    alerts.push({
      severity: 'urgent',
      message: 'Rice blast disease risk HIGH due to rain and warm temps. Scout fields within 3-5 days.',
      source: 'LSU AgCenter Rice Production Handbook'
    });
  }

  // Soybean rust alert (high humidity + warm temps)
  if (cropType === 'soybean' && weatherData.maxTemp > 75 && weatherData.humidity > 80) {
    alerts.push({
      severity: 'urgent',
      message: 'Asian soybean rust conditions favorable. Check LSU AgCenter sentinel plots and scout immediately.',
      source: 'LSU AgCenter Soybean Disease Management'
    });
  }

  return (
    <div className="lsu-alerts">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`alert ${alert.severity}`}>
          <strong>⚠ LSU AgCenter Alert</strong>
          <p>{alert.message}</p>
          <small>Source: {alert.source}</small>
        </div>
      ))}
    </div>
  );
}
```

---

## Offline Capabilities (Advanced)

### Service Worker for Rural Connectivity

```javascript
// public/service-worker.js - Enable offline mode
const CACHE_NAME = 'agurate-v1';
const urlsToCache = [
  '/',
  '/scanner',
  '/field-map',
  '/styles.css',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If offline and no cache, show offline page
        return caches.match('/offline.html');
      })
  );
});
```

### IndexedDB Queue for Offline Assessments

```javascript
// offlineQueue.js - Store assessments when offline, sync when online
import { openDB } from 'idb';

const DB_NAME = 'agurate-offline';
const STORE_NAME = 'pending-assessments';

export async function initOfflineDB() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  });
}

export async function queueOfflineAssessment(assessment) {
  const db = await initOfflineDB();
  await db.add(STORE_NAME, {
    ...assessment,
    queuedAt: new Date().toISOString()
  });
}

export async function syncPendingAssessments() {
  const db = await initOfflineDB();
  const pending = await db.getAll(STORE_NAME);

  for (const assessment of pending) {
    try {
      // Upload to Supabase
      const { error } = await supabase.from('assessments').insert(assessment);
      if (!error) {
        // Remove from queue on success
        await db.delete(STORE_NAME, assessment.id);
      }
    } catch (err) {
      console.error('Sync failed for assessment', assessment.id, err);
    }
  }
}

// Auto-sync when online
window.addEventListener('online', syncPendingAssessments);
```

---

## Performance Optimization

### Map Clustering for Large Datasets

If a farmer has 100+ fields, cluster markers:

```jsx
import MarkerClusterGroup from 'react-leaflet-cluster';

<MapContainer>
  <MarkerClusterGroup>
    {fields.map(field => (
      <Marker key={field.id} position={[field.location_lat, field.location_lng]} />
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

### Lazy Load Timeline Charts

Only load Chart.js when timeline is visible:

```jsx
import { lazy, Suspense } from 'react';

const WeatherTimeline = lazy(() => import('./WeatherTimeline'));

<Suspense fallback={<div>Loading timeline...</div>}>
  <WeatherTimeline fieldId={fieldId} />
</Suspense>
```

---

## Success Metrics for Delta Field Command Center

### User Engagement Targets (First 30 Days)
- **Mobile Scanner Usage:** 50+ photos captured per week
- **Map Interaction:** Farmers check map 3x per week
- **Timeline Views:** 80% of farmers view timeline at least once per week

### Technical Performance Targets
- **GPS Accuracy:** <20m error for 90% of captures
- **Map Load Time:** <2 seconds on 4G LTE
- **Offline Capability:** 100% of scans work offline, sync within 5 min when online

### User Feedback Targets
- **Scanner Satisfaction:** >85% find camera workflow intuitive
- **Map Usefulness:** >80% say map helps prioritize field visits
- **Timeline Insights:** >75% take action based on weather correlations

---

## Next Steps After Implementation

1. **Pilot Testing**
   - Deploy to 5 Morehouse Parish farmers
   - Provide in-person training on scanner usage
   - Collect feedback on GPS accuracy and offline mode

2. **LSU AgCenter Validation**
   - Share timeline correlations with LSU extension agents
   - Verify weather thresholds match LSU recommendations
   - Request endorsement for farmer outreach

3. **Feature Enhancements**
   - Add field boundary drawing (polygon tool)
   - Implement satellite imagery overlay (Sentinel-2)
   - Create PDF report export for crop insurance

4. **Scale Preparation**
   - Optimize database queries for 1000+ assessments
   - Implement map clustering for large operations
   - Add user onboarding tutorial

---

## Additional Resources

**Files in this Repository:**
- `/lovable-prompts/LOVABLE_MASTER_PROMPT.md` - Base app setup
- `/docs/research-findings.md` - Morehouse Parish agricultural data
- `/backend/test_weather_api.py` - Weather API testing

**External Documentation:**
- Leaflet.js: https://leafletjs.com/
- Chart.js: https://www.chartjs.org/
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Open-Meteo API: https://open-meteo.com/en/docs

---

## Troubleshooting

**GPS not working on mobile:**
- Ensure HTTPS (required for geolocation API)
- Check browser permissions (Settings → Site Settings)
- Fallback to field default coordinates if GPS unavailable

**Map markers not appearing:**
- Verify fields have valid location_lat and location_lng
- Check Leaflet CSS is imported
- Ensure coordinates are in decimal degrees (not DMS format)

**Timeline shows no data:**
- Confirm assessments table has weather_temp_f populated
- Check date range (default is 60 days)
- Verify weather_events table has records

**Offline mode not working:**
- Register service worker in main.jsx
- Check browser support (Safari iOS requires PWA install)
- Verify IndexedDB quota not exceeded

---

## You're Ready to Build the Delta Field Command Center!

**Copy this entire guide into Lovable chat and reference it step-by-step.**

These 3 features will transform AgurateAI into a comprehensive field management platform that Morehouse Parish farmers will use daily.

**Good luck bringing the Delta Field Command Center to Louisiana farmers!**
