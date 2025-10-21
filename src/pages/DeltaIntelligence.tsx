import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Sparkles, Loader2, BookOpen, HelpCircle, Mic, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import bgSoybeanResearch from "@/assets/bg-soybean-research.jpg";
import { VoiceRecorder } from '@/utils/voiceRecorder';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function DeltaIntelligence() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "👋 **Welcome to Delta Intelligence!**\n\nI'm your AI farming advisor, trained on LSU AgCenter research and decades of Louisiana Delta agriculture data.\n\n💡 **Try asking me:**\n- Crop-specific advice for rice, soybeans, cotton, or corn\n- Pest & disease identification\n- Soil management strategies\n- Weather-based planting guidance\n\nWhat can I help you with today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delta-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
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
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response from Delta Intelligence');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    await streamChat(userMessage);
  };

  const playAudioResponse = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'SAz9YHcvj6GT2YYXdXww' }, // River voice
      });

      if (error) throw error;

      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }

      // Convert base64 to audio and play
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio response');
      setIsPlayingAudio(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!voiceRecorderRef.current) {
        voiceRecorderRef.current = new VoiceRecorder();
      }
      
      await voiceRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Listening... speak your question');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopVoiceRecording = async () => {
    try {
      if (!voiceRecorderRef.current) return;

      const audioBase64 = await voiceRecorderRef.current.stop();
      setIsRecording(false);
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: audioBase64 },
      });

      if (error) throw error;

      const transcribedText = data.text;
      if (transcribedText && transcribedText.trim()) {
        setInput(transcribedText);
        toast.success('Question transcribed successfully');
      } else {
        toast.error('No speech detected. Please try again.');
      }
    } catch (error) {
      console.error('Error processing voice:', error);
      toast.error('Failed to process voice input');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  const stopAudioPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  // Auto-play audio for assistant responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      autoPlayAudio &&
      lastMessage &&
      lastMessage.role === 'assistant' &&
      lastMessage.content &&
      !isLoading &&
      !isPlayingAudio
    ) {
      // Only play if the message is complete (not streaming)
      const isStreamingComplete = messages.length > 1;
      if (isStreamingComplete) {
        playAudioResponse(lastMessage.content);
      }
    }
  }, [messages, autoPlayAudio, isLoading]);

  const quickQuestions = [
    { q: "What rice varieties work best in Morehouse Parish?", icon: "🌾" },
    { q: "How do I identify soybean rust early?", icon: "🔍" },
    { q: "Best cotton planting practices for Delta soils?", icon: "☁️" },
    { q: "When should I apply nitrogen to corn fields?", icon: "🌽" }
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Streamlined Hero Header with Background */}
        <div 
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
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-1">
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
          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[550px] p-6">
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-purple-600 delta-wave" />
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
                      <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
                    </div>
                    <div className="bg-muted/50 border border-border p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Quick Start Questions - Only show at start */}
            {messages.length === 1 && (
              <div className="px-6 py-4 border-t bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <p className="text-sm font-medium text-foreground">Quick Start Questions</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickQuestions.map((item, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(item.q);
                        setTimeout(() => handleSend(), 100);
                      }}
                      className="text-xs justify-start h-auto py-3 px-4 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
                    >
                      <span className="mr-2 text-base">{item.icon}</span>
                      <span className="text-left line-clamp-2">{item.q}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area with Voice Controls */}
            <div className="p-4 border-t bg-background space-y-3">
              {/* Voice Controls Bar */}
              <div className="flex items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                    className="h-9"
                  >
                    {autoPlayAudio ? (
                      <Volume2 className="h-4 w-4 mr-2" />
                    ) : (
                      <VolumeX className="h-4 w-4 mr-2" />
                    )}
                    <span className="text-xs">Auto-play {autoPlayAudio ? 'On' : 'Off'}</span>
                  </Button>
                  {isPlayingAudio && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={stopAudioPlayback}
                      className="h-9"
                    >
                      <VolumeX className="h-4 w-4 mr-2" />
                      <span className="text-xs">Stop Audio</span>
                    </Button>
                  )}
                </div>
                {!autoPlayAudio && messages.length > 1 && messages[messages.length - 1].role === 'assistant' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => playAudioResponse(messages[messages.length - 1].content)}
                    disabled={isPlayingAudio}
                    className="h-9"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    <span className="text-xs">Play Response</span>
                  </Button>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-3"
              >
                <Button
                  type="button"
                  variant={isRecording ? "default" : "outline"}
                  size="icon"
                  onClick={toggleVoiceRecording}
                  disabled={isLoading}
                  className={`h-11 w-11 ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or speak your question..."
                  disabled={isLoading || isRecording}
                  className="flex-1 h-11"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim() || isRecording} 
                  size="icon"
                  className="h-11 w-11 gradient-delta shadow-glow"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Simplified Info Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="field-card border-2 hover-lift transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">LSU AgCenter production recommendations</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Louisiana-proven crop varieties & soil management</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Delta-specific pests, diseases & weather patterns</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Your personal field data & assessment history</p>
              </div>
            </CardContent>
          </Card>

          <Card className="field-card border-2 hover-lift transition-all bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-green-600" />
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
          </Card>
        </div>
      </div>
    </div>
  );
}