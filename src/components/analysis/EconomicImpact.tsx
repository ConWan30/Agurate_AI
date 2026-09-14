import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EconomicImpactProps {
  yieldImpact: number; // percentage
  acreage?: number;
  cropType?: string;
  estimatedLoss?: number;
  treatmentCost?: number;
  potentialSavings?: number;
}

export function EconomicImpact({
  yieldImpact,
  acreage = 0,
  cropType = "crop",
  estimatedLoss,
  treatmentCost,
  potentialSavings
}: EconomicImpactProps) {
  // Illustrative crop values per acre for decision-aid math (not live market quotes)
  const cropValues: Record<string, number> = {
    rice: 850,
    soybeans: 400,
    cotton: 750,
    corn: 600
  };

  const valuePerAcre = cropValues[cropType.toLowerCase()] || 500;
  const calculatedLoss = estimatedLoss || (acreage * valuePerAcre * (Math.abs(yieldImpact) / 100));
  const calculatedSavings = potentialSavings || (calculatedLoss * 0.7); // Assume 70% can be saved with treatment

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-emerald-50 border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Economic Impact Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Yield Impact */}
        <div className="flex justify-between items-center p-4 bg-background rounded-lg border">
          <div>
            <p className="text-sm font-medium">Estimated Yield Impact</p>
            <p className="text-xs text-muted-foreground">Based on current health score</p>
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

        {/* Financial Impact */}
        {acreage > 0 && (
          <>
            <div className="flex justify-between items-center p-4 bg-health-severe/10 rounded-lg border border-health-severe/20">
              <div>
                <p className="text-sm font-medium">Potential Revenue Loss</p>
                <p className="text-xs text-muted-foreground">
                  {acreage} acres × ${valuePerAcre}/acre × {Math.abs(yieldImpact)}%
                </p>
              </div>
              <p className="text-2xl font-bold text-health-severe">
                ${Math.round(calculatedLoss).toLocaleString()}
              </p>
            </div>

            {treatmentCost && (
              <div className="flex justify-between items-center p-4 bg-health-moderate/10 rounded-lg border border-health-moderate/20">
                <p className="text-sm font-medium">Treatment Investment</p>
                <p className="text-2xl font-bold text-health-moderate">
                  ${treatmentCost.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-health-good/10 rounded-lg border-2 border-health-good">
              <div>
                <p className="text-sm font-medium">Potential Savings</p>
                <p className="text-xs text-muted-foreground">
                  With recommended treatment
                </p>
              </div>
              <p className="text-3xl font-bold font-mono text-health-good">
                ${Math.round(calculatedSavings).toLocaleString()}
              </p>
            </div>

            {treatmentCost && (
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
