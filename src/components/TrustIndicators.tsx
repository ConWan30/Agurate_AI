import { Badge } from "@/components/ui/badge";
import { Shield, Award, Users, CheckCircle2, Sparkles, GraduationCap } from "lucide-react";

interface TrustIndicatorsProps {
  variant?: "compact" | "full";
  className?: string;
}

export function TrustIndicators({ variant = "full", className = "" }: TrustIndicatorsProps) {
  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <Badge variant="outline" className="text-xs glass">
          <Shield className="h-3 w-3 mr-1 text-success" />
          LSU Research-Based
        </Badge>
        <Badge variant="outline" className="text-xs glass">
          <CheckCircle2 className="h-3 w-3 mr-1 text-success" />
          95%+ Accuracy
        </Badge>
        <Badge variant="outline" className="text-xs glass">
          <Users className="h-3 w-3 mr-1 text-primary" />
          Trusted by 100+ Farmers
        </Badge>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-delta flex items-center justify-center group-hover:scale-110 transition-transform">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">LSU AgCenter</p>
          <p className="text-xs text-muted-foreground">Research-Based</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-sky flex items-center justify-center group-hover:scale-110 transition-transform">
          <Shield className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Secure & Private</p>
          <p className="text-xs text-muted-foreground">Your Data, Your Control</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-harvest flex items-center justify-center group-hover:scale-110 transition-transform">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">95%+ Accuracy</p>
          <p className="text-xs text-muted-foreground">AI Verified</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-delta flex items-center justify-center group-hover:scale-110 transition-transform">
          <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Field Tested</p>
          <p className="text-xs text-muted-foreground">Delta Proven</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-sky flex items-center justify-center group-hover:scale-110 transition-transform">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">100+ Farmers</p>
          <p className="text-xs text-muted-foreground">Beta Program</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-harvest flex items-center justify-center group-hover:scale-110 transition-transform">
          <Award className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">10+ Features</p>
          <p className="text-xs text-muted-foreground">All-In-One Platform</p>
        </div>
      </div>
    </div>
  );
}
