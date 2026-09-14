import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Bell, Share2, DollarSign, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TreatmentOutcomeDialog } from "@/components/TreatmentOutcomeDialog";
import { useState } from "react";

interface Recommendation {
  id: string;
  recommendation_text: string;
  priority: string;
  category: string;
  reasoning?: string;
  estimated_cost?: number;
  roi?: {
    roi: number;
    revenue_protected: number;
    net_benefit: number;
  };
  timing?: string;
  lsu_research_link?: string;
}

interface ActionCenterProps {
  recommendations: Recommendation[];
  onSetReminder?: (rec: Recommendation) => void;
  onShare?: (rec: Recommendation) => void;
  fieldId?: string;
  fieldName?: string;
  cropType?: string;
  healthScoreBefore?: number;
  stressLevel?: string;
  symptoms?: string[];
}

export function ActionCenter({ 
  recommendations, 
  onSetReminder, 
  onShare,
  fieldId,
  fieldName,
  cropType,
  healthScoreBefore,
  stressLevel,
  symptoms = []
}: ActionCenterProps) {
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const isTreatmentRecommendation = (category: string): boolean => {
    const categoryLower = category.toLowerCase();
    return categoryLower.includes('pest') || 
           categoryLower.includes('disease') || 
           categoryLower.includes('fertil') || 
           categoryLower.includes('irrigat') || 
           categoryLower.includes('herbic');
  };

  const handleLogOutcome = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
    setOutcomeDialogOpen(true);
  };
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "critical":
        return "destructive";
      case "high":
      case "normal":
        return "default";
      default:
        return "secondary";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "critical":
        return "🚨 Urgent";
      case "high":
      case "normal":
        return "⚡ Action";
      default:
        return "📋 Routine";
    }
  };

  const getBorderColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "critical":
        return "border-l-destructive bg-destructive/5";
      case "high":
      case "normal":
        return "border-l-warning bg-warning/5";
      default:
        return "border-l-secondary bg-secondary/5";
    }
  };

  // Sort by priority
  const sortedRecs = [...recommendations].sort((a, b) => {
    const priorityOrder = { urgent: 0, critical: 0, high: 1, normal: 1, low: 2, routine: 3 };
    return (priorityOrder[a.priority.toLowerCase() as keyof typeof priorityOrder] || 10) - 
           (priorityOrder[b.priority.toLowerCase() as keyof typeof priorityOrder] || 10);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Action Center</h2>
      <p className="text-muted-foreground">Prioritized recommendations with ROI analysis</p>
      
      {sortedRecs.map((rec) => (
        <Card key={rec.id} className={cn("border-l-4", getBorderColor(rec.priority))}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getPriorityVariant(rec.priority)}>
                    {getPriorityLabel(rec.priority)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {rec.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {rec.recommendation_text}
                </CardTitle>
              </div>
              
              {rec.roi && rec.roi.roi > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-3xl font-bold text-primary">
                    +{rec.roi.roi}%
                  </p>
                  <p className="text-xs text-muted-foreground">Expected ROI</p>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Reasoning */}
            {rec.reasoning && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {rec.reasoning}
              </p>
            )}
            
            {/* Cost Breakdown */}
            {rec.estimated_cost !== undefined && rec.estimated_cost > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Treatment Cost:
                  </span>
                  <span className="text-lg font-semibold">
                    ${rec.estimated_cost.toLocaleString()}
                  </span>
                </div>
                
                {rec.roi && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Revenue Protected:</span>
                      <span className="text-lg font-semibold text-primary">
                        ${rec.roi.revenue_protected.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Net Benefit:</span>
                      <span className="text-xl font-bold text-primary">
                        ${rec.roi.net_benefit.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Timing Guidance */}
            {rec.timing && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Recommended Timing:</span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.timing}</p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 flex-wrap">
              {rec.lsu_research_link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={rec.lsu_research_link} target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    LSU Research
                  </a>
                </Button>
              )}
              {fieldId && isTreatmentRecommendation(rec.category) && (
                <Button 
                  size="sm" 
                  onClick={() => handleLogOutcome(rec)} 
                  variant="default"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Log Outcome
                </Button>
              )}
              {onSetReminder && (
                <Button size="sm" onClick={() => onSetReminder(rec)} variant="secondary">
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
              )}
              {onShare && (
                <Button variant="outline" size="sm" onClick={() => onShare(rec)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Treatment Outcome Dialog */}
      {selectedRecommendation && fieldId && (
        <TreatmentOutcomeDialog
          open={outcomeDialogOpen}
          onClose={() => {
            setOutcomeDialogOpen(false);
            setSelectedRecommendation(null);
          }}
          recommendation={selectedRecommendation}
          fieldId={fieldId}
          fieldName={fieldName || 'Unknown Field'}
          cropType={cropType || 'unknown'}
          healthScoreBefore={healthScoreBefore}
          stressLevel={stressLevel}
          symptoms={symptoms}
        />
      )}
    </div>
  );
}
