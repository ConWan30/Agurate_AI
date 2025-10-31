import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useConversationalForm, FormType } from '@/hooks/use-conversational-form';
import { ConversationalFormMessage } from './ConversationalFormMessage';
import { FormFieldExtraction } from './FormFieldExtraction';
import { cn } from '@/lib/utils';

interface DeltaConversationalFormProps {
  formType: FormType;
  context?: {
    fieldId?: string;
    assessmentId?: string;
    relatedData?: any;
  };
  onComplete: (extractedData: any) => void;
  onAbandon?: () => void;
  initialData?: Partial<any>;
  className?: string;
}

export const DeltaConversationalForm = ({
  formType,
  context,
  onComplete,
  onAbandon,
  initialData,
  className
}: DeltaConversationalFormProps) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    session,
    sessionId,
    isLoadingSession,
    createSession,
    isCreatingSession,
    messages,
    isLoadingMessages,
    sendMessage,
    isSendingMessage,
    completeSession,
    isCompletingSession,
    abandonSession,
    isComplete,
    completionPercentage,
    extractedData
  } = useConversationalForm(formType, { ...context, initialData });

  // Create session on mount
  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      createSession();
    }
  }, [sessionId, isCreatingSession, createSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSendingMessage]);

  // Handle completion
  useEffect(() => {
    if (isComplete && session && !session.completed_at) {
      completeSession();
      onComplete(extractedData);
    }
  }, [isComplete, session, completeSession, onComplete, extractedData]);

  const handleSend = () => {
    if (!inputValue.trim() || isSendingMessage) return;
    
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAbandon = () => {
    abandonSession();
    onAbandon?.();
  };

  const getFormTitle = () => {
    const titles: Record<FormType, string> = {
      'field-registration': 'Register New Field',
      'insurance-claim': 'Insurance Claim',
      'conservation-practices': 'Conservation Practices',
      'onboarding': 'Getting Started',
      'feedback': 'Share Feedback',
      'cooperative-application': 'Cooperative Application'
    };
    return titles[formType] || 'Conversation';
  };

  if (isLoadingSession || isCreatingSession) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Starting conversation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{getFormTitle()}</CardTitle>
              <p className="text-sm text-muted-foreground">Powered by Delta Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAbandon}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <Badge variant={isComplete ? "default" : "secondary"} className="gap-1">
              {isComplete && <CheckCircle2 className="h-3 w-3" />}
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[600px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ConversationalFormMessage
                key={`${message.created_at}-${index}`}
                role={message.role}
                content={message.content}
                fieldMapping={message.field_mapping ? JSON.parse(message.field_mapping) : undefined}
                validationStatus={message.validation_status}
              />
            ))}
            
            {isSendingMessage && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Field Extraction Preview */}
        {Object.keys(extractedData).length > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <FormFieldExtraction 
              extractedData={extractedData}
              completionPercentage={completionPercentage}
            />
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          {isComplete ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-lg font-semibold mb-1">All set!</p>
              <p className="text-sm text-muted-foreground">
                Your information has been collected successfully.
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                disabled={isSendingMessage}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSendingMessage}
                size="icon"
              >
                {isSendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};