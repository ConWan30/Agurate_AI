import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Upload, MapPin, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, Lightbulb, Wheat, Sprout, Leaf, Brain, Users, FileText, ChevronDown, ChevronUp, Scan, Cloud, Map, History as HistoryIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useDemoData } from "@/contexts/DemoDataContext";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  acreage: number;
}

interface Assessment {
  id: string;
  health_score: number;
  stress_level: string;
  created_at: string;
  field: Field;
}

export default function Dashboard() {
  const { isDemoMode, fields: demoFields, assessments: demoAssessments } = useDemoData();
  const [fields, setFields] = useState<Field[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAdditionalTools, setShowAdditionalTools] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      // Use demo data in demo mode
      setFields(demoFields);
      setRecentAssessments(demoAssessments as any);
      setLoading(false);
    } else {
      fetchDashboardData();
    }
  }, [isDemoMode]);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fields
      const { data: fieldsData } = await supabase
        .from("fields")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fieldsData) setFields(fieldsData);

      // Fetch recent assessments
      const { data: assessmentsData } = await supabase
        .from("assessments")
        .select(`
          *,
          field:fields(id, name, crop_type, acreage)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (assessmentsData) setRecentAssessments(assessmentsData as any);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStressIcon = (stressLevel: string) => {
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "severe":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStressBadgeVariant = (stressLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return "default";
      case "moderate":
        return "outline";
      case "severe":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStressBadgeClass = (stressLevel: string) => {
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return "status-healthy";
      case "moderate":
        return "status-moderate";
      case "severe":
        return "status-severe";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <InteractiveTutorial open={showTutorial} onOpenChange={setShowTutorial} />
      
      <div className="space-y-8">
        {/* Header - Louisiana Agricultural Theme */}
        <div className="relative overflow-hidden rounded-2xl gradient-delta p-8 md:p-12 shadow-glow">
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                Welcome to Your Farm Dashboard
              </h1>
              <p className="text-white/90 text-base md:text-lg max-w-2xl">
                Monitor your fields and crop health with AI-powered precision agriculture for Morehouse Parish
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowTutorial(true)}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Tutorial</span>
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Core Features - LSU Pitch Focus */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold">Core Features</h2>
              <p className="text-sm text-muted-foreground mt-1">LSU AgCenter-validated precision agriculture</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. AI Crop Scanner - Flagship */}
            <Link to="/upload">
              <Card hover glass className="group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-delta shadow-glow mb-4 group-hover:scale-110 transition-transform animate-glow-pulse">
                    <Scan className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">AI Crop Scanner</h3>
                  <p className="text-sm text-muted-foreground">
                    Instant crop health analysis from any smartphone
                  </p>
                  <Badge variant="default" className="text-xs mt-3">Core Feature</Badge>
                </CardContent>
              </Card>
            </Link>

            {/* 2. Predictive Analytics - Research Angle */}
            <Link to="/predictions">
              <Card hover glass className="group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-sky shadow-glow mb-4 group-hover:scale-110 transition-transform animate-glow-pulse">
                    <TrendingUp className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">Predictive Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    7-day stress forecasts powered by weather AI
                  </p>
                  <Badge variant="default" className="text-xs mt-3">Core Feature</Badge>
                </CardContent>
              </Card>
            </Link>

            {/* 3. Delta Intelligence AI - LSU Knowledge Integration */}
            <Link to="/delta">
              <Card hover glass className="group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-harvest shadow-glow mb-4 group-hover:scale-110 transition-transform animate-glow-pulse">
                    <Brain className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">Delta Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    AI trained on LSU AgCenter research data
                  </p>
                  <Badge variant="default" className="text-xs mt-3">Core Feature</Badge>
                </CardContent>
              </Card>
            </Link>

            {/* 4. Insurance Documentation - Farmer Value */}
            <Link to="/insurance">
              <Card hover glass className="group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-delta shadow-glow mb-4 group-hover:scale-110 transition-transform animate-glow-pulse">
                    <FileText className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">Insurance Claims</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-verified damage documentation system
                  </p>
                  <Badge variant="default" className="text-xs mt-3">Core Feature</Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Additional Tools - Collapsible */}
        <Collapsible open={showAdditionalTools} onOpenChange={setShowAdditionalTools}>
          <div className="space-y-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between hover:bg-muted">
                <span className="font-display font-bold">Additional Tools & Features</span>
                {showAdditionalTools ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link to="/fields">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Field Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Register and manage your farm fields
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/field-map">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <Map className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Interactive Field Map</h3>
                      <p className="text-sm text-muted-foreground">
                        Visual map of all your registered fields
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/weather-timeline">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <Cloud className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Weather Timeline</h3>
                      <p className="text-sm text-muted-foreground">
                        Historical and forecast weather data
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/cooperatives">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Cooperatives</h3>
                      <p className="text-sm text-muted-foreground">
                        Join and share data with farming cooperatives
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/scanner">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <Scan className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">AR Field Scanner</h3>
                      <p className="text-sm text-muted-foreground">
                        Augmented reality crop scanning
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/history">
                  <Card className="field-card group cursor-pointer border-2 h-full hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <HistoryIcon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Assessment History</h3>
                      <p className="text-sm text-muted-foreground">
                        View all past crop health assessments
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Fields Overview - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">My Fields</h2>
            <Link to="/fields">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Manage All Fields</span>
              </Button>
            </Link>
          </div>
          {fields.length === 0 ? (
            <Card className="field-card border-dashed border-2">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-sky shadow-glow mx-auto mb-4">
                  <MapPin className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">No Fields Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by registering your first field to begin monitoring
                </p>
                <Link to="/fields">
                  <Button className="gradient-delta text-white">
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Your First Field
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => {
                const CropIcon = field.crop_type === 'rice' ? Wheat :
                                 field.crop_type === 'soybean' ? Sprout :
                                 field.crop_type === 'cotton' ? Leaf :
                                 field.crop_type === 'corn' ? Wheat : Sprout;
                return (
                  <Card key={field.id} className="field-card border-2">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                          <CropIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{field.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {field.crop_type} • {field.acreage} acres
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Assessments - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Recent Crop Health Analysis</h2>
            <Link to="/history">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">View All History</span>
              </Button>
            </Link>
          </div>
          {recentAssessments.length === 0 ? (
            <Card className="field-card border-dashed border-2">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-delta shadow-glow mx-auto mb-4">
                  <Upload className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first crop image to get AI-powered health insights
                </p>
                <Link to="/upload">
                  <Button className="gradient-delta text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Image
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {recentAssessments.map((assessment) => (
                <Card key={assessment.id} className="field-card border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 flex-shrink-0">
                          {getStressIcon(assessment.stress_level)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-bold text-xl mb-1">{assessment.field.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {assessment.field.crop_type} • {format(new Date(assessment.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-3xl font-display font-bold text-primary">
                            <AnimatedCounter value={Math.round((assessment.health_score || 0) * 100)} suffix="%" />
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">Health Score</p>
                        </div>
                        <Badge 
                          variant={getStressBadgeVariant(assessment.stress_level)}
                          className={`${getStressBadgeClass(assessment.stress_level)} text-base px-4 py-2 font-semibold`}
                        >
                          {assessment.stress_level.charAt(0).toUpperCase() + assessment.stress_level.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}