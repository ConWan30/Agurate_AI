import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, AlertTriangle, DollarSign, Sprout } from "lucide-react";
import { PredictiveModel } from "@/types/enhanced-features";

interface PredictiveAnalyticsDashboardProps {
  predictions: PredictiveModel[];
}

export function PredictiveAnalyticsDashboard({ predictions }: PredictiveAnalyticsDashboardProps) {
  const latestPrediction = predictions[0];
  if (!latestPrediction) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
          <CardDescription>No predictions available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const predictionData = latestPrediction.prediction_data;
  const confidencePercent = (latestPrediction.confidence_score * 100).toFixed(0);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Predictive Analytics Dashboard</CardTitle>
              <CardDescription className="text-base">
                30-day forecast based on current field conditions
              </CardDescription>
            </div>
            <Badge variant={latestPrediction.confidence_score > 0.75 ? "default" : "secondary"} className="text-sm px-3 py-1 w-fit">
              {confidencePercent}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {predictionData.yield_prediction && (
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <Sprout className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">Yield Forecast</span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {predictionData.yield_prediction}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on health trends
                </p>
              </div>
            )}

            {predictionData.disease_risk !== undefined && (
              <div className="p-6 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                  <span className="text-sm font-semibold">Disease Risk</span>
                </div>
                <div className="text-3xl font-bold text-accent mb-2">
                  {(predictionData.disease_risk * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Outbreak probability
                </p>
              </div>
            )}

            {predictionData.weather_impact && (
              <div className="p-6 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                  <span className="text-sm font-semibold">Weather Impact</span>
                </div>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {predictionData.weather_impact}
                </div>
                <p className="text-sm text-muted-foreground">
                  Stress forecast
                </p>
              </div>
            )}

            {predictionData.economic_forecast && (
              <div className="p-6 rounded-lg bg-health-good/10 border border-health-good/30">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="h-6 w-6 text-health-good" />
                  <span className="text-sm font-semibold">Economic Outlook</span>
                </div>
                <div className="text-3xl font-bold text-health-good mb-2">
                  {predictionData.economic_forecast}
                </div>
                <p className="text-sm text-muted-foreground">
                  Profitability trend
                </p>
              </div>
            )}
          </div>

          {predictionData.recommendations && predictionData.recommendations.length > 0 && (
            <Alert className="border-l-4 border-l-primary">
              <TrendingUp className="h-5 w-5" />
              <AlertTitle className="text-base font-semibold mb-3">Recommended Actions</AlertTitle>
              <AlertDescription>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  {predictionData.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {latestPrediction.lsu_validation && (
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Badge variant="default" className="text-sm">Research-informed</Badge>
              <span className="text-sm text-muted-foreground">Framed around publicly available LSU AgCenter research — not an official validation</span>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center pt-6 border-t space-y-1">
            <p>Last updated: {new Date(latestPrediction.created_at).toLocaleString()}</p>
            <p>Prediction horizon: {latestPrediction.prediction_horizon} days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
