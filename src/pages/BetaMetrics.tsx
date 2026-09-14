import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedPageHeader } from "@/components/EnhancedPageHeader";
import { BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function BetaMetrics() {
  const { data: metrics } = useQuery({
    queryKey: ['beta-metrics'],
    queryFn: async () => {
      const { data: completions } = await supabase.from('tutorial_completions').select('tutorial_id, action');
      const tutorialStats = completions?.reduce((acc: any, curr) => {
        if (!acc[curr.action]) acc[curr.action] = 0;
        acc[curr.action]++;
        return acc;
      }, {});

      const { data: betaCount } = await supabase.rpc('get_beta_farmer_count');
      const totalUsers = typeof betaCount === 'number' ? betaCount : 0;
      const { count: scannerUsers } = await supabase.from('assessments').select('id', { count: 'exact', head: true });
      const { data: feedback } = await supabase.from('tutorial_feedback').select('rating');
      const avgRating = feedback?.length ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(1) : 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: weeklyScans } = await supabase.from('assessments').select('id', { count: 'exact', head: true }).gte('analyzed_at', oneWeekAgo.toISOString());

      return { tutorialStats, totalUsers: totalUsers || 0, scannerUsers: scannerUsers || 0, avgRating, weeklyScans: weeklyScans || 0 };
    }
  });

  const funnelData = [
    { stage: 'Started', count: metrics?.tutorialStats?.started || 0 },
    { stage: 'Completed', count: metrics?.tutorialStats?.completed || 0 },
    { stage: 'Skipped', count: metrics?.tutorialStats?.skipped || 0 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <EnhancedPageHeader title="Beta Program Metrics" description="Track tutorial completion and engagement" icon={BarChart3} badge={{ icon: Target, text: "Analytics" }} />
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Beta Farmers (platform)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.totalUsers || 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Tutorial Completion</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.tutorialStats?.completed ? Math.round((metrics.tutorialStats.completed / (metrics.tutorialStats.started || 1)) * 100) : 0}%</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.avgRating || 0} ⭐</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Weekly Scans</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.weeklyScans || 0}</div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Tutorial Funnel</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={funnelData}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
    </div>
  );
}
