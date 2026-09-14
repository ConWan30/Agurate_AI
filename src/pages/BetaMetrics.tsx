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
      const totalUsers = typeof betaCount === 'number' ? betaCount : null;
      const { count: scannerUsers } = await supabase.from('assessments').select('id', { count: 'exact', head: true });
      const { data: feedback } = await supabase.from('tutorial_feedback').select('rating');
      const rated = (feedback ?? []).filter((f) => typeof f.rating === 'number' && Number.isFinite(f.rating));
      const avgRating = rated.length
        ? (rated.reduce((sum, f) => sum + (f.rating as number), 0) / rated.length).toFixed(1)
        : null;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const { count: weeklyScans } = await supabase.from('assessments').select('id', { count: 'exact', head: true }).gte('analyzed_at', oneWeekAgo.toISOString());

      return {
        tutorialStats,
        totalUsers,
        scannerUsers: typeof scannerUsers === 'number' ? scannerUsers : null,
        avgRating,
        weeklyScans: typeof weeklyScans === 'number' ? weeklyScans : null,
      };
    }
  });

  const funnelData = [
    { stage: 'Started', count: metrics?.tutorialStats?.started ?? null },
    { stage: 'Completed', count: metrics?.tutorialStats?.completed ?? null },
    { stage: 'Skipped', count: metrics?.tutorialStats?.skipped ?? null }
  ];

  const formatMetric = (value: number | string | null | undefined) =>
    value == null || value === '' ? '—' : String(value);

  return (
    <div className="min-h-screen bg-background">
      <EnhancedPageHeader title="Your Beta Progress" description="Your tutorial and scan activity (not platform-wide cohort metrics)" icon={BarChart3} badge={{ icon: Target, text: "Personal" }} />
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Beta Farmers (platform)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{formatMetric(metrics?.totalUsers)}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Tutorial Completion</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.tutorialStats?.completed != null && metrics?.tutorialStats?.started ? `${Math.round((metrics.tutorialStats.completed / metrics.tutorialStats.started) * 100)}%` : '—'}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Avg Rating</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{metrics?.avgRating != null ? `${metrics.avgRating} ⭐` : '—'}</div></CardContent></Card>
          <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Weekly Scans</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{formatMetric(metrics?.weeklyScans)}</div></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Your Tutorial Funnel</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={funnelData.map((d) => ({ ...d, count: d.count ?? 0 }))}><CartesianGrid strokeDasharray="3 3" opacity={0.1} /><XAxis dataKey="stage" /><YAxis /><Tooltip /><Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      </div>
    </div>
  );
}
