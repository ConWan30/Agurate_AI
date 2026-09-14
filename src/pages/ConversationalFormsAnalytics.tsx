import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConversationalFormAnalytics } from '@/hooks/use-conversational-form-analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, MessageSquare, Mic, Star, CheckCircle2, XCircle, Clock } from 'lucide-react';

const COLORS = ['#10B981', '#0078D4', '#F59E0B', '#EF4444'];

export default function ConversationalFormsAnalytics() {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);
  const { completionMetrics, feedbackMetrics, sessionStats, isLoading } = useConversationalFormAnalytics(timeRange);

  const getFormTypeLabel = (formType: string) => {
    const labels: Record<string, string> = {
      'field-registration': 'Field Registration',
      'insurance-claim': 'Insurance Claim',
      'conservation-practices': 'Conservation Practices',
      'onboarding': 'Onboarding'
    };
    return labels[formType] || formType;
  };

  // Prepare chart data
  const completionChartData = sessionStats ? Object.keys(sessionStats).map(formType => ({
    name: getFormTypeLabel(formType),
    completed: sessionStats[formType].completed,
    abandoned: sessionStats[formType].abandoned,
    rate: sessionStats[formType].total > 0 
      ? Math.round((sessionStats[formType].completed / sessionStats[formType].total) * 100)
      : 0
  })) : [];

  const avgTimeChartData = sessionStats ? Object.keys(sessionStats).map(formType => ({
    name: getFormTypeLabel(formType),
    avgTime: Math.round(sessionStats[formType].avgTime)
  })) : [];

  const preferenceData = feedbackMetrics ? [
    { name: 'Conversational', value: feedbackMetrics.preferred_conversational },
    { name: 'Traditional', value: feedbackMetrics.preferred_traditional }
  ] : [];

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Conversational Forms Analytics</h1>
            <p className="text-muted-foreground">
              Your conversational form activity (session-scoped — not platform-wide cohort metrics)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 7 ? 'default' : 'outline'}
              onClick={() => setTimeRange(7)}
            >
              Last 7 Days
            </Button>
            <Button
              variant={timeRange === 30 ? 'default' : 'outline'}
              onClick={() => setTimeRange(30)}
            >
              Last 30 Days
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionStats ? Object.values(sessionStats).reduce((sum, s) => sum + s.total, 0) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Across all form types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {sessionStats && Object.values(sessionStats).length > 0
                  ? Math.round(
                      (Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0) /
                      Math.max(Object.values(sessionStats).reduce((sum, s) => sum + s.total, 0), 1)) * 100
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Target: 90%+</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {feedbackMetrics && Number.isFinite(Number(feedbackMetrics.avg_rating)) ? Number(feedbackMetrics.avg_rating).toFixed(1) : 'n/a'} ⭐
              </div>
              <p className="text-xs text-muted-foreground">
                From {feedbackMetrics?.feedback_count || 0} responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionStats ? Math.round(
                  Object.values(sessionStats).reduce((sum, s) => sum + s.avgTime, 0) /
                  Object.keys(sessionStats).length
                ) : 0}s
              </div>
              <p className="text-xs text-muted-foreground">Average time across tracked sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="completion" className="space-y-4">
          <TabsList>
            <TabsTrigger value="completion">Completion Rates</TabsTrigger>
            <TabsTrigger value="time">Completion Time</TabsTrigger>
            <TabsTrigger value="preferences">User Preferences</TabsTrigger>
            <TabsTrigger value="details">Form Details</TabsTrigger>
          </TabsList>

          <TabsContent value="completion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Form Type</CardTitle>
                <CardDescription>
                  Completed vs. abandoned sessions across different form types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={completionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#10B981" name="Completed" />
                    <Bar dataKey="abandoned" fill="#EF4444" name="Abandoned" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Average Completion Time</CardTitle>
                <CardDescription>
                  Time taken to complete each form type (in seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={avgTimeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgTime" fill="#0078D4" name="Avg Time (seconds)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Farmer Preferences</CardTitle>
                <CardDescription>
                  Conversational vs. traditional form preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={preferenceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const { name, value, percent } = props;
                          const pct = typeof percent === 'number' ? (percent * 100).toFixed(0) : '0';
                          return `${name}: ${value} (${pct}%)`;
                        }}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preferenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Total responses: {feedbackMetrics?.feedback_count || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4">
              {sessionStats && Object.keys(sessionStats).map((formType) => {
                const stats = sessionStats[formType];
                const completionRate = stats.total > 0 
                  ? Math.round((stats.completed / stats.total) * 100)
                  : 0;
                
                return (
                  <Card key={formType}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{getFormTypeLabel(formType)}</CardTitle>
                        <Badge variant={completionRate >= 90 ? 'default' : 'secondary'}>
                          {completionRate}% completion
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Total Sessions</p>
                          <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Completed</p>
                          <p className="text-2xl font-bold text-primary">{stats.completed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Avg Time</p>
                          <p className="text-2xl font-bold">{Math.round(stats.avgTime)}s</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Completion Rate</span>
                          <span className="text-sm font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Success Metrics Tracking</CardTitle>
            <CardDescription>Progress toward target goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completion Rate (Target: 90%+)</span>
                <Badge variant={
                  sessionStats && Object.values(sessionStats).length > 0 && 
                  (Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0) / 
                  Object.values(sessionStats).reduce((sum, s) => sum + s.total, 0)) >= 0.9 
                    ? 'default' 
                    : 'secondary'
                }>
                  {sessionStats && Object.values(sessionStats).length > 0
                    ? Math.round((Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0) / 
                      Object.values(sessionStats).reduce((sum, s) => sum + s.total, 0)) * 100)
                    : 0}%
                </Badge>
              </div>
              <Progress 
                value={sessionStats && Object.values(sessionStats).length > 0
                  ? (Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0) / 
                    Object.values(sessionStats).reduce((sum, s) => sum + s.total, 0)) * 100
                  : 0
                } 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Rating (Target: 4.5+ stars)</span>
                <Badge variant={feedbackMetrics && feedbackMetrics.avg_rating >= 4.5 ? 'default' : 'secondary'}>
                  {feedbackMetrics && Number.isFinite(Number(feedbackMetrics.avg_rating)) ? Number(feedbackMetrics.avg_rating).toFixed(1) : 'n/a'} ⭐
                </Badge>
              </div>
              <Progress 
                value={feedbackMetrics ? (feedbackMetrics.avg_rating / 5) * 100 : 0} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Feedback Submission (Target: 70%+)</span>
                <Badge variant={
                  feedbackMetrics && sessionStats && Object.values(sessionStats).length > 0 &&
                  (feedbackMetrics.feedback_count / Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0)) >= 0.7
                    ? 'default'
                    : 'secondary'
                }>
                  {feedbackMetrics && sessionStats && Object.values(sessionStats).length > 0
                    ? Math.round((feedbackMetrics.feedback_count / Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0)) * 100)
                    : 0}%
                </Badge>
              </div>
              <Progress 
                value={
                  feedbackMetrics && sessionStats && Object.values(sessionStats).length > 0
                    ? (feedbackMetrics.feedback_count / Object.values(sessionStats).reduce((sum, s) => sum + s.completed, 0)) * 100
                    : 0
                } 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
