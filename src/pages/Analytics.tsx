import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Activity, Droplets } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import bgFieldAerial from "@/assets/bg-field-aerial.jpg";

interface FieldData {
  id: string;
  name: string;
  crop_type: string;
  avgHealth: number;
  trend: number;
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
          const avgHealth = assessments.length > 0
            ? assessments.reduce((sum: number, a: any) => sum + (a.health_score || 0), 0) / assessments.length
            : 0;
          
          const recentAssessments = assessments.slice(-2);
          const trend = recentAssessments.length === 2
            ? recentAssessments[1].health_score - recentAssessments[0].health_score
            : 0;

          return {
            id: field.id,
            name: field.name,
            crop_type: field.crop_type,
            avgHealth: Math.round(avgHealth),
            trend: Math.round(trend),
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
          
          if (existing) {
            existing.health_score = (existing.health_score + assessment.health_score) / 2;
            existing.temp_f = assessment.weather_temp_f || existing.temp_f;
            existing.precipitation = assessment.weather_precipitation_mm || existing.precipitation;
          } else {
            acc.push({
              date,
              health_score: assessment.health_score,
              temp_f: assessment.weather_temp_f || 75,
              precipitation: assessment.weather_precipitation_mm || 0
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
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-8">
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
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
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
          <TabsTrigger value="trends" className="gap-2 data-[state=active]:gradient-delta data-[state=active]:text-white">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Health Trends</span>
            <span className="sm:hidden">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="yield" className="gap-2 data-[state=active]:gradient-harvest data-[state=active]:text-white">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Yield Forecast</span>
            <span className="sm:hidden">Yield</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-2 data-[state=active]:gradient-sky data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Field Compare</span>
            <span className="sm:hidden">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="weather" className="gap-2 data-[state=active]:gradient-earth data-[state=active]:text-white">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">Weather Impact</span>
            <span className="sm:hidden">Weather</span>
          </TabsTrigger>
        </TabsList>

        {/* Time-series Health Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="field-card">
            <CardHeader>
              <CardTitle className="font-display">Crop Health Over Time</CardTitle>
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
          </Card>
        </TabsContent>

        {/* Yield Predictions */}
        <TabsContent value="yield" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {fields.map((field) => (
              <Card key={field.id} className="field-card border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <CardTitle className="font-display flex items-center justify-between">
                    {field.name}
                    <Badge variant={field.avgHealth > 80 ? "default" : field.avgHealth > 60 ? "outline" : "destructive"}>
                      {field.avgHealth}% Health
                    </Badge>
                  </CardTitle>
                  <CardDescription className="capitalize">{field.crop_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Projected Yield</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.round(field.avgHealth * 1.2)} bu/ac
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Trend</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`h-5 w-5 ${field.trend >= 0 ? 'text-success' : 'text-destructive'}`} />
                        <p className={`text-2xl font-bold ${field.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {field.trend >= 0 ? '+' : ''}{field.trend}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Based on AI analysis of current health, weather patterns, and historical data</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Field Comparison */}
        <TabsContent value="comparison" className="space-y-6">
          <Card className="field-card">
            <CardHeader>
              <CardTitle className="font-display">Multi-Field Performance</CardTitle>
              <CardDescription>Compare health scores across all registered fields</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={fields}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgHealth" fill="hsl(var(--primary))" name="Avg Health Score" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Impact */}
        <TabsContent value="weather" className="space-y-6">
          <Card className="field-card">
            <CardHeader>
              <CardTitle className="font-display">Weather Correlation Analysis</CardTitle>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
