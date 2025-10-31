import { useState, useEffect, useRef, useCallback } from 'react';
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
import { VoiceInputButton } from './VoiceInputButton';
import { cn } from '@/lib/utils';
import { messageInputSchema, sanitizeInput } from '@/lib/conversational-form-validation';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const prevIsSendingRef = useRef(false);
  
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

  // Helper function to scroll to bottom with retry logic
  const scrollToBottom = useCallback(() => {
    const attemptScroll = (retries = 3) => {
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (viewport) {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
        
        // Retry if content might still be rendering
        if (retries > 0) {
          setTimeout(() => attemptScroll(retries - 1), 100);
        }
      });
    };
    attemptScroll();
  }, []);

  // Create session on mount
  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      createSession();
    }
  }, [sessionId, isCreatingSession, createSession]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessagesLengthRef.current;
    
    if (hasNewMessages) {
      // Use setTimeout to ensure DOM has rendered the new message
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
    
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Auto-scroll when AI finishes responding (loading indicator disappears)
  useEffect(() => {
    const wasLoadingNowNot = prevIsSendingRef.current && !isSendingMessage;
    
    if (wasLoadingNowNot) {
      // Give extra time for markdown content to render
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
    
    prevIsSendingRef.current = isSendingMessage;
  }, [isSendingMessage, scrollToBottom]);

  // Auto-focus input when form is ready
  useEffect(() => {
    if (!isLoadingSession && !isCreatingSession && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isLoadingSession, isCreatingSession]);

  // Handle completion
  useEffect(() => {
    if (isComplete && session && !session.completed_at) {
      console.log('🎉 Form completion triggered:', { completion: completionPercentage, extractedData });
      completeSession();
      onComplete(extractedData);
    }
  }, [isComplete, session, completeSession, extractedData, completionPercentage]);

  const handleSend = () => {
    if (!inputValue.trim() || isSendingMessage) return;
    
    console.log('💬 Sending message:', inputValue);
    
    // Validate and sanitize input
    try {
      messageInputSchema.parse({ message: inputValue });
      const sanitizedMessage = sanitizeInput(inputValue);
      sendMessage(sanitizedMessage);
      setInputValue('');
    } catch (error) {
      console.error('Invalid input:', error);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    const sanitizedTranscript = sanitizeInput(transcript);
    setInputValue(sanitizedTranscript);
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
    <Card className={cn("w-full flex flex-col max-h-[85vh]", className)}>
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

      <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden min-h-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
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
        </div>

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
        <div className="border-t p-4 flex-shrink-0 bg-background">
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
              <VoiceInputButton 
                onTranscript={handleVoiceTranscript}
                disabled={isSendingMessage}
              />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                disabled={isSendingMessage}
                className="flex-1"
                maxLength={2000}
                autoFocus
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