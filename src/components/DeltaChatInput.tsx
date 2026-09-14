import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeltaChatInputProps {
  onTextMessage: (message: string) => void;
  onImageMessage: (imageUrl: string, question: string) => void;
  disabled: boolean;
}

export const DeltaChatInput = ({ onTextMessage, onImageMessage, disabled }: DeltaChatInputProps) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { transcript, listening, supported: voiceSupported, startListening, stopListening } = useSpeechRecognition();

  // Update input when speech transcript changes
  useState(() => {
    if (transcript && !listening) {
      setInput(transcript);
    }
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB');
        return;
      }
      
      // Compress image before setting
      try {
        const { compressImage, validateImageFile } = await import('@/lib/image-optimization');
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid image file');
          return;
        }
        const compressed = await compressImage(file);
        setSelectedImage(compressed);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressed);
      } catch (error) {
        // Fallback to original if compression fails
        console.warn('Image compression failed, using original:', error);
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    // Owner-prefixed path required by crop-images storage RLS
    const filePath = `${user.id}/chat-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('crop-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data, error: signedUrlError } = await supabase.storage
      .from('crop-images')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) throw signedUrlError;
    return data.signedUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (selectedImage && input.trim()) {
      setIsUploading(true);
      try {
        const imageUrl = await uploadImage(selectedImage);
        onImageMessage(imageUrl, input.trim());
        setInput('');
        setSelectedImage(null);
        setImagePreview(null);
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    } else if (input.trim()) {
      onTextMessage(input.trim());
      setInput('');
    }
  };

  const handleVoiceInput = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="Selected crop" 
            className="h-24 w-24 object-cover rounded-lg border-2 border-primary"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={clearImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        {voiceSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`h-11 w-11 shrink-0 ${listening ? 'bg-destructive text-white animate-pulse' : ''}`}
            onClick={handleVoiceInput}
            disabled={disabled || isUploading}
          >
            <Mic className="h-4 w-4" />
          </Button>
        )}

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedImage ? "Ask about this image..." : "Type your question or use voice..."}
          disabled={disabled || isUploading}
          className="flex-1 h-11"
        />
        
        <Button 
          type="submit" 
          disabled={disabled || !input.trim() || isUploading}
          size="icon"
          className="h-11 w-11 shrink-0 gradient-delta shadow-glow"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      
      {listening && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          🎤 Listening... Speak now
        </p>
      )}
    </div>
  );
};
