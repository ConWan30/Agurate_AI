import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Upload, Wifi, WifiOff, Loader2, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import bgMobileScanner from "@/assets/bg-mobile-scanner.jpg";
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import TutorialTooltip from '@/components/TutorialTooltip';
import { useHaptics } from '@/hooks/use-haptics';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { gatherUnifiedContext, enrichUnifiedContext } from '@/lib/unified-ai-intelligence';

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat: number | null;
  location_lng: number | null;
}

interface GPSCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

export default function Scanner() {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [gpsCoords, setGpsCoords] = useState<GPSCoords | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [fields, setFields] = useState<Field[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [arEnabled, setArEnabled] = useState(false);
  const [aiOverlay, setAiOverlay] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { triggerHaptic } = useHaptics();
  
  // Enable keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // Fetch fields
  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('fields')
      .select('id, name, crop_type, location_lat, location_lng')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fields:', error);
      toast.error('Failed to load fields');
      return;
    }

    setFields(data || []);
  };

  // Capture GPS location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        toast.success('GPS location captured');
      },
      (error) => {
        console.error('GPS error:', error);
        toast.warning('Unable to get GPS location. Using field default.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Auto-capture GPS when component loads
  useEffect(() => {
    captureLocation();

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle camera capture
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Please use image under 10MB.');
      triggerHaptic('error');
      return;
    }

    // Compress image before setting
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      try {
        const { compressImage, validateImageFile } = await import('@/lib/image-optimization');
        const validation = validateImageFile(file);
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid image file');
          triggerHaptic('error');
          return;
        }
        processedFile = await compressImage(file);
      } catch (error) {
        console.warn('Image compression failed, using original:', error);
        // Continue with original file
      }
    }

    setImage(processedFile);
    const preview = URL.createObjectURL(processedFile);
    setImagePreview(preview);
    
    // Haptic feedback on successful capture
    triggerHaptic('success');

    // Re-capture GPS at photo time
    captureLocation();

    // If AR is enabled, generate quick overlay
    if (arEnabled && selectedFieldId) {
      await generateAROverlay(processedFile);
    }
  };

  const generateAROverlay = async (imageFile: File) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('ar-analyze', {
          body: { imageData: base64 }
        });

        if (error) throw error;
        setAiOverlay(data);
      };
    } catch (error) {
      console.error('AR overlay failed:', error);
    }
  };

  // Upload and analyze
  const handleAnalyze = async () => {
    if (!image || !selectedFieldId) {
      toast.error('Please select a field and capture an image');
      return;
    }

    setIsAnalyzing(true);

    try {
      const selectedField = fields.find(f => f.id === selectedFieldId);
      if (!selectedField) throw new Error('Field not found');

      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const fileName = `${user.id}/${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data, error: signedUrlError } = await supabase.storage
        .from('crop-images')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;
      const imageUrl = data.signedUrl;

      // ✅ UNIFIED AI: Gather context before analysis
      const unifiedContext = await gatherUnifiedContext(selectedFieldId);

      // Call analyze-crop edge function with unified context
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-crop', {
        body: {
          imageUrl: imageUrl,
          cropType: selectedField.crop_type,
          fieldId: selectedFieldId,
          unifiedContext // Include intelligence pool data
        }
      });

      if (aiError) throw aiError;

      // Save assessment to database
      const { data: assessment, error: dbError } = await supabase
        .from('assessments')
        .insert({
          field_id: selectedFieldId,
          image_url: imageUrl,
          health_score: aiResult.health_score || 0.75,
          stress_level: aiResult.stress_level || 'healthy',
          symptoms: aiResult.symptoms || [],
          confidence_score: aiResult.confidence_score || 0.85,
          photo_location_lat: gpsCoords?.lat || selectedField.location_lat,
          photo_location_lng: gpsCoords?.lng || selectedField.location_lng,
          gps_accuracy_meters: gpsCoords?.accuracy,
          captured_offline: !isOnline,
          weather_temp_f: aiResult.weather_temp_f,
          weather_precipitation_mm: aiResult.weather_precipitation_mm
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // ✅ UNIFIED AI: Enrich intelligence pool after analysis
      await enrichUnifiedContext(selectedFieldId, aiResult);

      triggerHaptic('success');
      toast.success('Analysis complete!');
      navigate(`/history`);

    } catch (error) {
      console.error('Analysis failed:', error);
      triggerHaptic('error');

      if (!isOnline) {
        toast.error('Offline mode - assessment saved locally and will sync when online');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tutorialSteps = [
    {
      id: 'welcome',
      title: 'Welcome to Field Scanner! 📸',
      content: 'Capture crop photos and get instant AI health analysis with GPS tagging.',
      position: 'top' as const,
    },
    {
      id: 'select-field',
      title: 'Step 1: Select Your Field',
      content: 'Choose which field you\'re scanning from the dropdown menu above.',
      position: 'top' as const,
    },
    {
      id: 'ar-mode',
      title: 'Optional: AR Overlay Mode',
      content: 'Enable AR mode to see real-time health indicators overlaid on your camera view!',
      position: 'top' as const,
    },
    {
      id: 'capture',
      title: 'Step 2: Capture Photo',
      content: 'Tap the camera area to take a photo of your crops. GPS location is auto-captured.',
      position: 'top' as const,
    },
    {
      id: 'analyze',
      title: 'Step 3: Analyze',
      content: 'Press "Analyze Crop Health" and our AI will detect stress, diseases, and provide recommendations!',
      position: 'bottom' as const,
    },
  ];

  return (
    <>
      <TutorialTooltip steps={tutorialSteps} storageKey="scanner-tutorial-completed" />
      <div className="min-h-screen bg-gradient-subtle pb-24">
      {/* Hero Header */}
      <div 
        className="py-12 mb-8 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(16, 185, 129, 0.92) 0%, rgba(5, 150, 105, 0.88) 100%), url(${bgMobileScanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white drop-shadow-lg">
            Mobile Field Scanner
          </h1>
          <p className="text-lg text-white/90 max-w-xl mx-auto">
            Capture crop health in the field with GPS auto-tagging and AI analysis
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Online/Offline Indicator */}
        <Card className={isOnline ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}>
          <CardContent className="flex items-center gap-2 p-4">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="font-medium text-foreground">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-destructive" aria-hidden="true" />
                <span className="font-medium text-foreground">Offline Mode</span>
              </>
            )}
          </CardContent>
        </Card>

        {/* Field Selection */}
        <Card className="field-card">
          <CardContent className="p-6 space-y-4">
            <label className="text-sm font-semibold text-foreground" htmlFor="field-select">Select Field</label>
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger id="field-select" aria-label="Select field for scanning">
                <SelectValue placeholder="-- Choose Field --" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} ({field.crop_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* AR Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="ar-mode" className="flex items-center gap-2 cursor-pointer">
                <Layers className="h-4 w-4" aria-hidden="true" />
                AR Overlay Mode
              </Label>
              <Switch
                id="ar-mode"
                checked={arEnabled}
                onCheckedChange={setArEnabled}
                aria-label="Toggle AR overlay mode"
              />
            </div>
          </CardContent>
        </Card>

        {/* Camera Capture Area with AR Overlay */}
        <Card className="field-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full aspect-[4/3] bg-muted">
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Captured crop" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* AR Overlay */}
                  {arEnabled && aiOverlay && (
                    <div className="absolute inset-0 bg-background/20 backdrop-blur-[0.5px]">
                      {/* Health Score Badge */}
                      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border text-card-foreground px-4 py-2 rounded-lg shadow-md">
                        <div className="text-xs text-muted-foreground">Health Score</div>
                        <div className="text-2xl font-bold text-foreground">
                          {(aiOverlay.health_score * 100).toFixed(0)}%
                        </div>
                      </div>

                      {/* Stress Indicator */}
                      <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm border text-card-foreground px-4 py-3 rounded-lg shadow-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {aiOverlay.stress_level === 'healthy' && '✓ Healthy'}
                            {aiOverlay.stress_level === 'moderate_stress' && '⚠ Moderate Stress'}
                            {aiOverlay.stress_level === 'severe_stress' && '⚠️ Severe Stress'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            aiOverlay.stress_level === 'healthy' 
                              ? 'bg-primary/20 text-primary'
                              : aiOverlay.stress_level === 'moderate_stress'
                              ? 'bg-secondary/20 text-secondary-foreground'
                              : 'bg-destructive/20 text-destructive'
                          }`}>
                            {aiOverlay.confidence_score && `${(aiOverlay.confidence_score * 100).toFixed(0)}% conf.`}
                          </span>
                        </div>
                        {aiOverlay.visual_cues && (
                          <p className="text-xs text-muted-foreground">{aiOverlay.visual_cues}</p>
                        )}
                      </div>

                      {/* Grid Overlay for zone detection */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,255,0,0.1)" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                    </div>
                  )}
                </>
              ) : (
                 <div 
                  className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/80 transition-colors focus-ring"
                  onClick={handleCameraClick}
                  role="button"
                  tabIndex={0}
                  aria-label="Capture crop image"
                  onKeyDown={(e) => e.key === 'Enter' && handleCameraClick()}
                >
                  <Camera className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground font-medium">Tap to capture crop image</p>
                  {arEnabled && (
                    <p className="text-xs text-blue-600 mt-2">AR mode enabled</p>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* GPS Status */}
        {gpsCoords && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-2 p-4">
              <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="text-sm text-foreground font-mono">
                Location: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                {gpsCoords.accuracy && ` (±${gpsCoords.accuracy.toFixed(0)}m)`}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={!image || !selectedFieldId || isAnalyzing}
          className="w-full h-14 text-lg gap-2 shadow-field focus-ring"
          size="lg"
          aria-label="Analyze captured crop image"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" aria-hidden="true" />
              Analyze Crop Health
            </>
          )}
        </Button>
      </div>
    </div>
    </>
  );
}
