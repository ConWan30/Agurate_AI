import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessibleIconProps {
  icon: LucideIcon;
  label: string;
  className?: string;
  decorative?: boolean;
}

export function AccessibleIcon({ 
  icon: Icon, 
  label, 
  className,
  decorative = false 
}: AccessibleIconProps) {
  if (decorative) {
    return <Icon className={cn(className)} aria-hidden="true" />;
  }

  return (
    <>
      <Icon className={cn(className)} aria-label={label} role="img" />
      <span className="sr-only">{label}</span>
    </>
  );
}
