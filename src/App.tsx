import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Scanner from "./pages/Scanner";
import FieldMap from "./pages/FieldMap";
import WeatherTimeline from "./pages/WeatherTimeline";
import Fields from "./pages/Fields";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Predictions from "./pages/Predictions";
import HowItWorks from "./pages/HowItWorks";
import Insurance from "./pages/Insurance";
import Cooperatives from "./pages/Cooperatives";
import CooperativeJoin from "./pages/CooperativeJoin";
import DeltaIntelligence from "./pages/DeltaIntelligence";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
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
          <Route path="/demo/profile" element={<Layout><Profile /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
