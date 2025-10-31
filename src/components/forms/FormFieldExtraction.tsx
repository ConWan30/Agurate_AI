import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FormFieldExtractionProps {
  extractedData: Record<string, any>;
  completionPercentage: number;
  className?: string;
}

export const FormFieldExtraction = ({
  extractedData,
  completionPercentage,
  className
}: FormFieldExtractionProps) => {
  const isComplete = completionPercentage >= 100;
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {isComplete ? "✅ All Information Collected" : "📋 Information Captured So Far"}
        </span>
        <Badge variant={isComplete ? "default" : "secondary"} className="ml-auto">
          {Math.round(completionPercentage)}%
        </Badge>
      </div>

      {/* Extracted Fields */}
      {Object.keys(extractedData).length > 0 ? (
        <div className="grid gap-2">
          {Object.entries(extractedData).map(([key, value]) => (
            <div
              key={key}
              className="flex items-start gap-2 text-sm bg-background rounded p-2 border"
            >
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="font-medium">{formatFieldName(key)}</span>
                <span className="text-muted-foreground ml-2">
                  {formatValue(value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          No information captured yet. Continue the conversation to provide your details.
        </div>
      )}

      {/* Progress Message */}
      {!isComplete && Object.keys(extractedData).length > 0 && (
        <p className="text-xs text-muted-foreground">
          Keep going! I'll ask about any remaining details we need.
        </p>
      )}
    </div>
  );
};

// Helper function to format field names
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// Helper function to format values
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}