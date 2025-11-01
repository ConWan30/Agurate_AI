import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface AgriculturalStatProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  delay?: number;
}

export function AgriculturalStat({
  value,
  label,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  delay = 0
}: AgriculturalStatProps) {
  return (
    <div 
      className={cn("text-center fade-in", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-mono">
        <AnimatedCounter 
          value={value} 
          duration={2000}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
