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
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "severe":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStressBadgeVariant = (stressLevel: string): "default" | "secondary" | "destructive" | "outline" => {
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return "default";
      case "moderate":
        return "outline";
      case "severe":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStressBadgeClass = (stressLevel: string) => {
    const normalized = stressLevel?.toLowerCase();
    switch (normalized) {
      case "healthy":
        return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200";
      case "severe":
        return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
      default:
        return "";
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
        {/* Header - Louisiana Agricultural Theme */}
        <div className="relative overflow-hidden rounded-2xl gradient-delta p-8 md:p-12 shadow-glow">
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
              Welcome to Your Farm Dashboard
            </h1>
            <p className="text-white/90 text-base md:text-lg max-w-2xl">
              Monitor your fields and crop health with AI-powered precision agriculture for Morehouse Parish
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Quick Actions - Enhanced */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-6">Quick Actions</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Link to="/upload">
              <Card className="field-card group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-delta shadow-glow mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">New Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload crop images for AI-powered analysis
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/fields">
              <Card className="field-card group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-sky shadow-glow mb-4 group-hover:scale-110 transition-transform">
                    <MapPin className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">Manage Fields</h3>
                  <p className="text-sm text-muted-foreground">
                    {fields.length} field{fields.length !== 1 ? "s" : ""} registered
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/history">
              <Card className="field-card group cursor-pointer border-2 h-full">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-2xl gradient-harvest shadow-glow mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg md:text-xl mb-2">View History</h3>
                  <p className="text-sm text-muted-foreground">
                    Track crop health trends
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Fields Overview - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">My Fields</h2>
            <Link to="/fields">
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Manage All Fields</span>
              </Button>
            </Link>
          </div>
          {fields.length === 0 ? (
            <Card className="field-card border-dashed border-2">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-sky shadow-glow mx-auto mb-4">
                  <MapPin className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">No Fields Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by registering your first field to begin monitoring
                </p>
                <Link to="/fields">
                  <Button className="gradient-delta text-white">
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Your First Field
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((field) => {
                const cropIcons: Record<string, string> = {
                  rice: '🌾',
                  soybean: '🫘',
                  cotton: '🌿',
                  corn: '🌽'
                };
                return (
                  <Card key={field.id} className="field-card border-2">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-2xl">
                          {cropIcons[field.crop_type] || '🌱'}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{field.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {field.crop_type} • {field.acreage} acres
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Assessments - Enhanced */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Recent Crop Health Analysis</h2>
            <Link to="/history">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">View All History</span>
              </Button>
            </Link>
          </div>
          {recentAssessments.length === 0 ? (
            <Card className="field-card border-dashed border-2">
              <CardContent className="p-8 md:p-12 text-center">
                <div className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-delta shadow-glow mx-auto mb-4">
                  <Upload className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">No Analysis Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first crop image to get AI-powered health insights
                </p>
                <Link to="/upload">
                  <Button className="gradient-delta text-white">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Image
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {recentAssessments.map((assessment) => (
                <Card key={assessment.id} className="field-card border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 flex-shrink-0">
                          {getStressIcon(assessment.stress_level)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-display font-bold text-xl mb-1">{assessment.field.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {assessment.field.crop_type} • {format(new Date(assessment.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-3xl font-display font-bold text-primary">
                            {Math.round((assessment.health_score || 0) * 100)}%
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">Health Score</p>
                        </div>
                        <Badge 
                          variant={getStressBadgeVariant(assessment.stress_level)}
                          className={`${getStressBadgeClass(assessment.stress_level)} text-base px-4 py-2 font-semibold`}
                        >
                          {assessment.stress_level.charAt(0).toUpperCase() + assessment.stress_level.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}