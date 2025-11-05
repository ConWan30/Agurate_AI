import { useEffect, useState } from 'react';
import { TrendingUp, Cloud, AlertTriangle, Calendar, Loader2, Brain, Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { AgriculturalBadge } from '@/components/ui/agricultural-badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PredictiveAnalyticsDashboard } from '@/components/PredictiveAnalyticsDashboard';
import { EmptyState } from '@/components/ui/empty-state';
import { PredictiveModel } from '@/types/enhanced-features';
import bgCottonField from "@/assets/bg-cotton-field.jpg";
import bgSoybeanResearch from "@/assets/bg-soybean-research.jpg";
import { EnhancedPageHeader } from '@/components/EnhancedPageHeader';
import TutorialTooltip from '@/components/TutorialTooltip';

interface Prediction {
  day: number;
  date: string;
  risk_level: 'low' | 'medium' | 'high';
  predicted_stress: string;
  confidence: number;
  weather_factor: string;
  recommendation: string;
}

interface PredictionData {
  forecast: Prediction[];
  summary: string;
  high_risk_days: number;
}

interface Field {
  id: string;
  name: string;
  crop_type: string;
}

export default function Predictions() {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [enhancedPredictions, setEnhancedPredictions] = useState<PredictiveModel[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [needsMoreData, setNeedsMoreData] = useState(false);

  const loadPredictions = async () => {
    setIsLoading(true);
    setNeedsMoreData(false);
    try {
      // Get current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to view predictions');
        setNeedsMoreData(true);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('predict-stress', {
        body: { days: 7 },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Prediction error:', error);
        toast.error('Failed to generate predictions. Please try again.');
        setNeedsMoreData(true);
        return;
      }

      // Check if we got back a message about needing more data
      if (data && data.forecast && data.forecast.length === 0) {
        setNeedsMoreData(true);
        toast.info(data.summary || 'Need more assessment data to generate predictions');
      } else {
        setPredictions(data);
      }
    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error('An error occurred while generating predictions');
      setNeedsMoreData(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
    loadPredictions();
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      fetchEnhancedPredictions();
    }
  }, [selectedFieldId]);

  const fetchFields = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('fields')
        .select('id, name, crop_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setFields(data);
        setSelectedFieldId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchEnhancedPredictions = async () => {
    setIsLoadingEnhanced(true);
    try {
      const { data } = await supabase
        .from('predictive_models')
        .select('*')
        .eq('field_id', selectedFieldId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) setEnhancedPredictions(data as PredictiveModel[]);
    } catch (error) {
      console.error('Error fetching enhanced predictions:', error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-health-severe" aria-label="High risk" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-health-moderate" aria-label="Medium risk" />;
      default: return <TrendingUp className="h-5 w-5 text-health-good" aria-label="Low risk" />;
    }
  };

  const tutorialSteps = [
    {
      target: 'predictions-header',
      id: 'header',
      title: 'Step 1: 7-Day Predictions',
      content: 'Get AI-powered stress predictions for the next 7 days based on weather and historical data.',
      position: 'bottom' as const,
    },
    {
      target: 'field-selector',
      id: 'field-select',
      title: 'Step 2: Enhanced Forecasts',
      content: 'Select a field to see 30-day enhanced predictions with conservation impact analysis.',
      position: 'bottom' as const,
    },
    {
      target: 'prediction-cards',
      id: 'predictions',
      title: 'Step 3: Daily Breakdown',
      content: 'Review daily risk levels and recommendations to take proactive action!',
      position: 'top' as const,
    },
  ];

  return (
    <>
      <TutorialTooltip steps={tutorialSteps} storageKey="predictions-tutorial-shown" />
      <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Enhanced Page Header */}
      <div id="predictions-header">
        <EnhancedPageHeader
          icon={TrendingUp}
          badge={{ icon: Sparkles, text: "Unified AI Intelligence" }}
          title="Predictive Analytics"
          description="AI-powered forecasts combining crop analysis, weather patterns, conservation practices, and community intelligence for 7-30 day predictions"
          gradient="delta"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-8">

        {/* Field Selector */}
        {fields.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Select Field for Analysis</label>
                  <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.crop_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced 30-Day Predictive Analytics */}
        {selectedFieldId && enhancedPredictions.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-2 border-b">
              <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="text-3xl font-heading font-bold">30-Day Enhanced Forecast</h2>
            </div>
            {isLoadingEnhanced ? (
              <Card className="field-card">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading enhanced predictions...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PredictiveAnalyticsDashboard predictions={enhancedPredictions} />
            )}
          </div>
        )}

        {/* 7-Day Stress Predictions */}
        <div id="prediction-cards" className="space-y-6 pt-8">
          <div className="flex items-center gap-3 pb-2 border-b">
            <Cloud className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-3xl font-heading font-bold">7-Day Stress Forecast</h2>
          </div>

        {isLoading ? (
          <Card className="field-card">
            <CardContent className="py-12">
              <LoadingState message="Analyzing historical data and weather patterns..." size="lg" />
            </CardContent>
          </Card>
        ) : predictions ? (
          <>
            {/* Summary Card with Subtle Background */}
            <Card 
              className="border-primary/20 relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%), url(${bgSoybeanResearch})`,
              backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <CardHeader className="pb-6">
                <CardTitle className="font-heading flex items-center gap-3 text-xl">
                  <Cloud className="h-6 w-6 delta-wave" aria-hidden="true" />
                  7-Day Forecast Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base leading-relaxed">{predictions.summary}</p>
                {predictions.high_risk_days > 0 && (
                  <div className="flex items-center gap-3 p-4 bg-health-severe/10 border border-health-severe/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-health-severe flex-shrink-0" />
                    <p className="text-base text-destructive">
                      <strong>{predictions.high_risk_days}</strong> high-risk day{predictions.high_risk_days > 1 ? 's' : ''} detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Predictions */}
            <div className="grid gap-6 md:grid-cols-2">
              {predictions.forecast.map((pred) => (
                <Card key={pred.day} className={`field-card border-2 ${getRiskColor(pred.risk_level)}`}>
                  <CardHeader className="pb-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl font-heading flex items-center gap-2">
                          <Calendar className="h-5 w-5" aria-hidden="true" />
                          Day {pred.day} - {pred.date}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {pred.weather_factor}
                        </CardDescription>
                      </div>
                      {getRiskIcon(pred.risk_level)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold">Risk Level:</span>
                      <Badge variant="outline" className={getRiskColor(pred.risk_level)}>
                        {pred.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold">Predicted Stress:</span>
                      <span className="text-sm font-medium">{pred.predicted_stress}</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold">Confidence:</span>
                      <span className="text-base font-bold font-mono">{(pred.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <p className="text-sm font-semibold">Recommendation:</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {pred.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={loadPredictions} disabled={isLoading} size="lg" className="gap-2 focus-ring" aria-label="Refresh predictions">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                Refresh Predictions
              </Button>
            </div>
          </>
        ) : (
          <Card className="field-card">
            <CardContent className="text-center py-12 space-y-6">
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl gradient-sky shadow-glow mx-auto">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="font-display font-semibold text-2xl">Unlock AI Predictions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload at least <strong>3 crop assessments</strong> to unlock 7-day AI-powered stress forecasts based on your field history and weather patterns.
                </p>
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Calendar className="h-4 w-4" />
                    <span>Historical analysis of your fields</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <Cloud className="h-4 w-4" />
                    <span>Real-time weather correlation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                    <TrendingUp className="h-4 w-4" />
                    <span>7-day stress predictions</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => window.location.href = '/upload'} size="lg" className="gap-2 focus-ring" aria-label="Start analyzing crops">
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
                Start Analyzing Crops
              </Button>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Feature Highlights */}
        {fields.length > 0 && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg font-heading">Unified Context</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  AI analyzes your field using historical assessments, conservation practices, variety performance, 
                  weather patterns, and community insights for comprehensive predictions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg font-heading">Extended Forecasting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Combines 7-day stress predictions with 30-day extended forecasts, giving you more time to plan interventions, 
                  order supplies, and optimize treatment timing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary/10">
                    <Zap className="h-5 w-5 text-secondary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-lg font-heading">LSU-Validated</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All predictions and recommendations are cross-referenced with LSU AgCenter research data 
                  and validated against proven agricultural practices for Louisiana Delta conditions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
