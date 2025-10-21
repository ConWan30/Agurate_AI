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
import bgCropTimeline from "@/assets/bg-crop-timeline.jpg";

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
  growth_stage?: string;
  disease_identified?: string[];
  pest_identified?: string[];
  nutrient_deficiencies?: any;
  severity_ratings?: any;
  field_uniformity_score?: number;
  estimated_yield_impact_percent?: number;
  canopy_coverage_percent?: number;
  plant_density_assessment?: string;
  root_health_indicators?: string[];
  detailed_visual_analysis?: string;
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
      <div 
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(251, 146, 60, 0.92) 0%, rgba(249, 115, 22, 0.88) 100%), url(${bgCropTimeline})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
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

                  {/* Enhanced Analysis Section */}
                  {selectedAssessment.detailed_visual_analysis && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-lg">Detailed Visual Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{selectedAssessment.detailed_visual_analysis}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Growth & Field Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedAssessment.growth_stage && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-1">Growth Stage</p>
                          <p className="text-lg font-semibold">{selectedAssessment.growth_stage}</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedAssessment.canopy_coverage_percent !== undefined && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-1">Canopy Coverage</p>
                          <p className="text-lg font-semibold">{Math.round(selectedAssessment.canopy_coverage_percent)}%</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedAssessment.field_uniformity_score !== undefined && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-1">Field Uniformity</p>
                          <p className="text-lg font-semibold">{Math.round(selectedAssessment.field_uniformity_score * 100)}%</p>
                        </CardContent>
                      </Card>
                    )}
                    {selectedAssessment.plant_density_assessment && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground mb-1">Plant Density</p>
                          <p className="text-lg font-semibold capitalize">{selectedAssessment.plant_density_assessment.replace('_', ' ')}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Yield Impact */}
                  {selectedAssessment.estimated_yield_impact_percent !== undefined && (
                    <Card className={selectedAssessment.estimated_yield_impact_percent > 10 ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Estimated Yield Impact</p>
                            <p className="text-2xl font-bold">{Math.abs(Math.round(selectedAssessment.estimated_yield_impact_percent))}% {selectedAssessment.estimated_yield_impact_percent > 0 ? 'Loss' : 'Gain'}</p>
                          </div>
                          <AlertTriangle className={`h-8 w-8 ${selectedAssessment.estimated_yield_impact_percent > 10 ? 'text-destructive' : 'text-warning'}`} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Disease & Pest Detection */}
                  {(selectedAssessment.disease_identified && selectedAssessment.disease_identified.length > 0) || 
                   (selectedAssessment.pest_identified && selectedAssessment.pest_identified.length > 0) ? (
                    <Card className="border-destructive/30 bg-destructive/5">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          Detected Issues
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedAssessment.disease_identified && selectedAssessment.disease_identified.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Diseases:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedAssessment.disease_identified.map((disease, idx) => (
                                <Badge key={idx} variant="destructive">{disease}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedAssessment.pest_identified && selectedAssessment.pest_identified.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold mb-2">Pests:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedAssessment.pest_identified.map((pest, idx) => (
                                <Badge key={idx} variant="destructive">{pest}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                  {/* Nutrient Deficiencies */}
                  {selectedAssessment.nutrient_deficiencies && (
                    <>
                      {(selectedAssessment.nutrient_deficiencies.nitrogen?.detected || 
                        selectedAssessment.nutrient_deficiencies.phosphorus?.detected || 
                        selectedAssessment.nutrient_deficiencies.potassium?.detected ||
                        selectedAssessment.nutrient_deficiencies.other?.length > 0) && (
                        <Card className="border-warning/30 bg-warning/5">
                          <CardHeader>
                            <CardTitle className="text-lg">Nutrient Deficiencies</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {selectedAssessment.nutrient_deficiencies.nitrogen?.detected && (
                                <div className="p-3 bg-background rounded-lg">
                                  <p className="text-sm font-semibold">Nitrogen (N)</p>
                                  <Badge variant={selectedAssessment.nutrient_deficiencies.nitrogen.severity === 'severe' ? 'destructive' : 'outline'}>
                                    {selectedAssessment.nutrient_deficiencies.nitrogen.severity}
                                  </Badge>
                                </div>
                              )}
                              {selectedAssessment.nutrient_deficiencies.phosphorus?.detected && (
                                <div className="p-3 bg-background rounded-lg">
                                  <p className="text-sm font-semibold">Phosphorus (P)</p>
                                  <Badge variant={selectedAssessment.nutrient_deficiencies.phosphorus.severity === 'severe' ? 'destructive' : 'outline'}>
                                    {selectedAssessment.nutrient_deficiencies.phosphorus.severity}
                                  </Badge>
                                </div>
                              )}
                              {selectedAssessment.nutrient_deficiencies.potassium?.detected && (
                                <div className="p-3 bg-background rounded-lg">
                                  <p className="text-sm font-semibold">Potassium (K)</p>
                                  <Badge variant={selectedAssessment.nutrient_deficiencies.potassium.severity === 'severe' ? 'destructive' : 'outline'}>
                                    {selectedAssessment.nutrient_deficiencies.potassium.severity}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Severity Ratings */}
                  {selectedAssessment.severity_ratings && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Severity Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAssessment.severity_ratings.disease_pressure && selectedAssessment.severity_ratings.disease_pressure !== 'none' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Disease Pressure:</span>
                              <Badge variant={selectedAssessment.severity_ratings.disease_pressure === 'severe' || selectedAssessment.severity_ratings.disease_pressure === 'high' ? 'destructive' : 'outline'}>
                                {selectedAssessment.severity_ratings.disease_pressure}
                              </Badge>
                            </div>
                          )}
                          {selectedAssessment.severity_ratings.pest_pressure && selectedAssessment.severity_ratings.pest_pressure !== 'none' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Pest Pressure:</span>
                              <Badge variant={selectedAssessment.severity_ratings.pest_pressure === 'severe' || selectedAssessment.severity_ratings.pest_pressure === 'high' ? 'destructive' : 'outline'}>
                                {selectedAssessment.severity_ratings.pest_pressure}
                              </Badge>
                            </div>
                          )}
                          {selectedAssessment.severity_ratings.environmental_stress && selectedAssessment.severity_ratings.environmental_stress !== 'none' && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Environmental Stress:</span>
                              <Badge variant={selectedAssessment.severity_ratings.environmental_stress === 'severe' || selectedAssessment.severity_ratings.environmental_stress === 'high' ? 'destructive' : 'outline'}>
                                {selectedAssessment.severity_ratings.environmental_stress}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Root Health Indicators */}
                  {selectedAssessment.root_health_indicators && selectedAssessment.root_health_indicators.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Root Health Indicators</h3>
                      <ul className="space-y-2">
                        {selectedAssessment.root_health_indicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span className="text-sm">{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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