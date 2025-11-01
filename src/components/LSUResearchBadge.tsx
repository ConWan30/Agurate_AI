import { GraduationCap } from "lucide-react";

export function LSUResearchBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg">
      <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
      <span className="text-xs font-medium text-primary">
        Powered by LSU AgCenter Research
      </span>
    </div>
  );
}
