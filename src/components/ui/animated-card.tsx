import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function AnimatedCard({ 
  children, 
  className,
  hover = true,
  delay = 0
}: AnimatedCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true
  });

  return (
    <Card
      ref={ref}
      className={cn(
        "transition-all duration-300",
        hover && "hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
        isIntersecting ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
      style={{
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </Card>
  );
}
