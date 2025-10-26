import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Sprout, CloudSun } from "lucide-react";
import { ConservationPrediction } from "@/types/enhanced-features";

interface ConservationPredictionCardProps {
  prediction: ConservationPrediction;
}

export function ConservationPredictionCard({ prediction }: ConservationPredictionCardProps) {
  const confidencePercent = prediction.confidence_score * 100;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Conservation Impact Prediction</CardTitle>
            <CardDescription>{prediction.practice_type}</CardDescription>
          </div>
          <Badge variant={confidencePercent > 75 ? "default" : "secondary"}>
            {confidencePercent.toFixed(0)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Current Impact</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              ${prediction.current_impact.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Annual savings</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>1-Year Forecast</span>
            </div>
            <div className="text-2xl font-bold text-accent">
              ${prediction.predicted_impact_1_year.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{((prediction.predicted_impact_1_year / prediction.current_impact - 1) * 100).toFixed(0)}% increase
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>5-Year Forecast</span>
            </div>
            <div className="text-2xl font-bold text-secondary">
              ${prediction.predicted_impact_5_year.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{((prediction.predicted_impact_5_year / prediction.current_impact - 1) * 100).toFixed(0)}% increase
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-muted-foreground" />
                <span>Soil Health Improvement</span>
              </div>
              <span className="font-medium">{(prediction.soil_health_improvement * 100).toFixed(0)}%</span>
            </div>
            <Progress value={prediction.soil_health_improvement * 100} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-muted-foreground" />
                <span>Climate Benefit Factor</span>
              </div>
              <span className="font-medium">{(prediction.climate_factor * 100).toFixed(0)}%</span>
            </div>
            <Progress value={prediction.climate_factor * 100} className="h-2" />
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            * Predictions based on historical data, weather forecasts, and LSU AgCenter research
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
