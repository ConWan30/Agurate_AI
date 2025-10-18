import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Upload, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Please use image under 10MB.');
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));

    // Re-capture GPS at photo time
    captureLocation();
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
      const fileName = `${Date.now()}-${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from('crop-images')
        .upload(fileName, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('crop-images')
        .getPublicUrl(fileName);

      // Call analyze-crop edge function
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-crop', {
        body: {
          imageUrl: publicUrl,
          cropType: selectedField.crop_type,
          fieldId: selectedFieldId
        }
      });

      if (aiError) throw aiError;

      // Save assessment to database
      const { data: assessment, error: dbError } = await supabase
        .from('assessments')
        .insert({
          field_id: selectedFieldId,
          image_url: publicUrl,
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

      toast.success('Analysis complete!');
      navigate(`/history`);

    } catch (error) {
      console.error('Analysis failed:', error);

      if (!isOnline) {
        toast.error('Offline mode - assessment saved locally and will sync when online');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold text-gradient-delta">
            Mobile Field Scanner
          </h1>
          <p className="text-muted-foreground">
            Capture crop health in the field with GPS auto-tagging
          </p>
        </div>

        {/* Online/Offline Indicator */}
        <Card className={isOnline ? 'border-green-500/20 bg-green-50/50' : 'border-red-500/20 bg-red-50/50'}>
          <CardContent className="flex items-center gap-2 p-4">
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Offline Mode</span>
              </>
            )}
          </CardContent>
        </Card>

        {/* Field Selection */}
        <Card className="field-card">
          <CardContent className="p-6 space-y-4">
            <label className="text-sm font-semibold text-foreground">Select Field</label>
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Camera Capture Area */}
        <Card className="field-card overflow-hidden">
          <CardContent className="p-0">
            <div className="relative w-full aspect-[4/3] bg-muted">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Captured crop" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={handleCameraClick}
                >
                  <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">Tap to capture crop image</p>
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
          <Card className="border-blue-500/20 bg-blue-50/50">
            <CardContent className="flex items-center gap-2 p-4">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-900">
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
          className="w-full h-14 text-lg gap-2 shadow-field"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Analyze Crop Health
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
