import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Shield, Zap } from "lucide-react";

export function BetaValueTracker() {
  const { data: valueData } = useQuery({
    queryKey: ['beta-value'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch assessments
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id, health_score, stress_level');

      // Fetch insurance claims
      const { data: claims } = await supabase
        .from('insurance_claims')
        .select('status');

      // Illustrative planning weights only — not measured savings.
      const assessmentValue = (assessments?.length || 0) * 25;
      const diseaseValue = (assessments?.filter(a => a.stress_level === 'severe').length || 0) * 1000;
      const insuranceValue = (claims?.filter(c => c.status === 'approved').length || 0) * 500;

      const totalValue = assessmentValue + diseaseValue + insuranceValue;

      return {
        totalValue,
        breakdown: {
          assessmentValue,
          diseaseValue,
          insuranceValue
        },
        assessmentCount: assessments?.length || 0,
        severeDetections: assessments?.filter(a => a.stress_level === 'severe').length || 0
      };
    }
  });

  if (!valueData) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Your AgurateAI Activity
        </CardTitle>
        <CardDescription>
          Illustrative planning estimate only — not validated dollar savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total value display */}
        <div className="text-center py-4 bg-card border rounded-lg">
          <p className="text-5xl font-bold text-primary">
            ${valueData.totalValue.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Illustrative estimate this month</p>
        </div>

        {/* Value breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Assessments logged ({valueData.assessmentCount}×)</span>
            </div>
            <span className="font-semibold">${valueData.breakdown.assessmentValue}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Disease Early Detection ({valueData.severeDetections}×)</span>
            </div>
            <span className="font-semibold">${valueData.breakdown.diseaseValue}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Insurance Claims</span>
            </div>
            <span className="font-semibold">${valueData.breakdown.insuranceValue}</span>
          </div>
        </div>

        {/* Beta discount CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-primary">💡 Closed-beta pricing note</p>
          <p className="text-xs text-muted-foreground">
            Beta farmers may be offered 50% off the published plan rate when paid plans launch — checkout is not open yet
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
