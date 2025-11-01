import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg"
};

export function LoadingState({ 
  message = "Analyzing crop health...",
  size = "md",
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <p className={cn("text-muted-foreground animate-pulse", textSizeClasses[size])}>
        {message}
      </p>
    </div>
  );
}
