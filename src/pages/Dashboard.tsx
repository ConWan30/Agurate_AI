import { useEffect, useState } from "react";
import bgDeltaRice from "@/assets/bg-delta-rice.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { LoadingState } from "@/components/ui/loading-state";
import { AgriculturalBadge } from "@/components/ui/agricultural-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { BetaWelcomeBanner } from "@/components/BetaWelcomeBanner";
import { BetaWelcomeFlow } from "@/components/BetaWelcomeFlow";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { SuccessStoryPrompt } from "@/components/SuccessStoryPrompt";
import { BetaConversionBanner } from "@/components/BetaConversionBanner";
import { DailyBriefingCard } from "@/components/DailyBriefingCard";
import { ROICalculatorCard } from "@/components/ROICalculatorCard";
import { CriticalAlertsManager } from "@/components/CriticalAlertsManager";
import { CooperativeAlertsManager } from "@/components/CooperativeAlertsManager";
import { BetaEngagementCard } from "@/components/BetaEngagementCard";
import { BetaValueTracker } from "@/components/BetaValueTracker";
import { LiveCommunityActivity } from "@/components/LiveCommunityActivity";
import { Upload, MapPin, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, Lightbulb, Wheat, Sprout, Leaf, Brain, Users, FileText, ChevronDown, ChevronUp, Scan, Cloud, Map, History as HistoryIcon, BarChart3, Droplets, GraduationCap, Network, Microscope } from "lucide-react";
import { WeatherAlerts } from "@/components/WeatherAlerts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { useDemoData } from "@/contexts/DemoDataContext";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSuccessStory, setShowSuccessStory] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Enable keyboard shortcuts
  useGlobalKeyboardShortcuts();

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
        
        if (data && !data.onboarding_completed) {
          // Redirect to onboarding page
          window.location.href = '/onboarding';
          return;
        }
      }
    };
    
    if (isDemoMode) {
      setFields(demoFields);
      setRecentAssessments(demoAssessments as any);
      setLoading(false);
    } else {
      checkOnboarding();
      fetchDashboardData();
    }
  }, [isDemoMode]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

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
        return <CheckCircle2 className="h-5 w-5 text-health-good" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-health-moderate" />;
      case "severe":
        return <AlertCircle className="h-5 w-5 text-health-severe" />;
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
    return <SkeletonDashboard />;
  }

  return (
    <>
      <InteractiveTutorial open={showTutorial} onOpenChange={setShowTutorial} />
      <OnboardingWizard 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)}
        onSkip={() => setShowOnboarding(false)}
      />
      
      <PullToRefresh onRefresh={fetchDashboardData}>
        <div className="space-y-8">
        {userId && <BetaWelcomeFlow userId={userId} />}
        <BetaWelcomeBanner />
        <BetaConversionBanner />
        {/* Header - Louisiana Agricultural Theme with Background */}
        <div 
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-glow"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(134, 107, 53, 0.85) 0%, rgba(80, 64, 31, 0.80) 100%), url(${bgDeltaRice})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          role="banner"
        >
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                🌾 Morehouse Parish Precision Agriculture
              </Badge>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3 drop-shadow-lg">
                Welcome to Your Farm Dashboard
              </h1>
              <p className="text-white text-base md:text-lg max-w-2xl drop-shadow">
                Monitor your fields and crop health with AI-powered precision agriculture
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowTutorial(true)}
              className="gap-2 min-h-[44px] bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 focus-ring"
              aria-label="Open interactive tutorial"
            >
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Tutorial</span>
            </Button>
          </div>
          {/* Decorative particles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" aria-hidden="true"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} aria-hidden="true"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} aria-hidden="true"></div>
        </div>

        {/* Beta Farmer Engagement & Value Tracking */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BetaEngagementCard />
          <BetaValueTracker />
          <LiveCommunityActivity />
        </div>

        {/* Daily Briefing - Priority Enhancement #6 */}
        {!isDemoMode && fields.length > 0 && <DailyBriefingCard />}

        {/* Critical Alerts - Priority Enhancement #7 */}
        {!isDemoMode && <CriticalAlertsManager />}

        {/* Cooperative Alerts - Phase 3 Enhancement #17 */}
        {!isDemoMode && <CooperativeAlertsManager />}

        {/* ROI Calculator - Treatment Value Analysis */}
        {!isDemoMode && fields.length > 0 && <ROICalculatorCard />}

        {/* Core Features - All Integrations */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-heading font-bold">Core Features</h2>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive AI-powered precision agriculture platform</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. AI Crop Scanner */}
            <Link to="/upload" className="group focus-ring rounded-xl">
              <AnimatedCard hover className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-delta shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Scan className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">AI Crop Scanner</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Phone-camera crop health reads as a decision aid
                  </p>
                  <AgriculturalBadge type="healthy" className="text-xs">Core</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 2. Predictive Analytics */}
            <Link to="/predictions" className="group focus-ring rounded-xl">
              <AnimatedCard hover className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-sky shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Predictive Analytics</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    7-14 day comprehensive forecasts
                  </p>
                  <AgriculturalBadge type="healthy" className="text-xs">Core</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 3. Delta Intelligence Chat */}
            <Link to="/delta" className="group focus-ring rounded-xl">
              <AnimatedCard hover className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-harvest shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Delta Intelligence</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    24/7 research-informed AI advisor
                  </p>
                  <AgriculturalBadge type="healthy" className="text-xs">Core</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 4. Water Stress Intelligence */}
            <Link to="/predictions" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={100} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-delta shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Droplets className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Water Stress</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Real-time monitoring + DIRT link
                  </p>
                  <AgriculturalBadge type="moderate" className="text-xs">Enhanced</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 5. Conservation Tracking */}
            <Link to="/predictions" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={150} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-sky shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Leaf className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Conservation</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Track practices & ROI analysis
                  </p>
                  <AgriculturalBadge type="moderate" className="text-xs">Enhanced</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 6. Variety Recommendations */}
            <Link to="/predictions" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={200} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-harvest shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Microscope className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Variety Selection</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI rice & soybean recommendations
                  </p>
                  <AgriculturalBadge type="moderate" className="text-xs">Enhanced</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 7. LSU researcher directory */}
            <Link to="/lsu-researchers" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={250} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-delta shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">LSU Directory</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Direct AgCenter support access
                  </p>
                  <AgriculturalBadge type="moderate" className="text-xs">Enhanced</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 8. Community Intelligence */}
            <Link to="/cooperatives" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={300} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-sky shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <Network className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Cooperatives & Community</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Anonymous cooperative intelligence
                  </p>
                  <AgriculturalBadge type="moderate" className="text-xs">Enhanced</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 9. Interactive Field Maps */}
            <Link to="/field-map" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={350} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-harvest shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Field Maps</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    GPS-tagged health visualization
                  </p>
                  <AgriculturalBadge type="healthy" className="text-xs">Core</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
            </Link>

            {/* 10. Insurance Documentation */}
            <Link to="/insurance" className="group focus-ring rounded-xl">
              <AnimatedCard hover delay={400} className="cursor-pointer border-2 h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl gradient-delta shadow-glow mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-bold text-base mb-1 group-hover:text-primary transition-colors">Insurance Claims</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    AI-verified documentation
                  </p>
                  <AgriculturalBadge type="healthy" className="text-xs">Core</AgriculturalBadge>
                </CardContent>
              </AnimatedCard>
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
                <Link to="/analytics" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Advanced Analytics</h3>
                      <p className="text-sm text-muted-foreground">
                        Deep insights and performance metrics
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/fields" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <MapPin className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Field Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Register and manage your farm fields
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/field-map" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Map className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Interactive Field Map</h3>
                      <p className="text-sm text-muted-foreground">
                        Visual map of all your registered fields
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/weather-timeline" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Cloud className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Weather Timeline</h3>
                      <p className="text-sm text-muted-foreground">
                        Historical and forecast weather data
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/cooperatives" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Cooperatives</h3>
                      <p className="text-sm text-muted-foreground">
                        Join and share data with farming cooperatives
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/scanner" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Scan className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">AR Field Scanner</h3>
                      <p className="text-sm text-muted-foreground">
                        Augmented reality crop scanning
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/history" className="group">
                  <Card glass className="cursor-pointer border-2 h-full transition-all duration-300 hover:border-primary/50 hover:shadow-card hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <HistoryIcon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">Assessment History</h3>
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
            <EmptyState
              icon={MapPin}
              title="No Fields Registered"
              description="Start monitoring your crops by registering your first field. Add location, crop type, and acreage to begin."
              actionLabel="Register Your First Field"
              onAction={() => window.location.href = '/fields'}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => {
                const CropIcon = field.crop_type === 'rice' ? Wheat :
                                 field.crop_type === 'soybean' ? Sprout :
                                 field.crop_type === 'cotton' ? Leaf :
                                 field.crop_type === 'corn' ? Wheat : Sprout;
                return (
                  <Card key={field.id} glass className="border-2 group hover:border-primary/50 hover:shadow-card hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <CropIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">{field.name}</CardTitle>
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

        {/* Weather Alerts Section */}
        <WeatherAlerts />

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
            <EmptyState
              icon={Upload}
              title="No Crop Analysis Yet"
              description="Upload your first crop image to receive AI-powered health assessments, stress detection, and actionable recommendations."
              actionLabel="Upload First Crop Image"
              onAction={() => window.location.href = '/upload'}
            />
          ) : (
            <div className="space-y-6">
              {recentAssessments.map((assessment) => (
                <Card key={assessment.id} glass className="border-2 group hover:border-primary/50 hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          {getStressIcon(assessment.stress_level)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-heading font-bold text-xl mb-1 group-hover:text-primary transition-colors">{assessment.field.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {assessment.field.crop_type} • <time dateTime={assessment.created_at}>{format(new Date(assessment.created_at), "MMM d, yyyy")}</time>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-3xl font-mono font-bold text-primary">
                            <AnimatedCounter value={Math.round((assessment.health_score || 0) * 100)} suffix="%" />
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">Health Score</p>
                        </div>
                        <AgriculturalBadge
                          type={assessment.stress_level?.toLowerCase() === 'healthy' ? 'healthy' : assessment.stress_level?.toLowerCase() === 'moderate' ? 'moderate' : 'severe'}
                          className="text-base px-4 py-2 font-semibold"
                        >
                          {assessment.stress_level.charAt(0).toUpperCase() + assessment.stress_level.slice(1)}
                        </AgriculturalBadge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      </PullToRefresh>

      {/* Feedback Widget */}
      {showFeedback && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md">
          <FeedbackWidget 
            featureContext="dashboard"
            onClose={() => setShowFeedback(false)}
          />
        </div>
      )}

      {/* Success Story Prompt */}
      <SuccessStoryPrompt 
        open={showSuccessStory}
        onClose={() => setShowSuccessStory(false)}
      />

      {/* Floating Feedback Button */}
      {!showFeedback && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full p-4 shadow-glow hover:shadow-field transition-all hover:scale-110"
          aria-label="Give feedback"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </button>
      )}
    </>
  );
}