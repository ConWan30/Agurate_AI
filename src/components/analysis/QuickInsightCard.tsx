import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickInsightCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  severity: "none" | "mild" | "moderate" | "severe";
  urgent?: boolean;
}

export function QuickInsightCard({ icon: Icon, label, value, severity, urgent }: QuickInsightCardProps) {
  const severityColors = {
    none: "border-health-good/20 bg-health-good/5",
    mild: "border-agricultural-sky/20 bg-agricultural-sky/5",
    moderate: "border-health-moderate/20 bg-health-moderate/5",
    severe: "border-health-severe/20 bg-health-severe/5"
  };

  const severityTextColors = {
    none: "text-health-good",
    mild: "text-agricultural-sky",
    moderate: "text-health-moderate",
    severe: "text-health-severe"
  };

  return (
    <Card className={cn("border-2", severityColors[severity], urgent && "animate-pulse")}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-2">
          <Icon className={cn("h-6 w-6", severityTextColors[severity])} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          {urgent && (
            <Badge variant="destructive" className="text-xs">
              Urgent
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
