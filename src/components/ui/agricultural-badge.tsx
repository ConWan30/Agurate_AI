import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AgriculturalBadgeProps {
  type: "healthy" | "moderate" | "severe" | "planting" | "growing" | "harvest";
  children: React.ReactNode;
  className?: string;
}

const badgeStyles = {
  healthy: "bg-health-good/10 text-health-good border-health-good/30 hover:bg-health-good/20",
  moderate: "bg-health-moderate/10 text-health-moderate border-health-moderate/30 hover:bg-health-moderate/20",
  severe: "bg-health-severe/10 text-health-severe border-health-severe/30 hover:bg-health-severe/20",
  planting: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20",
  growing: "bg-secondary/10 text-secondary border-secondary/30 hover:bg-secondary/20",
  harvest: "bg-harvest-gold/10 text-harvest-gold border-harvest-gold/30 hover:bg-harvest-gold/20"
};

export function AgriculturalBadge({ type, children, className }: AgriculturalBadgeProps) {
  return (
    <Badge 
      className={cn(
        "transition-colors duration-200 border font-mono font-semibold",
        badgeStyles[type],
        className
      )}
    >
      {children}
    </Badge>
  );
}
