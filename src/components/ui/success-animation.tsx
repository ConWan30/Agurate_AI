import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SuccessAnimationProps {
  message?: string;
  className?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ 
  message = "Analysis Complete!",
  className,
  onComplete
}: SuccessAnimationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShow(true), 50);
    
    // Call onComplete after animation
    if (onComplete) {
      const completeTimer = setTimeout(onComplete, 2000);
      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    }
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <div 
        className={cn(
          "transition-all duration-500",
          show ? "scale-100 opacity-100" : "scale-75 opacity-0"
        )}
      >
        <CheckCircle className="h-16 w-16 text-primary animate-[scale-in_0.5s_ease-out]" />
      </div>
      <p className={cn(
        "text-primary font-semibold transition-all duration-500 delay-200",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}>
        {message}
      </p>
    </div>
  );
}
