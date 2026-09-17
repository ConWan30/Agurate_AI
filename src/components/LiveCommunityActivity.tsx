import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp } from "lucide-react";

export function LiveCommunityActivity() {
  const { data: stats } = useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      // Legacy entitlement count via SECURITY DEFINER aggregate RPC (not raw profiles under RLS).
      const { data: betaCount, error: betaError } = await supabase.rpc('get_beta_farmer_count');
      if (betaError) throw betaError;

      // Assessment counts under RLS reflect the signed-in user's own rows only.
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: weeklyAssessments } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .gte('analyzed_at', oneWeekAgo.toISOString());

      return {
        accountCount: typeof betaCount === 'number' ? betaCount : 0,
        totalAssessments: totalAssessments || 0,
        weeklyAssessments: weeklyAssessments || 0,
      };
    },
    refetchInterval: 60000,
  });

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary-foreground">
          <Activity className="h-5 w-5" />
          AgurateAI Community
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <Users className="h-4 w-4 opacity-80" />
              <p className="text-3xl font-bold">{stats?.accountCount || 0}</p>
            </div>
            <p className="text-sm text-primary-foreground/80">Public Accounts</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <p className="text-3xl font-bold">{stats?.totalAssessments || 0}</p>
            </div>
            <p className="text-sm text-primary-foreground/80">Your Assessments</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 space-y-1 text-xs text-primary-foreground/90">
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            {stats?.weeklyAssessments || 0} of your scans this week
          </p>
          <p>Public decision aid — not a diagnosis or guaranteed yield outcome</p>
          <p>Evidence bound: Morehouse Parish soybean observations remain the validation focus</p>
        </div>
      </CardContent>
    </Card>
  );
}
