import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, Shield } from "lucide-react";
import { VarietyRecommendation } from "@/types/enhanced-features";

interface VarietyRecommendationCardProps {
  recommendation: VarietyRecommendation;
  onAdopt?: () => void;
}

export function VarietyRecommendationCard({ recommendation, onAdopt }: VarietyRecommendationCardProps) {
  const riskColors: Record<string, string> = {
    low: 'bg-health-good/10 text-health-good border-health-good/30',
    medium: 'bg-health-moderate/10 text-health-moderate border-health-moderate/30',
    high: 'bg-health-severe/10 text-health-severe border-health-severe/30',
  };
  const riskKey = String(recommendation.risk_assessment ?? '').trim().toLowerCase();
  const knownRisk = riskKey === 'low' || riskKey === 'medium' || riskKey === 'high'
    ? riskKey
    : '';
  const improvement = Number(recommendation.expected_improvement);
  const hasImprovement =
    recommendation.expected_improvement != null &&
    Number.isFinite(improvement) &&
    improvement >= 0 &&
    improvement <= 1;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Variety recommendation
            </CardTitle>
            <CardDescription>
              {recommendation.current_variety && `Current: ${recommendation.current_variety}`}
            </CardDescription>
          </div>
          {knownRisk ? (
            <Badge className={riskColors[knownRisk]}>
              {knownRisk} risk
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Risk not recorded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="text-sm text-muted-foreground mb-1">Recommended Variety</div>
          <div className="text-2xl font-bold text-primary">
            {recommendation.recommended_variety}
          </div>
        </div>

        {hasImprovement ? (
          <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/10">
            <TrendingUp className="h-8 w-8 text-accent" />
            <div>
              <div className="text-sm text-muted-foreground">Planning yield delta</div>
              <div className="text-xl font-bold text-accent">
                +{(improvement * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Illustrative estimate from cited public trial ranges — not a measured farm outcome
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No cited yield-delta estimate — variety choice is framed by field conditions only.
          </p>
        )}

        {recommendation.lsu_research_basis && recommendation.lsu_research_basis.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-primary" />
              <span>Public research framing:</span>
            </div>
            <ul className="space-y-1 pl-6">
              {recommendation.lsu_research_basis.map((citation, idx) => (
                <li key={idx} className="text-sm text-muted-foreground list-disc">
                  {citation}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          onClick={onAdopt}
          className="w-full"
        >
          Adopt This Variety
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          * Decision aid only — cites public LSU AgCenter variety guidance; not an official endorsement.
        </p>
      </CardContent>
    </Card>
  );
}
