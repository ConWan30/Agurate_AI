import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Cloud, CloudRain, Sun, Wind, Droplets, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TutorialTooltip from '@/components/TutorialTooltip';
import bgWeatherStation from "@/assets/bg-weather-station.jpg";
import { hasHealthScore, toHealthPercent } from '@/lib/health-score';
import { formatStressLabel, normalizeStressLevel, stressBadgeType } from '@/lib/stress-level';

interface Assessment {
  id: string;
  analyzed_at: string;
  health_score: number;
  stress_level: string;
  weather_temp_f: number | null;
  weather_precipitation_mm: number | null;
  field_id: string;
  fields?: {
    name: string;
  };
}

interface WeatherEvent {
  id: string;
  event_date: string;
  event_type: string;
  description: string | null;
  temperature_f: number | null;
  precipitation_inches: number | null;
}

interface TimelineDataPoint {
  date: string;
  healthScore: number | null;
  temperature: number | null;
  precipitation: number | null;
  events: WeatherEvent[];
}

const getWeatherIcon = (eventType: string) => {
  switch (eventType) {
    case 'heavy_rain': return <CloudRain className="h-4 w-4" />;
    case 'heat_wave': return <Sun className="h-4 w-4" />;
    case 'high_wind': return <Wind className="h-4 w-4" />;
    case 'drought': return <Droplets className="h-4 w-4" />;
    case 'frost': return <Cloud className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getEventBadgeVariant = (eventType: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (eventType) {
    case 'heavy_rain': return 'secondary';
    case 'heat_wave': return 'destructive';
    case 'frost': return 'secondary';
    default: return 'outline';
  }
};

export default function WeatherTimeline() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [weatherEvents, setWeatherEvents] = useState<WeatherEvent[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch assessments from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: assessmentsData } = await supabase
      .from('assessments')
      .select('*, fields(name)')
      .gte('analyzed_at', thirtyDaysAgo.toISOString())
      .order('analyzed_at', { ascending: true });

    setAssessments(assessmentsData || []);

    // Fetch weather events
    const { data: eventsData } = await supabase
      .from('weather_events')
      .select('*')
      .gte('event_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    setWeatherEvents(eventsData || []);

    // Combine into timeline data
    if (assessmentsData && assessmentsData.length > 0) {
      const timeline: TimelineDataPoint[] = assessmentsData.map(assessment => ({
        date: new Date(assessment.analyzed_at).toLocaleDateString(),
        healthScore: hasHealthScore(assessment.health_score)
          ? toHealthPercent(assessment.health_score)
          : null,
        temperature: assessment.weather_temp_f,
        precipitation: assessment.weather_precipitation_mm ? assessment.weather_precipitation_mm / 25.4 : null, // mm to inches
        events: (eventsData || []).filter(e => 
          new Date(e.event_date).toDateString() === new Date(assessment.analyzed_at).toDateString()
        )
      }));

      setTimelineData(timeline);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      <TutorialTooltip
        steps={[
          { id: "welcome", title: "Weather Timeline", content: "Visualize how weather impacts crop health over 30 days", position: "bottom" },
          { id: "chart", title: "Health & Weather Chart", content: "Green line = crop health, Blue/Red = temperature and rainfall trends", position: "bottom" },
          { id: "events", title: "Weather Events", content: "See correlations between weather events and health drops", position: "bottom" },
          { id: "assessments", title: "Recent Assessments", content: "Quick access to your scan history with GPS tags", position: "bottom" }
        ]}
        storageKey="tutorial-weather-timeline-shown"
      />
      {/* Hero Header */}
      <div
        className="py-12 mb-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(71, 85, 105, 0.92) 0%, rgba(51, 65, 85, 0.88) 100%), url(${bgWeatherStation})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4 relative z-10">
          <h1 className="text-5xl font-heading font-bold text-white drop-shadow-lg">
            Weather-Correlated Health Timeline
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Visualize how weather events impact crop health over time with data-driven insights
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">

        {/* Chart */}
        <AnimatedCard>
          <CardHeader>
            <CardTitle className="font-heading">30-Day Crop Health & Weather Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Health Score (%)', angle: -90, position: 'insideLeft' }}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Temperature (°F)', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="healthScore" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Health Score"
                    dot={{ r: 5 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Temperature"
                    strokeDasharray="5 5"
                  />
                  {/* Precipitation reference lines */}
                  {timelineData.map((point, idx) => 
                    point.precipitation != null
                      && Number.isFinite(Number(point.precipitation))
                      && Number(point.precipitation) > 0.5 ? (
                      <ReferenceLine 
                        key={`precip-${idx}`}
                        x={point.date}
                        stroke="#3B82F6"
                        strokeDasharray="3 3"
                        label={{ value: `${Number(point.precipitation).toFixed(1)}"`, position: 'top' }}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Activity className="h-16 w-16 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">No assessment data available</p>
                  <p className="text-sm text-muted-foreground">Upload crop images to see health trends over time</p>
                </div>
                <Button onClick={() => window.location.href = '/scanner'} size="lg" className="focus-ring">
                  Start Scanning
                </Button>
              </div>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Weather Events Timeline */}
        <AnimatedCard delay={100}>
          <CardHeader>
            <CardTitle className="font-heading">Significant Weather Events</CardTitle>
          </CardHeader>
          <CardContent>
            {weatherEvents.length > 0 ? (
              <div className="space-y-4">
                {weatherEvents.map(event => (
                  <div 
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="mt-1" aria-hidden="true">
                      {getWeatherIcon(event.event_type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <AgriculturalBadge type={event.event_type === 'heat_wave' ? 'severe' : event.event_type === 'heavy_rain' ? 'moderate' : 'unknown'}>
                          {event.event_type.replace('_', ' ')}
                        </AgriculturalBadge>
                        <time className="text-sm text-muted-foreground" dateTime={event.event_date}>
                          {new Date(event.event_date).toLocaleDateString()}
                        </time>
                      </div>
                      {event.description && (
                        <p className="text-sm">{event.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {event.temperature_f && (
                          <span>🌡️ {event.temperature_f}°F</span>
                        )}
                        {event.precipitation_inches && (
                          <span>🌧️ {event.precipitation_inches}" rain</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No significant weather events recorded in the last 30 days.
              </p>
            )}
          </CardContent>
        </AnimatedCard>

        {/* Recent Assessments */}
        <AnimatedCard delay={200}>
          <CardHeader>
            <CardTitle className="font-heading">Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length > 0 ? (
              <div className="space-y-3">
                {assessments.slice(-10).reverse().map(assessment => (
                  <div 
                    key={assessment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{assessment.fields?.name || 'Unknown Field'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assessment.analyzed_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-mono font-semibold">
                          {hasHealthScore(assessment.health_score)
                            ? `${toHealthPercent(assessment.health_score).toFixed(0)}%`
                            : 'No score'}
                        </p>
                        {assessment.weather_temp_f && (
                          <p className="text-xs text-muted-foreground">
                            {assessment.weather_temp_f}°F
                          </p>
                        )}
                      </div>
                      {normalizeStressLevel(assessment.stress_level) ? (
                        <AgriculturalBadge type={stressBadgeType(assessment.stress_level)}>
                          {formatStressLabel(assessment.stress_level)}
                        </AgriculturalBadge>
                      ) : (
                        <Badge variant="outline">Stress not recorded</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                No recent assessments available.
              </p>
            )}
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  );
}
