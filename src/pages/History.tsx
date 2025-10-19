import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, AlertCircle, Calendar, ThumbsUp, ThumbsDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDemoData } from "@/contexts/DemoDataContext";

interface Assessment {
  id: string;
  health_score: number;
  stress_level: string;
  symptoms: string[];
  confidence_score: number;
  weather_temp_f: number;
  weather_precipitation_mm: number;
  image_url: string;
  created_at: string;
  field: {
    id: string;
    name: string;
    crop_type: string;
  };
  recommendations: {
    id: string;
    recommendation_text: string;
    priority: string;
    category: string;
  }[];
}

export default function History() {
  const { isDemoMode, assessments: demoAssessments } = useDemoData();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    if (isDemoMode) {
      setAssessments(demoAssessments as any);
      setLoading(false);
    } else {
      fetchHistory();
    }
  }, [isDemoMode]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select(`
          *,
          field:fields(id, name, crop_type),
          recommendations(id, recommendation_text, priority, category)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setAssessments(data as any);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (assessmentId: string, wasHelpful: boolean) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          assessment_id: assessmentId,
          was_helpful: wasHelpful,
        });

      if (error) throw error;
      toast({ title: "Thank you for your feedback!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "normal":
        return "outline";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading assessment history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-harvest p-8 md:p-12 shadow-glow">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Assessment History
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl">
            Review past crop health analyses and track trends over time
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

        {assessments.length === 0 ? (
          <Card className="field-card border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl gradient-harvest shadow-glow mx-auto mb-4">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No assessments yet</h3>
              <p className="text-muted-foreground mb-6">Upload a crop image to get started</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {assessments
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((assessment) => (
                <Card
                  key={assessment.id}
                  className="field-card border-2 cursor-pointer"
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStressIcon(assessment.stress_level)}
                        <div>
                          <CardTitle className="text-xl">{assessment.field.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {assessment.field.crop_type} • {format(new Date(assessment.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {Math.round((assessment.health_score || 0) * 100)}
                        </div>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant={assessment.stress_level === "Healthy" ? "default" : assessment.stress_level === "Moderate" ? "outline" : "destructive"}>
                        {assessment.stress_level}
                      </Badge>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {assessments.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {Math.ceil(assessments.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(assessments.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(assessments.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Assessment Detail Dialog */}
        <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedAssessment && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedAssessment.field.name} - Assessment Results
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Image */}
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={selectedAssessment.image_url}
                      alt="Crop assessment"
                      className="w-full h-64 object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Health Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Health Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {getStressIcon(selectedAssessment.stress_level)}
                          <span className="text-3xl font-bold">
                            {Math.round((selectedAssessment.health_score || 0) * 100)}
                          </span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-muted-foreground">Confidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">
                          {Math.round((selectedAssessment.confidence_score || 0) * 100)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Symptoms */}
                  <div>
                    <h3 className="font-semibold mb-3">Observed Symptoms</h3>
                    <ul className="space-y-2">
                      {selectedAssessment.symptoms.map((symptom, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weather Conditions */}
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Weather Conditions at Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-2xl font-bold">{selectedAssessment.weather_temp_f}°F</p>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{selectedAssessment.weather_precipitation_mm} mm</p>
                          <p className="text-xs text-muted-foreground">Precipitation</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  {selectedAssessment.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Recommendations</h3>
                      <div className="space-y-3">
                        {selectedAssessment.recommendations.map((rec) => (
                          <Card key={rec.id}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4">
                                <p className="flex-1">{rec.recommendation_text}</p>
                                <Badge variant={getPriorityColor(rec.priority)}>
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 capitalize">
                                {rec.category.replace("_", " ")}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <p className="text-sm mb-3">Was this assessment helpful?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(selectedAssessment.id, true)}
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Yes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(selectedAssessment.id, false)}
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          No
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}