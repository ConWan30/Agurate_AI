import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Brain, Loader2, BookOpen, HelpCircle, History, Plus, Trash2, MessageSquare, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import bgSoybeanResearch from "@/assets/bg-soybean-research.jpg";
import { useDeltaConversations, type Message } from '@/hooks/useDeltaConversations';
import { formatDistanceToNow } from 'date-fns';
import { DeltaChatInput } from '@/components/DeltaChatInput';
import { PredictiveQuestions } from '@/components/PredictiveQuestions';
import { gatherUnifiedContext, formatContextForAI, enrichUnifiedContext } from '@/lib/unified-ai-intelligence';
import { createContextSnapshot } from '@/lib/conversation-memory';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useTextToSpeech } from '@/hooks/use-text-to-speech';
import type { DeltaContext } from '@/types';

export default function DeltaIntelligence() {
  const {
    conversations,
    currentConversationId,
    messages,
    setMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    startNewConversation,
    selectConversation,
  } = useDeltaConversations();

  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [fieldContext, setFieldContext] = useState<DeltaContext | null>(null);
  const [voiceResponseEnabled, setVoiceResponseEnabled] = useState(false);
  const [simplifiedLanguage, setSimplifiedLanguage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { isSupported: isTTSSupported, isSpeaking, isPaused, speak, stop, pause, resume } = useTextToSpeech({
    enabled: voiceResponseEnabled,
  });

  // Show welcome message only for new conversations
  const displayMessages = messages.length === 0 ? [{
    role: 'assistant' as const,
    content: "👋 **Welcome to Delta Intelligence!**\n\nI'm your AI farming advisor, trained on LSU AgCenter research and decades of Louisiana Delta agriculture data.\n\n💡 **Try asking me:**\n- Crop-specific advice for rice, soybeans, cotton, or corn\n- Pest & disease identification\n- Soil management strategies\n- Weather-based planting guidance\n\nWhat can I help you with today?"
  }] : messages;

  // Smooth scroll only when messages length changes (new message added), not during streaming updates
  useEffect(() => {
    if (scrollRef.current && !isLoading) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // During streaming, maintain scroll at bottom without jerky behavior
  useEffect(() => {
    if (isLoading && scrollRef.current) {
      const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const { scrollHeight, scrollTop, clientHeight } = scrollContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom) {
          scrollRef.current.scrollIntoView({ behavior: 'instant' });
        }
      }
    }
  }, [displayMessages, isLoading]);

  // Load field context for predictive questions
  useEffect(() => {
    const loadFieldContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: fields } = await supabase
        .from('fields')
        .select('id, name, crop_type')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (fields) {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('health_score, stress_level, analyzed_at')
          .eq('field_id', fields.id)
          .order('analyzed_at', { ascending: false })
          .limit(1)
          .single();

        setFieldContext({
          recentAssessment: assessment,
          cropType: fields.crop_type,
          healthScore: assessment?.health_score,
        });
      }
    };

    loadFieldContext();
  }, []);

  const streamChat = async (userMessage: string, imageUrl?: string) => {
    let conversationId = currentConversationId;

    // Create new conversation if needed
    if (!conversationId) {
      conversationId = await createConversation(userMessage);
    }

    // Save user message with optional image and context snapshot
    const messageContent = imageUrl 
      ? `[Image: ${imageUrl}]\n${userMessage}`
      : userMessage;
    const contextSnapshot = createContextSnapshot(fieldContext);
    await saveMessage(conversationId, 'user', messageContent, contextSnapshot);

    const newMessages = [...messages, { role: 'user' as const, content: messageContent }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // ✅ UNIFIED AI: Gather context for Delta Intelligence
      let unifiedContext = null;
      if (fieldContext?.recentAssessment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: fields } = await supabase
            .from('fields')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single();
          
          if (fields) {
            unifiedContext = await gatherUnifiedContext(fields.id);
          }
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delta-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ 
          messages: newMessages,
          unifiedContext: unifiedContext ? formatContextForAI(unifiedContext) : null,
          simplifiedLanguage: simplifiedLanguage
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please contact support.');
          return;
        }
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });
          let newlineIndex: number;

          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantMessage };
                  return updated;
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }

        // Save assistant message after streaming is complete with context snapshot
        if (conversationId && assistantMessage) {
          const assistantContextSnapshot = createContextSnapshot(fieldContext);
          await saveMessage(conversationId, 'assistant', assistantMessage, assistantContextSnapshot);
          
          // Speak the response if voice response is enabled
          if (voiceResponseEnabled && isTTSSupported) {
            // Remove markdown formatting for cleaner speech
            const textToSpeak = assistantMessage
              .replace(/#{1,6}\s+/g, '') // Remove headers
              .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
              .replace(/\*(.*?)\*/g, '$1') // Remove italic
              .replace(/`(.*?)`/g, '$1') // Remove code
              .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
              .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
              .trim();
            
            speak(textToSpeak);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from Delta Intelligence');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextMessage = async (message: string) => {
    if (isLoading) return;
    
    // Track analytics
    const { analytics } = await import('@/lib/analytics');
    analytics.track('delta_chat_message', {
      message_length: message.length,
      has_image: false,
    });
    
    await streamChat(message);
  };

  const handleImageMessage = async (imageUrl: string, question: string) => {
    if (isLoading) return;
    
    // Track analytics
    const { analytics } = await import('@/lib/analytics');
    analytics.track('delta_chat_message', {
      message_length: question.length,
      has_image: true,
    });
    
    await streamChat(question, imageUrl);
  };

  const handleQuestionSelect = async (question: string) => {
    await streamChat(question);
  };

  const handleNewConversation = () => {
    startNewConversation();
    setIsHistoryOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setIsHistoryOpen(false);
  };

  const tutorialSteps = [
    {
      target: 'delta-header',
      id: 'header',
      title: 'Step 1: Your AI Advisor',
      content: 'Delta Intelligence is your 24/7 Louisiana farming expert powered by LSU AgCenter research.',
      position: 'bottom' as const,
    },
    {
      target: 'predictive-questions',
      id: 'questions',
      title: 'Step 2: Quick Questions',
      content: 'Click any suggested question for instant field-specific advice based on your data.',
      position: 'top' as const,
    },
    {
      target: 'chat-input',
      id: 'chat',
      title: 'Step 3: Ask Anything',
      content: 'Type your farming questions and get LSU-backed recommendations tailored to Louisiana Delta!',
      position: 'top' as const,
    },
    {
      target: 'history-button',
      id: 'history',
      title: 'Step 4: Conversation History',
      content: 'Review past conversations and keep track of all your farming insights.',
      position: 'bottom' as const,
    },
  ];

  return (
    <>
      <TutorialTooltip steps={tutorialSteps} storageKey="delta-intelligence-tutorial-shown" />
      <div className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Streamlined Hero Header with Background */}
        <div 
          id="delta-header"
          className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(109, 40, 217, 0.92) 0%, rgba(79, 70, 229, 0.88) 100%), url(${bgSoybeanResearch})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm cotton-drift">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-1">
                  Delta Intelligence AI
                </h1>
                <p className="text-white/80 text-sm">LSU AgCenter Research • Louisiana Delta Expertise</p>
              </div>
            </div>
            <p className="text-white/90 text-base leading-relaxed">
              Get instant, Louisiana-specific farming advice powered by decades of LSU research and real Delta field data
            </p>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Clean Chat Interface */}
        <Card className="field-card shadow-field border-2">
          <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-heading font-semibold">
                {currentConversationId 
                  ? conversations.find(c => c.id === currentConversationId)?.title || 'Conversation'
                  : 'New Conversation'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={simplifiedLanguage ? "default" : "ghost"}
                size="sm"
                onClick={() => setSimplifiedLanguage(!simplifiedLanguage)}
                title={simplifiedLanguage ? "Use detailed language" : "Use simple language"}
                className="h-9"
              >
                <Languages className="h-4 w-4" />
              </Button>
              {isTTSSupported && (
                <>
                  {isSpeaking && (
                    <>
                      {isPaused ? (
                        <Button variant="ghost" size="sm" onClick={resume} title="Resume voice" className="h-9">
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={pause} title="Pause voice" className="h-9">
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={stop} title="Stop voice" className="h-9">
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant={voiceResponseEnabled ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setVoiceResponseEnabled(!voiceResponseEnabled);
                      if (voiceResponseEnabled) {
                        stop();
                      }
                    }}
                    title={voiceResponseEnabled ? "Disable voice response" : "Enable voice response"}
                    className="h-9"
                  >
                    {voiceResponseEnabled ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="h-9 px-2 sm:px-3 focus-ring"
                aria-label="Start new conversation"
              >
                <Plus className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">New</span>
              </Button>
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3 focus-ring" aria-label="View conversation history">
                    <History className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">History</span>
                    {conversations.length > 0 && (
                      <Badge variant="secondary" className="ml-1 sm:ml-2 h-5 px-1.5 text-xs">
                        {conversations.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[350px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="font-heading">Conversation History</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
                    <div className="space-y-2">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                          <p className="text-sm">No conversations yet</p>
                          <p className="text-xs mt-1">Start chatting to create your first conversation</p>
                        </div>
                      ) : (
                        conversations.map((conv) => (
                          <div
                            key={conv.id}
                            className={`group p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent ${
                              currentConversationId === conv.id ? 'bg-accent border-primary' : ''
                            }`}
                            onClick={() => handleSelectConversation(conv.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2 mb-1">
                                  {conv.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(conv.id);
                                }}
                                aria-label={`Delete conversation: ${conv.title}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[500px] p-6" ref={scrollAreaRef}>
              <div className="space-y-6">
                {displayMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-purple-600 delta-wave" aria-hidden="true" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                          : 'bg-muted/50 border border-border'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-purple-600 animate-pulse" aria-hidden="true" />
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Predictive Questions - Show at start or based on context */}
            {(displayMessages.length === 1 && displayMessages[0].role === 'assistant') || fieldContext?.recentAssessment ? (
              <PredictiveQuestions 
                fieldContext={fieldContext}
                onSelectQuestion={handleQuestionSelect}
              />
            ) : null}

            {/* Enhanced Input Area with Voice and Image */}
            <div className="p-4 border-t bg-background">
              <DeltaChatInput
                onTextMessage={handleTextMessage}
                onImageMessage={handleImageMessage}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Simplified Info Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatedCard delay={100} className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">LSU AgCenter production recommendations</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Louisiana-proven crop varieties & soil management</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Delta-specific pests, diseases & weather patterns</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Your personal field data & assessment history</p>
              </div>
            </CardContent>
          </AnimatedCard>

          <AnimatedCard delay={200} className="border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-health-good" aria-hidden="true" />
                Example Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💬 "My soybean field shows yellowing—what could it be?"
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ⏰ "Best nitrogen timing for corn in June?"
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                🐛 "How to manage rice water weevils organically?"
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                🌾 "Should I plant cotton after May floods?"
              </p>
            </CardContent>
          </AnimatedCard>
        </div>
      </div>
      </div>
    </>
  );
}