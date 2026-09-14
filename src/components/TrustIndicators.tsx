import { Badge } from "@/components/ui/badge";
import { Shield, Users, CheckCircle2, Sparkles, GraduationCap, Scan, Leaf } from "lucide-react";

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
          Informed by LSU AgCenter research
        </Badge>
        <Badge variant="outline" className="text-xs glass">
          <CheckCircle2 className="h-3 w-3 mr-1 text-success" />
          Built for Louisiana Delta
        </Badge>
        <Badge variant="outline" className="text-xs glass">
          <Users className="h-3 w-3 mr-1 text-primary" />
          Seeking first 100 beta partners
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
          <p className="text-xs text-muted-foreground">Research framing</p>
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
          <Scan className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Phone-camera scans</p>
          <p className="text-xs text-muted-foreground">Field-ready reads</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-delta flex items-center justify-center group-hover:scale-110 transition-transform">
          <Leaf className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Delta-focused</p>
          <p className="text-xs text-muted-foreground">Rice, soy, cotton, corn</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-sky flex items-center justify-center group-hover:scale-110 transition-transform">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">Closed beta</p>
          <p className="text-xs text-muted-foreground">First 100 Delta farmers</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-lg glass border border-border/50 hover:border-primary/50 transition-all hover-lift group">
        <div className="h-12 w-12 rounded-xl gradient-harvest flex items-center justify-center group-hover:scale-110 transition-transform">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold text-sm">One hero loop</p>
          <p className="text-xs text-muted-foreground">Snap → read → act</p>
        </div>
      </div>
    </div>
  );
}
