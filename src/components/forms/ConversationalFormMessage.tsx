import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ConversationalFormMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  fieldMapping?: Record<string, any>;
  validationStatus?: 'pending' | 'valid' | 'invalid';
}

export const ConversationalFormMessage = ({
  role,
  content,
  fieldMapping,
  validationStatus
}: ConversationalFormMessageProps) => {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 items-start",
      isUser && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-primary" : "bg-primary/10"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "flex-1 max-w-[80%] space-y-2",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-lg p-3 prose prose-sm max-w-none",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        )}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Field Mapping Preview (for assistant messages) */}
        {!isUser && fieldMapping && Object.keys(fieldMapping).length > 0 && (
          <div className="bg-background border rounded-lg p-2 text-xs space-y-1">
            <p className="text-muted-foreground font-medium">Captured Information:</p>
            {Object.entries(fieldMapping).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span className="font-medium">{formatFieldName(key)}:</span>
                <span className="text-muted-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Validation Status */}
        {validationStatus && validationStatus !== 'pending' && (
          <Badge 
            variant={validationStatus === 'valid' ? 'default' : 'destructive'}
            className="gap-1"
          >
            {validationStatus === 'valid' ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Valid
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Invalid
              </>
            )}
          </Badge>
        )}
      </div>
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