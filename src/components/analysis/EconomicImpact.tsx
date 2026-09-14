import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EconomicImpactProps {
  yieldImpact: number; // percentage
  acreage?: number;
  cropType?: string;
  /** Explicit $/acre — never invent a commodity table when omitted. */
  valuePerAcre?: number;
  estimatedLoss?: number;
  treatmentCost?: number;
  /** Explicit recovery estimate — never invent a 70% recovery fraction. */
  potentialSavings?: number;
}

export function EconomicImpact({
  yieldImpact,
  acreage,
  cropType = "crop",
  valuePerAcre,
  estimatedLoss,
  treatmentCost,
  potentialSavings
}: EconomicImpactProps) {
  const hasAcreage = acreage != null && Number.isFinite(acreage) && acreage >= 0;
  const hasValuePerAcre = valuePerAcre != null && Number.isFinite(valuePerAcre) && valuePerAcre > 0;
  const calculatedLoss =
    estimatedLoss != null && Number.isFinite(estimatedLoss)
      ? estimatedLoss
      : hasAcreage && hasValuePerAcre
        ? acreage * valuePerAcre * (Math.abs(yieldImpact) / 100)
        : null;
  const calculatedSavings =
    potentialSavings != null && Number.isFinite(potentialSavings)
      ? potentialSavings
      : null;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-emerald-50 border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Economic Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
          <div>
            <p className="text-sm font-medium">Estimated Yield Impact</p>
            <p className="text-xs text-muted-foreground">
              Based on recorded yield-at-risk estimate (not inferred from health alone)
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-3xl font-bold flex items-center gap-2",
              yieldImpact > 0 ? "text-health-severe" : "text-health-good"
            )}>
              {yieldImpact > 0 ? <TrendingDown className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              {yieldImpact > 0 ? '-' : '+'}{Math.abs(yieldImpact)}%
            </p>
          </div>
        </div>

        {calculatedLoss != null ? (
          <div className="flex justify-between items-center p-4 bg-health-severe/10 rounded-lg border border-health-severe/20">
            <div>
              <p className="text-sm font-medium">Revenue-at-risk estimate</p>
              <p className="text-xs text-muted-foreground">
                {hasAcreage && hasValuePerAcre
                  ? `${acreage} acres × $${valuePerAcre}/acre × ${Math.abs(yieldImpact)}% (${cropType})`
                  : 'From provided loss estimate'}
              </p>
            </div>
            <p className="text-2xl font-bold text-health-severe">
              ${Math.round(calculatedLoss).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Dollar impact is shown only when acreage and $/acre (or an explicit loss estimate) are provided — not invented from crop averages.
          </p>
        )}

        {treatmentCost != null && Number.isFinite(treatmentCost) && (
          <div className="flex justify-between items-center p-4 bg-health-moderate/10 rounded-lg border border-health-moderate/20">
            <p className="text-sm font-medium">Treatment Investment</p>
            <p className="text-2xl font-bold text-health-moderate">
              ${treatmentCost.toLocaleString()}
            </p>
          </div>
        )}

        {calculatedSavings != null ? (
          <div className="flex justify-between items-center p-4 bg-health-good/10 rounded-lg border-2 border-health-good">
            <div>
              <p className="text-sm font-medium">Recovery estimate</p>
              <p className="text-xs text-muted-foreground">
                From provided recovery assumption — not an invented recovery rate
              </p>
            </div>
            <p className="text-3xl font-bold font-mono text-health-good">
              ${Math.round(calculatedSavings).toLocaleString()}
            </p>
          </div>
        ) : null}

        {calculatedSavings != null && treatmentCost != null && Number.isFinite(treatmentCost) && treatmentCost > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Net Benefit (Savings - Treatment):</p>
              <p className="text-3xl font-bold font-mono text-health-good">
                ${Math.round(calculatedSavings - treatmentCost).toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-right mt-1 font-mono">
              {((calculatedSavings / treatmentCost - 1) * 100).toFixed(0)}% ROI
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
