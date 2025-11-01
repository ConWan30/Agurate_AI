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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Predictive Analytics Dashboard</CardTitle>
              <CardDescription>
                30-day forecast based on current field conditions
              </CardDescription>
            </div>
            <Badge variant={latestPrediction.confidence_score > 0.75 ? "default" : "secondary"}>
              {confidencePercent}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictionData.yield_prediction && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Yield Forecast</span>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {predictionData.yield_prediction}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on health trends
                </p>
              </div>
            )}

            {predictionData.disease_risk !== undefined && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Disease Risk</span>
                </div>
                <div className="text-2xl font-bold text-accent">
                  {(predictionData.disease_risk * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Outbreak probability
                </p>
              </div>
            )}

            {predictionData.weather_impact && (
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium">Weather Impact</span>
                </div>
                <div className="text-2xl font-bold text-secondary">
                  {predictionData.weather_impact}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Stress forecast
                </p>
              </div>
            )}

            {predictionData.economic_forecast && (
              <div className="p-4 rounded-lg bg-health-good/10 border border-health-good/30">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-health-good" />
                  <span className="text-sm font-medium">Economic Outlook</span>
                </div>
                <div className="text-2xl font-bold text-health-good">
                  {predictionData.economic_forecast}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Profitability trend
                </p>
              </div>
            )}
          </div>

          {predictionData.recommendations && predictionData.recommendations.length > 0 && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Recommended Actions</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 list-disc pl-4">
                  {predictionData.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {latestPrediction.lsu_validation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="default">LSU Validated</Badge>
              <span>This prediction has been validated by LSU AgCenter researchers</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            Last updated: {new Date(latestPrediction.created_at).toLocaleString()} | 
            Prediction horizon: {latestPrediction.prediction_horizon} days
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
