import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Bug, Sprout, Droplets } from "lucide-react";
import { HealthScoreGauge } from "./HealthScoreGauge";
import { QuickInsightCard } from "./QuickInsightCard";

interface AnalysisExecutiveSummaryProps {
  healthScore: number;
  stressLevel: string;
  condition: string;
  yieldImpact?: number;
  diseaseCount: number;
  diseasePressure: "none" | "mild" | "moderate" | "severe";
  pestCount: number;
  pestPressure: "none" | "mild" | "moderate" | "severe";
  nutrientDeficiencies: number;
  highestNutrientSeverity: "none" | "mild" | "moderate" | "severe";
  historicalComparison?: {
    trend: "improving" | "stable" | "declining";
    context: string;
  };
  criticalIssue?: string;
  topRecommendation?: string;
}

export function AnalysisExecutiveSummary({
  healthScore,
  stressLevel,
  condition,
  yieldImpact,
  diseaseCount,
  diseasePressure,
  pestCount,
  pestPressure,
  nutrientDeficiencies,
  highestNutrientSeverity,
  historicalComparison,
  criticalIssue,
  topRecommendation
}: AnalysisExecutiveSummaryProps) {
  const showCriticalAlert = healthScore < 50 || diseasePressure === "severe" || pestPressure === "severe";

  const TrendIndicator = () => {
    if (!historicalComparison) return null;
    
    const Icon = 
      historicalComparison.trend === "improving" ? TrendingUp :
      historicalComparison.trend === "declining" ? TrendingDown : Minus;
    
    const color = 
      historicalComparison.trend === "improving" ? "text-primary" :
      historicalComparison.trend === "declining" ? "text-destructive" : "text-muted-foreground";

    return <Icon className={`h-5 w-5 ${color}`} />;
  };

  return (
    <div className="space-y-4">
      {/* Critical Alert Banner */}
      {showCriticalAlert && criticalIssue && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">🚨 Immediate Action Required</AlertTitle>
          <AlertDescription className="text-base">
            {criticalIssue} detected. 
            {yieldImpact > 0 && ` Estimated yield impact: ${Math.abs(yieldImpact)}%.`}
            {topRecommendation && (
              <span className="block mt-2 font-semibold">
                Recommended action: {topRecommendation}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Health Score Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2 font-medium">Crop Health Score</p>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-6xl font-bold text-primary">{Math.round(healthScore)}</span>
                <span className="text-2xl text-muted-foreground">/100</span>
                {historicalComparison && <TrendIndicator />}
              </div>
              <p className="text-lg font-semibold capitalize">
                {stressLevel} - {condition}
              </p>
            </div>
            <HealthScoreGauge score={healthScore} size="lg" />
          </div>
          
          {historicalComparison && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <div className="flex items-center gap-2">
                <TrendIndicator />
                <p className="text-sm text-muted-foreground">
                  {historicalComparison.context}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickInsightCard
          icon={AlertTriangle}
          label="Diseases"
          value={diseaseCount}
          severity={diseasePressure}
          urgent={diseasePressure === "severe"}
        />
        <QuickInsightCard
          icon={Bug}
          label="Pests"
          value={pestCount}
          severity={pestPressure}
          urgent={pestPressure === "severe"}
        />
        <QuickInsightCard
          icon={Sprout}
          label="Nutrient Issues"
          value={nutrientDeficiencies}
          severity={highestNutrientSeverity}
          urgent={highestNutrientSeverity === "severe"}
        />
        <QuickInsightCard
          icon={Droplets}
          label="Yield Impact"
          value={
            yieldImpact == null || Number.isNaN(Number(yieldImpact))
              ? 'Not estimated'
              : yieldImpact > 0
                ? `-${Math.abs(yieldImpact)}%`
                : `${Math.abs(yieldImpact)}%`
          }
          severity={
            yieldImpact == null || Number.isNaN(Number(yieldImpact))
              ? 'none'
              : yieldImpact > 20
                ? 'severe'
                : yieldImpact > 10
                  ? 'moderate'
                  : yieldImpact > 0
                    ? 'mild'
                    : 'none'
          }
          urgent={yieldImpact != null && yieldImpact > 20}
        />
      </div>
    </div>
  );
}
