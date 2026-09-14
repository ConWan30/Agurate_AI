import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { LoadingState } from "@/components/ui/loading-state";
import { AgriculturalBadge } from "@/components/ui/agricultural-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Activity, Droplets } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import TutorialTooltip from "@/components/TutorialTooltip";
import bgFieldAerial from "@/assets/bg-field-aerial.jpg";

interface FieldData {
  id: string;
  name: string;
  crop_type: string;
  avgHealth: number | null;
  trend: number | null;
  lastAssessment: string;
}

interface TimeSeriesPoint {
  date: string;
  health_score: number;
  temp_f: number;
  precipitation: number;
}

export default function Analytics() {
  const [fields, setFields] = useState<FieldData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [selectedField, setSelectedField] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedField]);

  const fetchAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch field summaries
      const { data: fieldsData } = await supabase
        .from("fields")
        .select(`
          id,
          name,
          crop_type,
          assessments(health_score, analyzed_at)
        `)
        .eq("user_id", user.id);

      if (fieldsData) {
        const processedFields = fieldsData.map((field: any) => {
          const assessments = field.assessments || [];
          const scored = assessments.filter(
            (a: any) => a.health_score != null && !Number.isNaN(Number(a.health_score))
          );
          const avgHealth = scored.length > 0
            ? scored.reduce((sum: number, a: any) => sum + Number(a.health_score), 0) / scored.length
            : null;
          
          const scoredRecent = scored.slice(-2);
          const trend = scoredRecent.length === 2
            ? Number(scoredRecent[1].health_score) - Number(scoredRecent[0].health_score)
            : null;

          return {
            id: field.id,
            name: field.name,
            crop_type: field.crop_type,
            avgHealth: avgHealth == null ? null : Math.round(avgHealth),
            trend: trend == null ? null : Math.round(trend),
            lastAssessment: assessments[assessments.length - 1]?.analyzed_at || "N/A"
          };
        });
        setFields(processedFields);
      }

      // Fetch time series data (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      let query = supabase
        .from("assessments")
        .select(`
          analyzed_at,
          health_score,
          weather_temp_f,
          weather_precipitation_mm,
          field_id
        `)
        .gte("analyzed_at", thirtyDaysAgo)
        .order("analyzed_at", { ascending: true });

      if (selectedField !== "all") {
        query = query.eq("field_id", selectedField);
      }

      const { data: assessmentsData } = await query;

      if (assessmentsData) {
        const timeData = assessmentsData.reduce((acc: any[], assessment: any) => {
          const date = format(new Date(assessment.analyzed_at), "MMM dd");
          const existing = acc.find(d => d.date === date);
          
          const hasScore = assessment.health_score != null && !Number.isNaN(Number(assessment.health_score));
          if (existing) {
            if (hasScore) {
              if (existing.health_score == null) {
                existing.health_score = Number(assessment.health_score);
              } else {
                existing.health_score = (Number(existing.health_score) + Number(assessment.health_score)) / 2;
              }
            }
            existing.temp_f = assessment.weather_temp_f ?? existing.temp_f;
            existing.precipitation = assessment.weather_precipitation_mm ?? existing.precipitation;
          } else {
            acc.push({
              date,
              health_score: hasScore ? Number(assessment.health_score) : null,
              temp_f: assessment.weather_temp_f ?? null,
              precipitation: assessment.weather_precipitation_mm ?? null
            });
          }
          return acc;
        }, []);

        setTimeSeriesData(timeData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-3 border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.value != null && Number.isFinite(Number(entry.value))
                ? Number(entry.value).toFixed(1)
                : '—'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8">
      <TutorialTooltip
        steps={[
          { id: "welcome", title: "Your Farming Dashboard", content: "Track performance across all fields with comprehensive analytics", position: "bottom" },
          { id: "comparison", title: "Field Comparison", content: "Identify which fields perform best and which need attention", position: "bottom" },
          { id: "treatment", title: "Treatment Effectiveness", content: "Measure ROI on your interventions and optimize spending", position: "bottom" },
          { id: "export", title: "Export Reports", content: "Download data for insurance claims or your USDA records (not a compliance guarantee)", position: "bottom" }
        ]}
        storageKey="tutorial-analytics-shown"
      />
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-glow"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(45, 106, 79, 0.90) 0%, rgba(27, 64, 48, 0.85) 100%), url(${bgFieldAerial})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
              Advanced Analytics
            </h1>
          </div>
          <p className="text-white/90 text-base md:text-lg max-w-2xl">
            Deep insights into crop health trends, yield predictions, and multi-field performance
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-muted/50 p-2">
          <TabsTrigger value="trends" className="gap-2 data-[state=active]:gradient-delta data-[state=active]:text-white focus-ring">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Health Trends</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="yield" className="gap-2 data-[state=active]:gradient-harvest data-[state=active]:text-white focus-ring">
            <Activity className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Yield Forecast</span>
            <span className="sm:hidden">Yield</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2 data-[state=active]:gradient-sky data-[state=active]:text-white focus-ring">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Field Compare</span>
            <span className="sm:hidden">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="weather" className="gap-2 data-[state=active]:gradient-earth data-[state=active]:text-white focus-ring">
            <Droplets className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Weather Impact</span>
            <span className="sm:hidden">Weather</span>
          </TabsTrigger>
        </TabsList>

        {/* Time-series Health Trends */}
        <TabsContent value="trends" className="space-y-6">
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="font-heading">Crop Health Over Time</CardTitle>
              <CardDescription>30-day rolling health score analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="health_score" 
                    stroke="hsl(var(--success))" 
                    fill="url(#healthGradient)"
                    strokeWidth={3}
                    name="Health Score"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </AnimatedCard>
        </TabsContent>

        {/* Yield Predictions */}
        <TabsContent value="yield" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {fields.map((field, idx) => (
              <AnimatedCard key={field.id} delay={idx * 100} className="border-2 hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center justify-between">
                    {field.name}
                    <AgriculturalBadge type={field.avgHealth == null ? "unknown" : field.avgHealth > 80 ? "healthy" : field.avgHealth > 60 ? "moderate" : "severe"}>
                      {field.avgHealth == null ? "No score" : `${field.avgHealth}% Health`}
                    </AgriculturalBadge>
                  </CardTitle>
                  <CardDescription className="capitalize">{field.crop_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Projected Yield</p>
                      <p className="text-2xl font-mono font-bold text-primary">
                        Not estimated
                      </p>
                      <p className="text-xs text-muted-foreground">Yield is not derived from health score alone</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <div className="flex items-center gap-2">
                        {field.trend == null ? (
                          <p className="text-2xl font-mono font-bold text-muted-foreground">N/A</p>
                        ) : (
                          <>
                            <TrendingUp className={`h-5 w-5 ${field.trend >= 0 ? 'text-health-good' : 'text-health-severe'}`} aria-hidden="true" />
                            <p className={`text-2xl font-mono font-bold ${field.trend >= 0 ? 'text-health-good' : 'text-health-severe'}`}>
                              {field.trend >= 0 ? '+' : ''}{field.trend}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Health averages use recorded assessment scores only — yield is not estimated from health</p>
                  </div>
                </CardContent>
              </AnimatedCard>
            ))}
          </div>
        </TabsContent>

        {/* Field Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="font-heading">Multi-Field Performance</CardTitle>
              <CardDescription>Compare health scores across all registered fields</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={fields.filter((f) => f.avgHealth != null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgHealth" fill="hsl(var(--primary))" name="Avg Health Score" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </AnimatedCard>
        </TabsContent>

        {/* Weather Impact */}
        <TabsContent value="weather" className="space-y-6">
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="font-heading">Weather Correlation Analysis</CardTitle>
              <CardDescription>Health score vs. temperature & precipitation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--success))" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--warning))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="health_score" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    name="Health Score"
                    dot={{ fill: "hsl(var(--success))", r: 4 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="temp_f" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    name="Temperature (°F)"
                    dot={{ fill: "hsl(var(--warning))", r: 3 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="precipitation" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Precipitation (mm)"
                    dot={{ fill: "hsl(var(--secondary))", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </AnimatedCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
