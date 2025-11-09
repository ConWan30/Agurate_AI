import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X, CheckCircle2, Sparkles, Clock, ChevronUp, Info, Mic } from 'lucide-react';
import { useConversationalForm } from '@/hooks/use-conversational-form';
import type { FormType } from '@/types/conversational';
import { ConversationalFormMessage } from './ConversationalFormMessage';
import { VoiceInputButton } from './VoiceInputButton';
import { cn } from '@/lib/utils';
import { messageInputSchema, sanitizeInput } from '@/lib/conversational-form-validation';

interface DeltaConversationalFormProps {
  formType: FormType;
  context?: {
    fieldId?: string;
    assessmentId?: string;
    relatedData?: Record<string, unknown>;
  };
  onComplete: (extractedData: Record<string, unknown>) => void;
  onAbandon?: () => void;
  initialData?: Partial<Record<string, unknown>>;
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showFieldDetails, setShowFieldDetails] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);
  
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages.length, isSendingMessage, shouldAutoScroll]);

  // Detect if user manually scrolled up (disable auto-scroll)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Create session on mount
  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      createSession();
    }
  }, [sessionId, isCreatingSession, createSession]);

  // Auto-focus textarea when form is ready
  useEffect(() => {
    if (!isLoadingSession && !isCreatingSession && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
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
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
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
      'cooperative-application': 'Cooperative Application',
      'field_setup': 'Field Setup',
      'insurance_claim': 'Insurance Claim',
      'cooperative_invite': 'Cooperative Invitation'
    };
    return titles[formType] || 'Conversation';
  };

  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
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
    <Card className={cn("w-full flex flex-col max-h-[90vh]", className)}>
      <CardHeader className="border-b space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <span className="text-xl">🌾</span>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <Badge variant={isComplete ? "default" : "secondary"} className="gap-1">
              {isComplete && <CheckCircle2 className="h-3 w-3" />}
              {Math.round(completionPercentage)}%
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col max-h-[70vh]">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-behavior-contain px-4 md:px-6 py-6 space-y-6 scroll-smooth bg-gradient-to-b from-background to-muted/10"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(16, 185, 129, 0.3) transparent'
          }}
        >
          {messages.map((message, index) => (
            <ConversationalFormMessage
              key={`${message.created_at}-${index}`}
              role={message.role}
              content={message.content}
            />
          ))}
          
          {isSendingMessage && (
            <div className="flex items-start gap-3 md:gap-4 animate-in fade-in">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                  <span className="text-xl md:text-2xl">🌾</span>
                </div>
              </div>
              <div className="flex-1 bg-card border border-primary/10 shadow-sm rounded-2xl rounded-tl-sm p-4 md:p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">Delta Intelligence is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Scroll Anchor */}
          <div ref={scrollAnchorRef} />
        </div>

        {/* Field Extraction Summary - Sticky */}
        {Object.keys(extractedData).length > 0 && (
          <div className="border-t bg-background/95 backdrop-blur-sm px-4 md:px-6 py-3 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              {/* Field Badges */}
              <div className="flex-1 flex gap-2 flex-wrap">
                {Object.entries(extractedData).slice(0, 3).map(([field, value]) => (
                  <Badge
                    key={field}
                    variant="default"
                    className="gap-1 bg-primary/10 text-primary border-primary/20"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {formatFieldName(field)}
                  </Badge>
                ))}
                {Object.keys(extractedData).length > 3 && (
                  <Badge variant="outline" className="gap-1">
                    +{Object.keys(extractedData).length - 3} more
                  </Badge>
                )}
              </div>

              {/* Expand Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFieldDetails(!showFieldDetails)}
                className="flex-shrink-0"
              >
                <ChevronUp className={cn("h-4 w-4 transition-transform", showFieldDetails && "rotate-180")} />
              </Button>
            </div>

            {/* Expanded Details */}
            {showFieldDetails && (
              <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(extractedData).map(([field, value]) => (
                    <div key={field} className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium">
                        {formatFieldName(field)}
                      </div>
                      <div className="text-sm font-semibold">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4 md:p-6 flex-shrink-0 bg-background">
          {isComplete ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-lg font-semibold mb-1">All set!</p>
              <p className="text-sm text-muted-foreground">
                Your information has been collected successfully.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 md:gap-3 items-end bg-muted rounded-xl p-3 md:p-4 border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* Voice Input Button */}
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  disabled={isSendingMessage}
                  className="flex-shrink-0"
                />

                {/* Text Input */}
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // Auto-resize
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your response... or use voice input 🎤"
                  disabled={isSendingMessage}
                  maxLength={2000}
                  rows={1}
                  className="flex-1 resize-none bg-transparent border-none text-base md:text-sm placeholder:text-muted-foreground disabled:opacity-50 min-h-[40px] focus:outline-none focus:ring-0 visible"
                  style={{ visibility: 'visible' }}
                />

                {/* Character Counter */}
                {inputValue.length > 1500 && (
                  <div className="text-xs text-muted-foreground self-end pb-2">
                    {2000 - inputValue.length}
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSendingMessage}
                  size="icon"
                  className="flex-shrink-0 h-10 w-10 md:h-11 md:w-11"
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Helpful Hints */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Press Enter to send, Shift+Enter for new line</span>
                </div>
                <div className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  <span>Tap microphone for voice input</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};