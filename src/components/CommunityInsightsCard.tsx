import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Star, CheckCircle2 } from "lucide-react";
import { BestPractice } from "@/types/enhanced-features";

interface CommunityInsightsCardProps {
  practice: BestPractice;
}

export function CommunityInsightsCard({ practice }: CommunityInsightsCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {practice.practice_name}
            </CardTitle>
            <CardDescription>Community Best Practice</CardDescription>
          </div>
          {practice.lsu_researcher_id && (
            <Badge variant="default">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Cites public LSU research
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {practice.description}
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold">{practice.adoption_count}</div>
            <div className="text-xs text-muted-foreground">Farmers</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-accent/10">
            <Star className="h-5 w-5 mx-auto mb-1 text-accent" />
            <div className="text-lg font-bold">
              {practice.success_rate != null && Number.isFinite(Number(practice.success_rate))
                ? `${(Number(practice.success_rate) * 100).toFixed(0)}%`
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground">Reported success</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-secondary/10">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-secondary" />
            <div className="text-lg font-bold">
              {practice.average_savings != null &&
              Number.isFinite(Number(practice.average_savings)) &&
              Number(practice.average_savings) > 0
                ? `$${Number(practice.average_savings).toLocaleString()}`
                : '—'}
            </div>
            <div className="text-xs text-muted-foreground">Self-reported avg. savings</div>
          </div>
        </div>

        {practice.lsu_research_basis && practice.lsu_research_basis.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            <div className="text-sm font-medium">Research Backing:</div>
            <ul className="space-y-1 pl-4">
              {practice.lsu_research_basis.slice(0, 2).map((citation, idx) => (
                <li key={idx} className="text-xs text-muted-foreground list-disc">
                  {citation}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Data aggregated from {practice.adoption_count} anonymous farmer reports
        </div>
      </CardContent>
    </Card>
  );
}
