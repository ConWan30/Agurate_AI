import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DemoDataProvider } from "./contexts/DemoDataContext";
import { SkeletonDashboard } from "@/components/ui/skeleton-card";
import { Layout } from "./components/Layout";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import NetworkStatus from "./components/NetworkStatus";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const BetaMetrics = lazy(() => import("./pages/BetaMetrics"));
const Upload = lazy(() => import("./pages/Upload"));
const Scanner = lazy(() => import("./pages/Scanner"));
const FieldMap = lazy(() => import("./pages/FieldMap"));
const WeatherTimeline = lazy(() => import("./pages/WeatherTimeline"));
const Fields = lazy(() => import("./pages/Fields"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const Predictions = lazy(() => import("./pages/Predictions"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Insurance = lazy(() => import("./pages/Insurance"));
const Cooperatives = lazy(() => import("./pages/Cooperatives"));
const CooperativeJoin = lazy(() => import("./pages/CooperativeJoin"));
const DeltaIntelligence = lazy(() => import("./pages/DeltaIntelligence"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Analytics = lazy(() => import("./pages/Analytics"));
const LSUResearchers = lazy(() => import("./pages/LSUResearchers"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ConservationPractices = lazy(() => import("./pages/ConservationPractices"));
const ConversationalFormsAnalytics = lazy(() => import("./pages/ConversationalFormsAnalytics"));
const IntegrationTest = lazy(() => import("./pages/IntegrationTest"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Add timeout to prevent infinite loading in PWA/desktop mode
    const timeoutId = setTimeout(() => {
      if (mounted && isAuthenticated === null) {
        console.warn('Auth check timeout - redirecting to auth page');
        setIsAuthenticated(false);
      }
    }, 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setIsAuthenticated(!!session);
          clearTimeout(timeoutId);
        }
      })
      .catch((error) => {
        console.error('Auth check error:', error);
        if (mounted) {
          setIsAuthenticated(false);
          clearTimeout(timeoutId);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <SkeletonDashboard />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Skip link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <PWAInstallPrompt />
      <NetworkStatus />
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <DemoDataProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" role="status" aria-label="Loading"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<main id="main-content"><Home /></main>} />
            <Route path="/install" element={<main id="main-content"><Install /></main>} />
            <Route path="/auth" element={<main id="main-content"><Auth /></main>} />
            <Route path="/reset-password" element={<main id="main-content"><ResetPassword /></main>} />
            <Route path="/onboarding" element={<ProtectedRoute><main id="main-content"><Onboarding /></main></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/beta-metrics" element={<ProtectedRoute><Layout><BetaMetrics /></Layout></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Layout><Upload /></Layout></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Layout><Scanner /></Layout></ProtectedRoute>} />
          <Route path="/field-map" element={<ProtectedRoute><Layout><FieldMap /></Layout></ProtectedRoute>} />
          <Route path="/weather-timeline" element={<ProtectedRoute><Layout><WeatherTimeline /></Layout></ProtectedRoute>} />
          <Route path="/fields" element={<ProtectedRoute><Layout><Fields /></Layout></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><Layout><History /></Layout></ProtectedRoute>} />
          <Route path="/predictions" element={<ProtectedRoute><Layout><Predictions /></Layout></ProtectedRoute>} />
          <Route path="/how-it-works" element={<ProtectedRoute><Layout><HowItWorks /></Layout></ProtectedRoute>} />
          <Route path="/insurance" element={<ProtectedRoute><Layout><Insurance /></Layout></ProtectedRoute>} />
          <Route path="/cooperatives" element={<ProtectedRoute><Layout><Cooperatives /></Layout></ProtectedRoute>} />
          <Route path="/cooperatives/join/:code" element={<ProtectedRoute><CooperativeJoin /></ProtectedRoute>} />
          <Route path="/delta" element={<ProtectedRoute><Layout><DeltaIntelligence /></Layout></ProtectedRoute>} />
          <Route path="/delta-intelligence" element={<ProtectedRoute><Layout><DeltaIntelligence /></Layout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
          <Route path="/lsu-researchers" element={<ProtectedRoute><Layout><LSUResearchers /></Layout></ProtectedRoute>} />
          <Route path="/conservation-practices" element={<ProtectedRoute><Layout><ConservationPractices /></Layout></ProtectedRoute>} />
          <Route path="/conversational-forms-analytics" element={<ProtectedRoute><Layout><ConversationalFormsAnalytics /></Layout></ProtectedRoute>} />
          <Route path="/integration-test" element={<ProtectedRoute><Layout><IntegrationTest /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          {/* Demo routes for screenshots - bypasses authentication */}
          <Route path="/demo/auth" element={<Auth />} />
          <Route path="/demo/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/demo/upload" element={<Layout><Upload /></Layout>} />
          <Route path="/demo/scanner" element={<Layout><Scanner /></Layout>} />
          <Route path="/demo/field-map" element={<Layout><FieldMap /></Layout>} />
          <Route path="/demo/weather-timeline" element={<Layout><WeatherTimeline /></Layout>} />
          <Route path="/demo/fields" element={<Layout><Fields /></Layout>} />
          <Route path="/demo/history" element={<Layout><History /></Layout>} />
          <Route path="/demo/predictions" element={<Layout><Predictions /></Layout>} />
          <Route path="/demo/how-it-works" element={<Layout><HowItWorks /></Layout>} />
          <Route path="/demo/insurance" element={<Layout><Insurance /></Layout>} />
          <Route path="/demo/cooperatives" element={<Layout><Cooperatives /></Layout>} />
          <Route path="/demo/delta" element={<Layout><DeltaIntelligence /></Layout>} />
          <Route path="/demo/analytics" element={<Layout><Analytics /></Layout>} />
          <Route path="/demo/lsu-researchers" element={<Layout><LSUResearchers /></Layout>} />
          <Route path="/demo/profile" element={<Layout><Profile /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </DemoDataProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
