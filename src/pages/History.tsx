import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { LoadingState } from "@/components/ui/loading-state";
import { AgriculturalBadge } from "@/components/ui/agricultural-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, AlertCircle, Calendar, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDemoData } from "@/contexts/DemoDataContext";
import bgCropTimeline from "@/assets/bg-crop-timeline.jpg";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { EmptyState } from "@/components/ui/empty-state";
import { AnalysisExecutiveSummary } from "@/components/analysis/AnalysisExecutiveSummary";
import { ActionCenter } from "@/components/analysis/ActionCenter";
import { DiseasePestDetection } from "@/components/analysis/DiseasePestDetection";
import { EconomicImpact } from "@/components/analysis/EconomicImpact";
import { HistoricalTrend } from "@/components/analysis/HistoricalTrend";
import { DetailedAnalysisTabs } from "@/components/analysis/DetailedAnalysisTabs";
import { ImageHistoryComparison } from "@/components/ImageHistoryComparison";
import { ExpertEscalationCard } from "@/components/ExpertEscalationCard";
import { PeerComparisonCard } from "@/components/PeerComparisonCard";
import { AnnotatedImage, type ImageAnnotation } from "@/components/AnnotatedImage";
import { hasHealthScore, toHealthPercent } from '@/lib/health-score';
import { resolveCropImageUrls } from '@/lib/crop-image';

