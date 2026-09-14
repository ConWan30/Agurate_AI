import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp } from "lucide-react";

export function LiveCommunityActivity() {
  const { data: stats } = useQuery({
    queryKey: ['community-stats'],
    queryFn: async () => {
      // Fetch beta farmers count
      const { count: betaFarmers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Fetch total assessments
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true });

      // Fetch assessments this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: weeklyAssessments } = await supabase
        .from('assessments')
        .select('id', { count: 'exact', head: true })
        .gte('analyzed_at', oneWeekAgo.toISOString());

      return {
        betaFarmers: betaFarmers || 0,
        totalAssessments: totalAssessments || 0,
        weeklyAssessments: weeklyAssessments || 0
      };
    },
    refetchInterval: 60000 // Refresh every minute
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
              <p className="text-3xl font-bold">{stats?.betaFarmers || 0}</p>
            </div>
            <p className="text-sm text-primary-foreground/80">Beta Farmers</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <p className="text-3xl font-bold">
                {stats?.totalAssessments ? (stats.totalAssessments / 1000).toFixed(1) : 0}K
              </p>
            </div>
            <p className="text-sm text-primary-foreground/80">Total Assessments</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 space-y-1 text-xs text-primary-foreground/90">
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            {stats?.weeklyAssessments || 0} scans this week
          </p>
          <p>Closed beta for Louisiana Delta farms — savings claims not yet validated</p>
          <p>🌾 Protecting crops from Morehouse to East Carroll Parish</p>
        </div>
      </CardContent>
    </Card>
  );
}
