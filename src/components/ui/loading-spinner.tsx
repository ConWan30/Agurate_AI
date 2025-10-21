import { cn } from "@/lib/utils";
import { Sprout } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "plant";
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  variant = "default" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (variant === "plant") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <Sprout 
          className={cn(
            "absolute inset-0 text-primary animate-float",
            sizeClasses[size]
          )} 
        />
        <div className="absolute inset-0 animate-glow-pulse rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-4 border-muted border-t-primary rounded-full animate-spin",
        sizeClasses[size],
        className
      )}
    />
  );
}
