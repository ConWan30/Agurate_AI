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
    none: "border-primary/20 bg-primary/5",
    mild: "border-blue-500/20 bg-blue-500/5",
    moderate: "border-warning/20 bg-warning/5",
    severe: "border-destructive/20 bg-destructive/5"
  };

  const severityTextColors = {
    none: "text-primary",
    mild: "text-blue-600",
    moderate: "text-warning",
    severe: "text-destructive"
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
