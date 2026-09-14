import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Shield, Zap } from "lucide-react";

/** Activity counts only — never invent dollar savings from event counts. */
export function BetaValueTracker() {
  const { data: activity } = useQuery({
    queryKey: ['beta-activity'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: assessments } = await supabase
        .from('assessments')
        .select('id, stress_level');

      const { data: claims } = await supabase
        .from('insurance_claims')
        .select('status');

      return {
        assessmentCount: assessments?.length || 0,
        severeDetections: assessments?.filter(a => a.stress_level === 'severe').length || 0,
        claimsLogged: claims?.length || 0,
        claimsApproved: claims?.filter(c => c.status === 'approved').length || 0,
      };
    }
  });

  if (!activity) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Your AgurateAI Activity
        </CardTitle>
        <CardDescription>
          Usage counts during closed beta — not dollar savings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-card border rounded-lg">
          <p className="text-5xl font-bold text-primary">
            {activity.assessmentCount}
          </p>
          <p className="text-sm text-muted-foreground mt-2">Assessments logged</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Assessments</span>
            </div>
            <span className="font-semibold">{activity.assessmentCount}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Severe stress detections</span>
            </div>
            <span className="font-semibold">{activity.severeDetections}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Insurance claim drafts</span>
            </div>
            <span className="font-semibold">
              {activity.claimsLogged}
              {activity.claimsApproved > 0 ? ` (${activity.claimsApproved} approved)` : ''}
            </span>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm space-y-1">
          <p className="font-semibold text-primary">Closed-beta pricing note</p>
          <p className="text-xs text-muted-foreground">
            A possible discount off the published plan rate may be offered when paid plans launch — not guaranteed; confirm in-app. Checkout is not open yet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
