import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Bug, BookOpen } from "lucide-react";

interface DiseaseOrPest {
  name: string;
  description?: string;
  /** Omit or "unknown" when AI did not return severity — never invent moderate. */
  severity?: "mild" | "moderate" | "severe" | "unknown";
  treatment?: string;
  lsu_publication?: {
    title: string;
    url: string;
  };
}

interface DiseasePestDetectionProps {
  /** Omit/undefined = analysis not recorded; [] = model reported none. */
  diseases?: DiseaseOrPest[] | null;
  pests?: DiseaseOrPest[] | null;
}

export function DiseasePestDetection({ diseases, pests }: DiseasePestDetectionProps) {
  const diseaseList = diseases ?? null;
  const pestList = pests ?? null;
  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "severe":
        return "destructive";
      case "moderate":
        return "outline";
      case "mild":
        return "secondary";
      default:
        // Fail closed — unknown is not mild
        return "outline";
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
          {issue.severity && issue.severity !== "unknown" ? issue.severity : "severity unknown"}
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

  if (diseaseList == null && pestList == null) {
    return (
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Disease/pest findings were not recorded for this assessment
          </p>
        </CardContent>
      </Card>
    );
  }

  if ((diseaseList?.length ?? 0) === 0 && (pestList?.length ?? 0) === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            This analysis reported no significant diseases or pests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Disease Detection */}
      {(diseaseList?.length ?? 0) > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Diseases Detected ({diseaseList!.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diseaseList!.map((disease, index) => renderIssueCard(disease, index))}
          </CardContent>
        </Card>
      )}
      
      {/* Pest Detection */}
      {(pestList?.length ?? 0) > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-warning" />
              Pests Detected ({pestList!.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pestList!.map((pest, index) => renderIssueCard(pest, index))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
