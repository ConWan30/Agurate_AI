import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Upload, MapPin, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  acreage: number;
}

interface Assessment {
  id: string;
  health_score: number;
  stress_level: string;
  created_at: string;
  field: Field;
}

export default function Dashboard() {
  const [fields, setFields] = useState<Field[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch fields
      const { data: fieldsData } = await supabase
        .from("fields")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fieldsData) setFields(fieldsData);

      // Fetch recent assessments
      const { data: assessmentsData } = await supabase
        .from("assessments")
        .select(`
          *,
          field:fields(id, name, crop_type, acreage)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (assessmentsData) setRecentAssessments(assessmentsData as any);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStressIcon = (stressLevel: string) => {
    switch (stressLevel) {
      case "Healthy":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "Moderate":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "Severe":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStressBadgeVariant = (stressLevel: string) => {
    switch (stressLevel) {
      case "Healthy":
        return "default";
      case "Moderate":
        return "outline";
      case "Severe":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your crop health and field performance</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/upload">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                    <Upload className="h-6 w-6" />
                  </div>
                  <CardTitle>New Assessment</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload crop image for AI analysis
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/fields">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <CardTitle>Manage Fields</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {fields.length} field{fields.length !== 1 ? "s" : ""} registered
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/history">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <CardTitle>View History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track crop health trends
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Fields Overview */}
        <Card>
          <CardHeader>
            <CardTitle>My Fields</CardTitle>
            <CardDescription>Overview of your registered fields</CardDescription>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No fields registered yet</p>
                <Link to="/fields">
                  <Button>Add Your First Field</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                  <Card key={field.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{field.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {field.crop_type} • {field.acreage} acres
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assessments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <CardDescription>Latest crop health analyses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAssessments.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No assessments yet</p>
                <Link to="/upload">
                  <Button>Upload Your First Image</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStressIcon(assessment.stress_level)}
                      <div>
                        <p className="font-medium">{assessment.field.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {assessment.field.crop_type} • {format(new Date(assessment.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {Math.round((assessment.health_score || 0) * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                      <Badge variant={getStressBadgeVariant(assessment.stress_level)}>
                        {assessment.stress_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}