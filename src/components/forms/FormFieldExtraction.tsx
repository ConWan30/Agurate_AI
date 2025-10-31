import { CheckCircle2, Clock, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FormFieldExtractionProps {
  extractedData: Record<string, any>;
  completionPercentage: number;
  className?: string;
  requiredFields?: string[];
}

export const FormFieldExtraction = ({
  extractedData,
  completionPercentage,
  className,
  requiredFields = []
}: FormFieldExtractionProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const isComplete = completionPercentage >= 100;
  
  // Get field status
  const getFieldStatus = (fieldName: string): 'completed' | 'pending' => {
    return extractedData[fieldName] !== undefined && extractedData[fieldName] !== null && extractedData[fieldName] !== ''
      ? 'completed'
      : 'pending';
  };

  // Count completed required fields
  const completedCount = requiredFields.filter(field => getFieldStatus(field) === 'completed').length;
  const totalCount = requiredFields.length;
  
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {isComplete ? "✅ All Information Collected" : "📋 Information Captured So Far"}
          </span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
        {Object.keys(extractedData).length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 text-xs"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-bold text-primary">{Math.round(completionPercentage)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Extracted Fields */}
      {Object.keys(extractedData).length > 0 ? (
        <>
          {/* Compact View */}
          {!showDetails && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(extractedData).slice(0, 3).map(([key, value]) => (
                <Badge
                  key={key}
                  variant="default"
                  className="gap-1 bg-primary/10 text-primary border-primary/20"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="font-medium">{formatFieldName(key)}</span>
                </Badge>
              ))}
              {Object.keys(extractedData).length > 3 && (
                <Badge variant="outline" className="gap-1">
                  +{Object.keys(extractedData).length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Detailed View */}
          {showDetails && (
            <div className="animate-in slide-in-from-top-2 duration-200 grid gap-2">
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
          )}
        </>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          No information captured yet. Continue the conversation to provide your details.
        </div>
      )}

      {/* Progress Message */}
      {!isComplete && Object.keys(extractedData).length > 0 && (
        <p className="text-xs text-muted-foreground italic">
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