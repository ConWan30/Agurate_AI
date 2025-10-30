import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface EnhancedPageHeaderProps {
  icon: LucideIcon;
  badge?: {
    icon: LucideIcon;
    text: string;
  };
  title: string;
  description: string;
  gradient?: "delta" | "sky" | "harvest";
  actions?: React.ReactNode;
}

export function EnhancedPageHeader({
  icon: Icon,
  badge,
  title,
  description,
  gradient = "delta",
  actions
}: EnhancedPageHeaderProps) {
  const BadgeIcon = badge?.icon;

  return (
    <div className="relative overflow-hidden mb-8">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className={`absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl animate-float`} />
        <div className={`absolute bottom-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl animate-float`} style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-8 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-6">
              {/* Icon */}
              <div className={`flex-shrink-0 h-16 w-16 md:h-20 md:w-20 rounded-2xl gradient-${gradient} shadow-glow flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
              </div>

              {/* Content */}
              <div className="flex-1">
                {badge && BadgeIcon && (
                  <Badge className="mb-3 text-xs px-3 py-1 shadow-card animate-fade-in">
                    <BadgeIcon className="h-3 w-3 mr-1" />
                    {badge.text}
                  </Badge>
                )}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-3 animate-fade-in">
                  {title}
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl animate-fade-in" style={{ animationDelay: '100ms' }}>
                  {description}
                </p>
              </div>
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex-shrink-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