interface Assessment {
  id: string;
  health_score: number;
  stress_level: string;
  symptoms: string[];
  confidence_score: number;
  weather_temp_f: number | null;
  weather_precipitation_mm: number | null;
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
  const [showImageComparison, setShowImageComparison] = useState(false);
  const [comparisonFieldId, setComparisonFieldId] = useState<string | null>(null);
  const [imageAnnotations, setImageAnnotations] = useState<ImageAnnotation[]>([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  
  // Enable keyboard shortcuts
  useGlobalKeyboardShortcuts();

  useEffect(() => {
    if (isDemoMode) {
      setAssessments(demoAssessments as any);
      setLoading(false);
    } else {
      fetchHistory();
    }
  }, [isDemoMode]);

  const fetchHistory = async () => {
    setLoading(true);
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
      if (data) {
        // Mint fresh signed URLs for display (image_url may be a storage path)
        setAssessments(await resolveCropImageUrls(supabase, data as Assessment[]));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load assessments';
      toast({
        title: "Error",
        description: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStressIcon = (stressLevel: string) => {
    switch (stressLevel) {
      case "Healthy":
        return <CheckCircle2 className="h-5 w-5 text-health-good" aria-label="Healthy crop status" />;
      case "Moderate":
        return <AlertTriangle className="h-5 w-5 text-health-moderate" aria-label="Moderate stress detected" />;
      case "Severe":
        return <AlertCircle className="h-5 w-5 text-health-severe" aria-label="Severe stress detected" />;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <LoadingState message="Loading assessment history..." size="lg" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchHistory}>
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
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            Assessment History
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl">
            Review past crop health analyses and track trends over time
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

        {assessments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Assessment History"
            description="Upload your first crop image to start tracking health trends over time. All assessments will appear here."
            actionLabel="Upload Crop Image"
            onAction={() => window.location.href = '/upload'}
          />
        ) : (
          <>
            <div className="space-y-4">
              {assessments
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((assessment, index) => (
                <SwipeableCard
                  key={assessment.id}
                  onSwipeLeft={() => {
                    const nextIndex = (currentPage - 1) * itemsPerPage + index + 1;
                    if (nextIndex < assessments.length) {
                      setSelectedAssessment(assessments[nextIndex]);
                    }
                  }}
                >
                  <div onClick={() => setSelectedAssessment(assessment)} className="cursor-pointer">
                    <AnimatedCard
                      delay={index * 50}
                      hover={true}
                      className="border-2 focus-ring"
                    >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getStressIcon(assessment.stress_level)}
                          <div>
                            <CardTitle className="text-xl font-heading">{assessment.field.name}</CardTitle>
                            <CardDescription className="capitalize">
                              {assessment.field.crop_type} • <time dateTime={assessment.created_at}>{format(new Date(assessment.created_at), "MMM d, yyyy 'at' h:mm a")}</time>
                            </CardDescription>
                          </div>
                        </div>
                       <div className="text-right">
                          <div className="text-3xl font-bold font-mono text-foreground">
                            {Math.round(toHealthPercent(assessment.health_score))}
                          </div>
                          <p className="text-xs text-muted-foreground">Health Score</p>
                        </div>
                      </div>
                    </CardHeader>
                     <CardContent>
                      <div className="flex items-center justify-between gap-4">
                        <AgriculturalBadge 
                          type={assessment.stress_level === "Healthy" ? "healthy" : assessment.stress_level === "Moderate" ? "moderate" : "severe"}
                        >
                          {assessment.stress_level}
                        </AgriculturalBadge>
                        <Button variant="outline" size="sm" className="focus-ring flex-shrink-0" aria-label={`View details for ${assessment.field.name}`}>
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </AnimatedCard>
                  </div>
                </SwipeableCard>
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
                  className="focus-ring"
                  aria-label="Go to previous page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4" aria-live="polite">
                  Page {currentPage} of {Math.ceil(assessments.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(assessments.length / itemsPerPage), p + 1))}
                  disabled={currentPage >= Math.ceil(assessments.length / itemsPerPage)}
                  className="focus-ring"
                  aria-label="Go to next page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Assessment Detail Dialog */}
        <Dialog open={!!selectedAssessment} onOpenChange={() => setSelectedAssessment(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {selectedAssessment && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-heading flex items-center gap-3">
                    {getStressIcon(selectedAssessment.stress_level)}
                    {selectedAssessment.field.name} - Comprehensive Analysis
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Image with Annotations */}
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    {imageAnnotations.length > 0 ? (
                      <AnnotatedImage
                        imageUrl={selectedAssessment.image_url}
                        annotations={imageAnnotations}
                        alt="Annotated crop assessment"
                        className="w-full"
                      />
                    ) : (
                      <>
                        <ProgressiveImage
                          src={selectedAssessment.image_url}
                          alt="Crop assessment"
                          className="w-full h-80 object-cover"
                        />
                        <div className="flex justify-end p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setLoadingAnnotations(true);
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image-annotations`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.access_token}`,
                                  },
                                  body: JSON.stringify({
                                    image_url: selectedAssessment.image_url,
                                    analysis_context: {
                                      health_score: toHealthPercent(selectedAssessment.health_score),
                                      stress_level: selectedAssessment.stress_level,
                                      symptoms: selectedAssessment.symptoms,
                                      diseases: selectedAssessment.disease_identified,
                                      pests: selectedAssessment.pest_identified,
                                    },
                                  }),
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  setImageAnnotations(data.annotations || []);
                                }
              } catch (error) {
                console.error('Error generating annotations:', error);
                toast({
                  title: "Failed to generate annotations",
                  variant: "destructive",
                });
              } finally {
                setLoadingAnnotations(false);
              }
                            }}
                            disabled={loadingAnnotations}
                          >
                            {loadingAnnotations ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              'Show Annotations'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Image History Comparison Button */}
                  {selectedAssessment.field.id && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setComparisonFieldId(selectedAssessment.field.id);
                          setShowImageComparison(true);
                        }}
                      >
                        Compare with Previous Images
                      </Button>
                    </div>
                  )}

                  {/* Executive Summary */}
                  <AnalysisExecutiveSummary
                    healthScore={toHealthPercent(selectedAssessment.health_score)}
                    stressLevel={selectedAssessment.stress_level}
                    condition={selectedAssessment.stress_level}
                    yieldImpact={selectedAssessment.estimated_yield_impact_percent != null && Number.isFinite(Number(selectedAssessment.estimated_yield_impact_percent)) ? Number(selectedAssessment.estimated_yield_impact_percent) : undefined}
                    diseaseCount={selectedAssessment.disease_identified?.length || 0}
                    diseasePressure={
                      selectedAssessment.severity_ratings?.disease_pressure === "none" ||
                      selectedAssessment.severity_ratings?.disease_pressure === "mild" ||
                      selectedAssessment.severity_ratings?.disease_pressure === "moderate" ||
                      selectedAssessment.severity_ratings?.disease_pressure === "severe"
                        ? selectedAssessment.severity_ratings.disease_pressure
                        : undefined
                    }
                    pestCount={selectedAssessment.pest_identified?.length || 0}
                    pestPressure={
                      selectedAssessment.severity_ratings?.pest_pressure === "none" ||
                      selectedAssessment.severity_ratings?.pest_pressure === "mild" ||
                      selectedAssessment.severity_ratings?.pest_pressure === "moderate" ||
                      selectedAssessment.severity_ratings?.pest_pressure === "severe"
                        ? selectedAssessment.severity_ratings.pest_pressure
                        : undefined
                    }
                    nutrientDeficiencies={
                      (selectedAssessment.nutrient_deficiencies?.nitrogen?.detected ? 1 : 0) +
                      (selectedAssessment.nutrient_deficiencies?.phosphorus?.detected ? 1 : 0) +
                      (selectedAssessment.nutrient_deficiencies?.potassium?.detected ? 1 : 0) +
                      (selectedAssessment.nutrient_deficiencies?.other?.length || 0)
                    }
                    highestNutrientSeverity={
                      selectedAssessment.nutrient_deficiencies?.nitrogen?.severity === "severe" ||
                      selectedAssessment.nutrient_deficiencies?.phosphorus?.severity === "severe" ||
                      selectedAssessment.nutrient_deficiencies?.potassium?.severity === "severe"
                        ? "severe"
                        : selectedAssessment.nutrient_deficiencies?.nitrogen?.severity === "moderate" ||
                          selectedAssessment.nutrient_deficiencies?.phosphorus?.severity === "moderate" ||
                          selectedAssessment.nutrient_deficiencies?.potassium?.severity === "moderate"
                        ? "moderate"
                        : selectedAssessment.nutrient_deficiencies?.nitrogen?.detected ||
                          selectedAssessment.nutrient_deficiencies?.phosphorus?.detected ||
                          selectedAssessment.nutrient_deficiencies?.potassium?.detected
                        ? "mild"
                        : "none"
                    }
                    criticalIssue={
                      hasHealthScore(selectedAssessment.health_score) &&
                      toHealthPercent(selectedAssessment.health_score) < 50
                        ? "Severe crop stress"
                        : (selectedAssessment.severity_ratings?.disease_pressure === "severe" ||
                            selectedAssessment.severity_ratings?.disease_pressure === "high")
                        ? "High disease pressure"
                        : undefined
                    }
                    topRecommendation={selectedAssessment.recommendations?.[0]?.recommendation_text}
                  />

                  {/* Action Center with Recommendations */}
                  {selectedAssessment.recommendations.length > 0 && (
                    <>
                      <ActionCenter
                        recommendations={selectedAssessment.recommendations.map(rec => ({
                          ...rec,
                          reasoning: rec.category ? `${rec.category.replace(/_/g, " ")} recommendation based on field analysis` : undefined
                        }))}
                        fieldId={selectedAssessment.field.id}
                        fieldName={selectedAssessment.field.name}
                        cropType={selectedAssessment.field.crop_type}
                        healthScoreBefore={toHealthPercent(selectedAssessment.health_score)}
                        stressLevel={selectedAssessment.stress_level}
                        symptoms={selectedAssessment.symptoms || []}
                        onSetReminder={(rec) => {
                          toast({ title: "Reminder feature coming soon!" });
                        }}
                        onShare={(rec) => {
                          if (navigator.share) {
                            navigator.share({
                              title: "Crop Recommendation",
                              text: rec.recommendation_text
                            });
                          } else {
                            toast({ title: "Share feature not supported on this device" });
                          }
                        }}
                      />
                      
                      {/* Peer Comparison for Treatment Recommendations */}
                      {selectedAssessment.recommendations.some(rec => 
                        rec.category === 'pest_management' || 
                        rec.category === 'fertilization' ||
                        rec.category === 'irrigation'
                      ) && (
                        <PeerComparisonCard
                          fieldId={selectedAssessment.field.id}
                          treatmentType={
                            selectedAssessment.recommendations.find(rec => 
                              rec.category === 'pest_management'
                            ) ? 'fungicide' :
                            selectedAssessment.recommendations.find(rec => 
                              rec.category === 'fertilization'
                            ) ? 'fertilizer' : 'general'
                          }
                          cropType={selectedAssessment.field.crop_type}
                          stressLevel={selectedAssessment.stress_level}
                          currentHealthScore={toHealthPercent(selectedAssessment.health_score)}
                        />
                      )}
                    </>
                  )}

                  {/* Expert Escalation */}
                  {selectedAssessment && (
                    <ExpertEscalationCard
                      issueType={
                        selectedAssessment.disease_identified && selectedAssessment.disease_identified.length > 0
                          ? 'disease'
                          : selectedAssessment.pest_identified && selectedAssessment.pest_identified.length > 0
                          ? 'pest'
                          : 'general'
                      }
                      issueDescription={
                        selectedAssessment.detailed_visual_analysis ||
                        `Health score: ${toHealthPercent(selectedAssessment.health_score)}%, Stress: ${selectedAssessment.stress_level}`
                      }
                      confidenceScore={hasHealthScore(selectedAssessment.confidence_score) ? toHealthPercent(selectedAssessment.confidence_score) : undefined}
                      fieldId={selectedAssessment.field.id}
                      assessmentId={selectedAssessment.id}
                      aiAnalysis={{
                        health_score: selectedAssessment.health_score,
                        stress_level: selectedAssessment.stress_level,
                        symptoms: selectedAssessment.symptoms,
                        diseases: selectedAssessment.disease_identified,
                        pests: selectedAssessment.pest_identified,
                      }}
                    />
                  )}

                  {/* Disease & Pest Detection */}
                  <DiseasePestDetection
                    diseases={selectedAssessment.disease_identified?.map(name => ({
                      name,
                      severity: "moderate" as const,
                      description: `${name} detected in field analysis`
                    }))}
                    pests={selectedAssessment.pest_identified?.map(name => ({
                      name,
                      severity: "moderate" as const,
                      description: `${name} detected in field analysis`
                    }))}
                  />

                  {/* Economic Impact */}
                  {selectedAssessment.estimated_yield_impact_percent != null
                    && Number.isFinite(Number(selectedAssessment.estimated_yield_impact_percent)) && (
                    <EconomicImpact
                      yieldImpact={Number(selectedAssessment.estimated_yield_impact_percent)}
                      cropType={selectedAssessment.field.crop_type}
                    />
                  )}

                  {/* Detailed Analysis Tabs */}
                  <DetailedAnalysisTabs
                    healthScore={toHealthPercent(selectedAssessment.health_score)}
                    stressLevel={selectedAssessment.stress_level}
                    growthStage={selectedAssessment.growth_stage}
                    canopyCoverage={selectedAssessment.canopy_coverage_percent}
                    plantDensity={selectedAssessment.plant_density_assessment}
                    fieldUniformity={selectedAssessment.field_uniformity_score}
                    diseases={selectedAssessment.disease_identified}
                    pests={selectedAssessment.pest_identified}
                    nutrientDeficiencies={selectedAssessment.nutrient_deficiencies}
                    environmentalStress={selectedAssessment.severity_ratings?.environmental_stress}
                    rootHealthIndicators={selectedAssessment.root_health_indicators}
                    detailedVisualAnalysis={selectedAssessment.detailed_visual_analysis}
                  />

                  {/* Weather Conditions — only when recorded values exist */}
                  {(selectedAssessment.weather_temp_f != null || selectedAssessment.weather_precipitation_mm != null) && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Weather Conditions at Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6">
                        {selectedAssessment.weather_temp_f != null && (
                        <div>
                          <p className="text-2xl font-bold">{selectedAssessment.weather_temp_f}°F</p>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                        </div>
                        )}
                        {selectedAssessment.weather_precipitation_mm != null && (
                        <div>
                          <p className="text-2xl font-bold">{selectedAssessment.weather_precipitation_mm} mm</p>
                          <p className="text-xs text-muted-foreground">Precipitation</p>
                        </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {/* Symptoms */}
                  {selectedAssessment.symptoms && selectedAssessment.symptoms.length > 0 && (
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

        {/* Image History Comparison Dialog */}
        <Dialog open={showImageComparison} onOpenChange={setShowImageComparison}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Image History Comparison</DialogTitle>
            </DialogHeader>
            {comparisonFieldId && (
              <ImageHistoryComparison
                fieldId={comparisonFieldId}
                currentAssessmentId={selectedAssessment?.id}
                onClose={() => setShowImageComparison(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  );
}