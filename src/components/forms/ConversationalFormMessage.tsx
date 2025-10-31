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
  
  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  };
  
  return (
    <div className={cn(
      "flex gap-3 md:gap-4",
      isUser ? "justify-end" : "justify-start",
      "animate-in fade-in slide-in-from-bottom-2 duration-300"
    )}>
      {/* Avatar - AI */}
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="
            w-10 h-10 md:w-12 md:h-12
            rounded-full
            bg-gradient-to-br from-primary to-primary/80
            flex items-center justify-center
            shadow-lg
            ring-2 ring-primary/20
          ">
            <span className="text-xl md:text-2xl">🌾</span>
          </div>
        </div>
      )}

      {/* Message Bubble */}
      <div className={cn(
        "flex-1 max-w-[85%] md:max-w-[70%] space-y-2",
        isUser && "flex flex-col items-end"
      )}>
        <div className={cn(
          "rounded-2xl p-4 md:p-5 shadow-sm",
          isUser 
            ? "bg-muted rounded-tr-sm" 
            : "bg-card border border-primary/10 rounded-tl-sm"
        )}>
          {/* Message Content */}
          <div className={cn(
            "prose prose-sm md:prose-base max-w-none",
            isUser ? "text-foreground" : "text-foreground",
            // Custom prose styling for better readability
            "[&>p]:mb-2 [&>p:last-child]:mb-0",
            "[&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2",
            "[&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2",
            "[&>li]:mb-1",
            "[&>strong]:font-semibold [&>strong]:text-primary"
          )}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Field Extraction Indicators (for AI messages) */}
          {!isUser && fieldMapping && Object.keys(fieldMapping).length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {Object.entries(fieldMapping).map(([key, value]) => (
                  <Badge 
                    key={key} 
                    variant="secondary"
                    className="gap-1 bg-primary/10 text-primary border-primary/20 text-xs"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="font-medium">{formatFieldName(key)}:</span>
                    <span className="text-muted-foreground">{String(value)}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={cn(
            "text-xs text-muted-foreground mt-2",
            isUser && "text-right"
          )}>
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Validation Status */}
        {validationStatus && validationStatus !== 'pending' && (
          <Badge 
            variant={validationStatus === 'valid' ? 'default' : 'destructive'}
            className="gap-1 self-start"
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

      {/* Avatar - User */}
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary/10 flex items-center justify-center shadow-md">
            <User className="h-5 w-5 md:h-6 md:w-6 text-secondary" />
          </div>
        </div>
      )}
    </div>
  );
};