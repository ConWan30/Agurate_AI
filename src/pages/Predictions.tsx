import { useEffect, useState } from 'react';
import { TrendingUp, Cloud, Droplets, ThermometerSun, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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

export default function Predictions() {
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPredictions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predict-stress', {
        body: { days: 7 }
      });

      if (error) throw error;
      setPredictions(data);
    } catch (error) {
      console.error('Prediction failed:', error);
      toast.error('Failed to generate predictions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium': return <AlertTriangle className="h-5 w-5 text-secondary-foreground" />;
      default: return <TrendingUp className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Hero Header */}
      <div className="gradient-delta py-12 mb-8">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <h1 className="text-5xl font-display font-bold text-white drop-shadow-lg">
            Predictive Stress Analytics
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            AI-powered 7-day crop health forecasts based on your field history and weather patterns
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">

        {isLoading ? (
          <Card className="field-card">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Analyzing historical data and weather patterns...</p>
              </div>
            </CardContent>
          </Card>
        ) : predictions ? (
          <>
            {/* Summary Card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  7-Day Forecast Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed">{predictions.summary}</p>
                {predictions.high_risk_days > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-900">
                      <strong>{predictions.high_risk_days}</strong> high-risk day{predictions.high_risk_days > 1 ? 's' : ''} detected
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Predictions */}
            <div className="grid gap-4 md:grid-cols-2">
              {predictions.forecast.map((pred) => (
                <Card key={pred.day} className={`field-card border-2 ${getRiskColor(pred.risk_level)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Day {pred.day} - {pred.date}
                        </CardTitle>
                        <CardDescription>
                          {pred.weather_factor}
                        </CardDescription>
                      </div>
                      {getRiskIcon(pred.risk_level)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Risk Level:</span>
                      <Badge variant="outline" className={getRiskColor(pred.risk_level)}>
                        {pred.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Predicted Stress:</span>
                      <span className="text-sm">{pred.predicted_stress}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence:</span>
                      <span className="text-sm font-semibold">{(pred.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-1">Recommendation:</p>
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
              <Button onClick={loadPredictions} disabled={isLoading} size="lg" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Refresh Predictions
              </Button>
            </div>
          </>
        ) : (
          <Card className="field-card">
            <CardContent className="text-center py-12 space-y-4">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No predictions available</h3>
                <p className="text-sm text-muted-foreground">
                  Generate your first forecast to see AI-powered crop stress predictions
                </p>
              </div>
              <Button onClick={loadPredictions} size="lg" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Generate Forecast
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
