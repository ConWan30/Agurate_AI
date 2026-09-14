import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Gauge, Sprout, CloudSun } from "lucide-react";
import { ConservationPrediction } from "@/types/enhanced-features";

interface ConservationPredictionCardProps {
  prediction: ConservationPrediction;
}

function formatIndex(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return Number.isFinite(Number(value)) ? Number(value).toFixed(0) : 'n/a';
}

function relativeChangeLabel(current: number, future: number): string {
  if (!Number.isFinite(current) || !Number.isFinite(future) || current <= 0) {
    return "Planning index (not measured $)";
  }
  const pct = ((future / current - 1) * 100);
  if (!Number.isFinite(pct)) return "Planning index (not measured $)";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs current index`;
}

export function ConservationPredictionCard({ prediction }: ConservationPredictionCardProps) {
  const confidencePercent =
    prediction.confidence_score != null && Number.isFinite(Number(prediction.confidence_score))
      ? Number(prediction.confidence_score) * 100
      : null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Conservation Impact Prediction</CardTitle>
            <CardDescription>{prediction.practice_type}</CardDescription>
          </div>
          <Badge variant={confidencePercent != null && confidencePercent > 75 ? "default" : "secondary"}>
            {confidencePercent != null ? `${confidencePercent.toFixed(0)}% confidence` : 'Confidence not recorded'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span>Current Impact</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatIndex(prediction.current_impact)}
              <span className="text-sm font-normal text-muted-foreground"> /100</span>
            </div>
            <p className="text-xs text-muted-foreground">Relative planning index — not $/year</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>1-Year Forecast</span>
            </div>
            <div className="text-2xl font-bold text-accent">
              {formatIndex(prediction.predicted_impact_1_year)}
              <span className="text-sm font-normal text-muted-foreground"> /100</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {relativeChangeLabel(prediction.current_impact, prediction.predicted_impact_1_year)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>5-Year Forecast</span>
            </div>
            <div className="text-2xl font-bold text-secondary">
              {formatIndex(prediction.predicted_impact_5_year)}
              <span className="text-sm font-normal text-muted-foreground"> /100</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {relativeChangeLabel(prediction.current_impact, prediction.predicted_impact_5_year)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-muted-foreground" />
                <span>Soil Health Planning Index</span>
              </div>
              <span className="font-medium">
                {Number.isFinite(Number(prediction.soil_health_improvement)) &&
                Number(prediction.soil_health_improvement) >= 0 &&
                Number(prediction.soil_health_improvement) <= 1
                  ? `${(Number(prediction.soil_health_improvement) * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            <Progress
              value={
                Number.isFinite(Number(prediction.soil_health_improvement)) &&
                Number(prediction.soil_health_improvement) >= 0 &&
                Number(prediction.soil_health_improvement) <= 1
                  ? Number(prediction.soil_health_improvement) * 100
                  : 0
              }
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-muted-foreground" />
                <span>Climate Benefit Planning Index</span>
              </div>
              <span className="font-medium">
                {Number.isFinite(Number(prediction.climate_factor)) &&
                Number(prediction.climate_factor) >= 0 &&
                Number(prediction.climate_factor) <= 1
                  ? `${(Number(prediction.climate_factor) * 100).toFixed(0)}%`
                  : '—'}
              </span>
            </div>
            <Progress
              value={
                Number.isFinite(Number(prediction.climate_factor)) &&
                Number(prediction.climate_factor) >= 0 &&
                Number(prediction.climate_factor) <= 1
                  ? Number(prediction.climate_factor) * 100
                  : 0
              }
              className="h-2"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            * Relative planning indexes only — not measured farm savings. Dollar outcomes require your recorded cost inputs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
