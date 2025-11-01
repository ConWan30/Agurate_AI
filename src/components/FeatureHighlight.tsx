import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface FeatureHighlightProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  gradient?: "delta" | "sky" | "harvest";
}

export function FeatureHighlight({
  icon: Icon,
  title,
  description,
  badge,
  gradient = "delta"
}: FeatureHighlightProps) {
  return (
    <Card className="border-2 hover:border-primary transition-all hover-lift group overflow-hidden focus-ring" tabIndex={0}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div 
            className={`flex-shrink-0 h-12 w-12 rounded-xl gradient-${gradient} shadow-glow flex items-center justify-center group-hover:scale-110 transition-transform`}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                {title}
              </h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
