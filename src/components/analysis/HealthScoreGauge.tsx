import { cn } from "@/lib/utils";

interface HealthScoreGaugeProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
}

export function HealthScoreGauge({ score, size = "md" }: HealthScoreGaugeProps) {
  const sizes = {
    sm: { container: "w-16 h-16", text: "text-lg" },
    md: { container: "w-24 h-24", text: "text-2xl" },
    lg: { container: "w-32 h-32", text: "text-3xl" }
  };

  const getColor = (score: number) => {
    if (score >= 80) return "text-health-good";
    if (score >= 60) return "text-health-moderate";
    return "text-health-severe";
  };

  const getStroke = (score: number) => {
    if (score >= 80) return "stroke-health-good";
    if (score >= 60) return "stroke-health-moderate";
    return "stroke-health-severe";
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative", sizes[size].container)}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", getStroke(score))}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold", sizes[size].text, getColor(score))}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}
