import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TrendingUp, AlertTriangle, Sprout } from "lucide-react";
import { PredictiveModel } from "@/types/enhanced-features";
import { formatHealthPercent, hasHealthScore, toHealthPercent } from '@/lib/health-score';

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

  const predictionData = latestPrediction.prediction_data as Record<string, unknown>;
  const hasConfidence = hasHealthScore(latestPrediction.confidence_score);
  const yieldOutlook = Number(predictionData.yield_outlook);
  const hasYieldOutlook = Number.isFinite(yieldOutlook) && yieldOutlook >= 0 && yieldOutlook <= 100;
  // disease_risk may arrive as 0–1 or 0–100; toHealthPercent normalizes both
  const diseaseRiskPercent = hasHealthScore(predictionData.disease_risk)
    ? toHealthPercent(Number(predictionData.disease_risk))
    : NaN;
  const hasDiseaseRisk = Number.isFinite(diseaseRiskPercent);
  const weatherImpact =
    typeof predictionData.weather_impact === 'string' && predictionData.weather_impact.trim()
      ? predictionData.weather_impact
      : null;
  const recommendations = Array.isArray(predictionData.recommendations)
    ? predictionData.recommendations.filter((r): r is string => typeof r === 'string')
    : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Predictive Analytics Dashboard</CardTitle>
              <CardDescription className="text-base">
                30-day planning indexes from recorded field conditions — not measured yield or profit forecasts
              </CardDescription>
            </div>
            <Badge
              variant={hasConfidence && toHealthPercent(latestPrediction.confidence_score) > 75 ? "default" : "secondary"}
              className="text-sm px-3 py-1 w-fit"
            >
              {hasConfidence
                ? `${formatHealthPercent(latestPrediction.confidence_score)} confidence`
                : 'Confidence not available'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hasYieldOutlook && (
              <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <Sprout className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold">Yield Outlook Index</span>
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {yieldOutlook.toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground"> /100</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Relative planning index — not bushels/acre
                </p>
              </div>
            )}

            {hasDiseaseRisk && (
              <div className="p-6 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                  <span className="text-sm font-semibold">Disease Risk Index</span>
                </div>
                <div className="text-3xl font-bold text-accent mb-2">
                  {diseaseRiskPercent.toFixed(0)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Planning risk index — not a measured outbreak rate
                </p>
              </div>
            )}

            {weatherImpact && (
              <div className="p-6 rounded-lg bg-secondary/10 border border-secondary/20">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                  <span className="text-sm font-semibold">Weather Impact</span>
                </div>
                <div className="text-lg font-bold text-secondary mb-2">
                  {weatherImpact}
                </div>
                <p className="text-sm text-muted-foreground">
                  Qualitative stress note
                </p>
              </div>
            )}
          </div>

          {recommendations.length > 0 && (
            <Alert className="border-l-4 border-l-primary">
              <TrendingUp className="h-5 w-5" />
              <AlertTitle className="text-base font-semibold mb-3">Recommended Actions</AlertTitle>
              <AlertDescription>
                <ul className="mt-3 space-y-2 list-disc pl-5">
                  {recommendations.map((rec, idx) => (
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
            <p>Dollar profitability is omitted until you enter recorded cost and price inputs.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
