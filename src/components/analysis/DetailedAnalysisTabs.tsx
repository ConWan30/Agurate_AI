import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Bug, Sprout, Leaf, Cloud } from "lucide-react";

interface NutrientDeficiency {
  detected: boolean;
  severity: "none" | "mild" | "moderate" | "severe";
  description?: string;
}

interface DetailedAnalysisTabsProps {
  healthScore: number | null;
  stressLevel: string;
  visualCues?: string;
  growthStage?: string;
  canopyCoverage?: number;
  plantDensity?: string;
  fieldUniformity?: number;
  diseases?: any[] | null;
  pests?: any[] | null;
  nutrientDeficiencies?: {
    nitrogen?: NutrientDeficiency;
    phosphorus?: NutrientDeficiency;
    potassium?: NutrientDeficiency;
    other?: string[];
  };
  environmentalStress?: string;
  rootHealthIndicators?: string[];
  detailedVisualAnalysis?: string;
}

export function DetailedAnalysisTabs({
  healthScore,
  stressLevel,
  visualCues,
  growthStage,
  canopyCoverage,
  plantDensity,
  fieldUniformity,
  diseases,
  pests,
  nutrientDeficiencies,
  environmentalStress,
  rootHealthIndicators,
  detailedVisualAnalysis
}: DetailedAnalysisTabsProps) {
  return (
    <Tabs defaultValue="health" className="w-full">
      <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1">
        <TabsTrigger value="health" className="flex-col gap-1 h-auto py-2">
          <Heart className="h-4 w-4" />
          <span className="text-xs">Health</span>
        </TabsTrigger>
        <TabsTrigger value="diseases" className="flex-col gap-1 h-auto py-2">
          <Bug className="h-4 w-4" />
          <span className="text-xs">Issues</span>
        </TabsTrigger>
        <TabsTrigger value="nutrients" className="flex-col gap-1 h-auto py-2">
          <Sprout className="h-4 w-4" />
          <span className="text-xs">Nutrients</span>
        </TabsTrigger>
        <TabsTrigger value="growth" className="flex-col gap-1 h-auto py-2">
          <Leaf className="h-4 w-4" />
          <span className="text-xs">Growth</span>
        </TabsTrigger>
        <TabsTrigger value="environment" className="flex-col gap-1 h-auto py-2">
          <Cloud className="h-4 w-4" />
          <span className="text-xs">Environment</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="health" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Health Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Health Score</span>
                <span className="text-sm font-bold">
                  {healthScore != null && Number.isFinite(healthScore)
                    ? `${Math.round(healthScore)}%`
                    : '—'}
                </span>
              </div>
              {healthScore != null && Number.isFinite(healthScore) ? (
                <Progress value={healthScore} className="h-3" />
              ) : (
                <p className="text-sm text-muted-foreground">Health score not recorded for this assessment.</p>
              )}
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Status:</p>
              <Badge className="text-base">{stressLevel}</Badge>
            </div>

            {visualCues && (
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium mb-2">Visual Observations:</p>
                <p className="text-sm text-muted-foreground">{visualCues}</p>
              </div>
            )}

            {detailedVisualAnalysis && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Detailed Analysis:</p>
                <p className="text-sm leading-relaxed">{detailedVisualAnalysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="diseases" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Diseases & Pests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diseases == null ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Disease findings were not recorded for this assessment
              </p>
            ) : diseases.length > 0 ? (
              <div>
                <p className="text-sm font-semibold mb-3">Diseases Detected:</p>
                <div className="space-y-2">
                  {diseases.map((disease, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{typeof disease === 'string' ? disease : disease?.name ?? 'Unknown'}</p>
                        <Badge variant="destructive">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                This analysis reported no diseases
              </p>
            )}

            {pests == null ? null : pests.length > 0 ? (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-3">Pests Detected:</p>
                <div className="space-y-2">
                  {pests.map((pest, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{typeof pest === 'string' ? pest : pest?.name ?? 'Unknown'}</p>
                        <Badge variant="destructive">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 border-t pt-4">
                This analysis reported no pests
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="nutrients" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Nutrient Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nutrientDeficiencies && (
              <>
                {["nitrogen", "phosphorus", "potassium"].map((nutrient) => {
                  const deficiency = nutrientDeficiencies[nutrient as keyof typeof nutrientDeficiencies] as NutrientDeficiency | undefined;
                  if (!deficiency?.detected) return null;
                  
                  return (
                    <div key={nutrient} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold capitalize">{nutrient} Deficiency</p>
                        <Badge variant={
                          deficiency.severity === "severe" ? "destructive" :
                          deficiency.severity === "moderate" ? "outline" : "secondary"
                        }>
                          {deficiency.severity}
                        </Badge>
                      </div>
                      {deficiency.description && (
                        <p className="text-sm text-muted-foreground">{deficiency.description}</p>
                      )}
                    </div>
                  );
                })}
                
                {nutrientDeficiencies.other && nutrientDeficiencies.other.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <p className="font-semibold mb-2">Other Deficiencies:</p>
                    <div className="flex flex-wrap gap-2">
                      {nutrientDeficiencies.other.map((nutrient, idx) => (
                        <Badge key={idx} variant="outline">{nutrient}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!nutrientDeficiencies.nitrogen?.detected && 
                 !nutrientDeficiencies.phosphorus?.detected && 
                 !nutrientDeficiencies.potassium?.detected &&
                 (!nutrientDeficiencies.other || nutrientDeficiencies.other.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    ✓ No significant nutrient deficiencies detected
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="growth" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Growth Stage Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {growthStage && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Growth Stage:</p>
                <p className="text-2xl font-bold capitalize">{growthStage.replace(/_/g, " ")}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {canopyCoverage != null && Number.isFinite(Number(canopyCoverage)) && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Canopy Coverage</p>
                  <p className="text-3xl font-bold">{Math.round(Number(canopyCoverage))}%</p>
                </div>
              )}
              
              {fieldUniformity != null && Number.isFinite(Number(fieldUniformity)) && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Field Uniformity</p>
                  <p className="text-3xl font-bold">{Math.round(Number(fieldUniformity) * 100)}%</p>
                </div>
              )}
            </div>

            {plantDensity && (
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Plant Density Assessment:</p>
                <Badge className="text-base capitalize">{plantDensity.replace(/_/g, " ")}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="environment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Environmental Stress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {environmentalStress && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm font-medium mb-2">Environmental Stress Rating:</p>
                <p className="text-lg font-semibold capitalize">{environmentalStress.replace(/_/g, " ")}</p>
              </div>
            )}

            {rootHealthIndicators && rootHealthIndicators.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3">Root Health Indicators:</p>
                <div className="space-y-2">
                  {rootHealthIndicators.map((indicator, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg">
                      <span className="text-primary mt-0.5">•</span>
                      <p className="text-sm">{indicator}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
