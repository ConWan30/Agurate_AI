import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bug, BookOpen } from "lucide-react";

interface DiseaseOrPest {
  name: string;
  description?: string;
  severity: "mild" | "moderate" | "severe";
  treatment?: string;
  lsu_publication?: {
    title: string;
    url: string;
  };
}

interface DiseasePestDetectionProps {
  diseases?: DiseaseOrPest[];
  pests?: DiseaseOrPest[];
}

export function DiseasePestDetection({ diseases = [], pests = [] }: DiseasePestDetectionProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "severe":
        return "destructive";
      case "moderate":
        return "outline";
      default:
        return "secondary";
    }
  };

  const renderIssueCard = (issue: DiseaseOrPest, index: number) => (
    <div key={index} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-base mb-1">{issue.name}</h4>
          {issue.description && (
            <p className="text-sm text-muted-foreground">{issue.description}</p>
          )}
        </div>
        <Badge variant={getSeverityBadge(issue.severity)} className="shrink-0">
          {issue.severity}
        </Badge>
      </div>
      
      {issue.treatment && (
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-1">Recommended Treatment:</p>
          <p className="text-sm text-muted-foreground">{issue.treatment}</p>
        </div>
      )}
      
      {issue.lsu_publication && (
        <Button variant="link" size="sm" className="p-0 h-auto" asChild>
          <a href={issue.lsu_publication.url} target="_blank" rel="noopener noreferrer">
            <BookOpen className="h-3 w-3 mr-1" />
            LSU AgCenter: {issue.lsu_publication.title}
          </a>
        </Button>
      )}
    </div>
  );

  if (diseases.length === 0 && pests.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            ✓ No significant diseases or pests detected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Disease Detection */}
      {diseases.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Diseases Detected ({diseases.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diseases.map((disease, index) => renderIssueCard(disease, index))}
          </CardContent>
        </Card>
      )}
      
      {/* Pest Detection */}
      {pests.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-warning" />
              Pests Detected ({pests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pests.map((pest, index) => renderIssueCard(pest, index))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
