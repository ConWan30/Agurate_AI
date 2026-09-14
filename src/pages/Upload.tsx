import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoData } from "@/contexts/DemoDataContext";
import bgCottonField from "@/assets/bg-cotton-field.jpg";
import { gatherUnifiedContext, enrichUnifiedContext } from '@/lib/unified-ai-intelligence';
import { toHealthPercent } from '@/lib/health-score';

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat?: number;
  location_lng?: number;
}

export default function Upload() {
  const { isDemoMode, fields: demoFields } = useDemoData();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const { toast} = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoMode) {
      setFields(demoFields);
    } else {
      fetchFields();
    }
  }, [isDemoMode]);

  const fetchFields = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("fields")
        .select("id, name, crop_type, location_lat, location_lng")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setFields(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load fields';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - allow images and videos
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const supportedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    
    const isImage = supportedImageTypes.includes(file.type.toLowerCase());
    const isVideo = supportedVideoTypes.includes(file.type.toLowerCase());
    
    if (!isImage && !isVideo) {
      toast({
        title: "Unsupported file format",
        description: "Please use JPG, PNG, WebP for images or MP4, MOV, AVI, MKV for drone videos.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: isVideo ? "Please select a video under 50MB" : "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    // Compress image before setting (for images only)
    if (!isVideo && file.type.startsWith('image/')) {
      // Use async function to handle await
      (async () => {
        try {
          const { compressImage, validateImageFile } = await import('@/lib/image-optimization');
          const validation = validateImageFile(file);
          if (!validation.valid) {
            toast({
              title: "Invalid image",
              description: validation.error,
              variant: "destructive",
            });
            return;
          }
          const compressed = await compressImage(file);
          setSelectedFile(compressed);
          setPreviewUrl(URL.createObjectURL(compressed));
        } catch (error) {
          // Fallback to original if compression fails
          console.warn('Image compression failed, using original:', error);
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      })();
    } else {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
    setFileType(isVideo ? 'video' : 'image');
  };

  const handleAnalyze = async () => {
    if (!selectedFile || !selectedField) {
      toast({
        title: "Missing information",
        description: "Please select both a field and an image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("crop-images")
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get signed URL (secure, time-limited)
      const { data, error: signedUrlError } = await supabase.storage
        .from("crop-images")
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;
      const imageUrl = data.signedUrl;

      setUploading(false);
      setAnalyzing(true);

      // Get field data for crop type and location
      const field = fields.find((f) => f.id === selectedField);
      if (!field) throw new Error("Field not found");
      
      const fieldLocation = field.location_lat && field.location_lng 
        ? `${field.location_lat}, ${field.location_lng}`
        : "Louisiana Delta region";

      // Track analytics
      const { analytics } = await import('@/lib/analytics');
      analytics.track('image_uploaded', {
        crop_type: field.crop_type,
        file_size: selectedFile.size,
        file_type: fileType,
      });

      // Call real AI analysis
      await performAIAnalysis(imageUrl, field.crop_type, fieldLocation, selectedField, fileType);
      
      analytics.track('analysis_completed', {
        crop_type: field.crop_type,
        field_id: selectedField,
      });

      toast({
        title: "Analysis complete!",
        description: "Crop health assessment has been saved",
      });

      navigate("/history");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load fields';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const performAIAnalysis = async (imageUrl: string, cropType: string, location: string, fieldId: string, mediaType: 'image' | 'video') => {
    // ✅ UNIFIED AI: Gather context before analysis
    const unifiedContext = await gatherUnifiedContext(fieldId);
    
    // Call the AI edge function with unified context
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-crop', {
      body: { 
        imageUrl, 
        cropType, 
        location, 
        mediaType,
        unifiedContext // Include intelligence pool data
      }
    });

    if (aiError) throw aiError;
    if (!aiResult) throw new Error('No analysis results received');
    if (aiResult.health_score == null || Number.isNaN(Number(aiResult.health_score))) {
      throw new Error('AI analysis did not return a health score');
    }

    // Insert assessment with AI results
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        field_id: fieldId,
        image_url: imageUrl,
        health_score: toHealthPercent(aiResult.health_score),
        stress_level: aiResult.stress_level,
        symptoms: aiResult.symptoms,
        confidence_score:
          aiResult.confidence_score == null
            ? null
            : toHealthPercent(aiResult.confidence_score),
        weather_temp_f: aiResult.weather_data?.temp_f,
        weather_precipitation_mm: aiResult.weather_data?.precipitation_inch ? 
          aiResult.weather_data.precipitation_inch * 25.4 : null, // Convert inches to mm
        // Enhanced analytical fields
        growth_stage: aiResult.growth_stage,
        disease_identified: aiResult.disease_identified,
        pest_identified: aiResult.pest_identified,
        nutrient_deficiencies: aiResult.nutrient_deficiencies,
        severity_ratings: aiResult.severity_ratings,
        field_uniformity_score: aiResult.field_uniformity_score,
        estimated_yield_impact_percent: aiResult.estimated_yield_impact_percent,
        canopy_coverage_percent: aiResult.canopy_coverage_percent,
        plant_density_assessment: aiResult.plant_density_assessment,
        root_health_indicators: aiResult.root_health_indicators,
        detailed_visual_analysis: aiResult.detailed_visual_analysis,
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Insert AI-generated recommendations
    interface Recommendation {
      text: string;
      priority: 'urgent' | 'normal' | 'low';
      category: 'irrigation' | 'fertilization' | 'pest_management' | 'weather_alert' | 'general';
    }
    
    const recommendations = (aiResult.recommendations as Recommendation[]).map((rec) => ({
      assessment_id: assessment.id,
      recommendation_text: rec.text,
      priority: rec.priority,
      category: rec.category,
    }));

    const { error: recError } = await supabase.from("recommendations").insert(recommendations);

    if (recError) throw recError;

    // ✅ UNIFIED AI: Enrich intelligence pool after analysis
    await enrichUnifiedContext(fieldId, aiResult);

    // ✅ CRITICAL ALERTS: Check if assessment triggers critical alert
    try {
      const { data: fieldData } = await supabase
        .from('fields')
        .select('acreage, crop_type')
        .eq('id', fieldId)
        .single();

      await supabase.functions.invoke('detect-critical-alerts', {
        body: {
          assessment_id: assessment.id,
          field_id: fieldId,
          health_score: toHealthPercent(aiResult.health_score),
          stress_level: aiResult.stress_level,
          diseases: aiResult.disease_identified,
          pests: aiResult.pest_identified,
          estimated_yield_impact_percent: aiResult.estimated_yield_impact_percent,
          field_acreage: fieldData?.acreage,
          crop_type: fieldData?.crop_type || cropType,
        },
      });
    } catch (alertError) {
      // Don't fail the upload if alert detection fails
      console.warn('Critical alert detection failed:', alertError);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(34, 197, 94, 0.92) 0%, rgba(22, 163, 74, 0.88) 100%), url(${bgCottonField})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
            Upload Crop Image
          </h1>
          <p className="text-white/90 text-base md:text-lg max-w-2xl">
            AI-powered crop health analysis using Google Gemini 2.5 Pro
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {fields.length === 0 ? (
          <AnimatedCard className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl gradient-sky shadow-glow mx-auto mb-4">
                <ImageIcon className="h-10 w-10 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-2">No fields available</h3>
              <p className="text-muted-foreground mb-4">Add a field first to analyze crops</p>
              <Button onClick={() => navigate("/fields")} size="lg" className="focus-ring">Go to My Fields</Button>
            </CardContent>
          </AnimatedCard>
        ) : (
          <AnimatedCard>
            <CardHeader>
              <CardTitle className="text-2xl font-heading">New Assessment</CardTitle>
              <CardDescription>Upload a crop image for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Field Selection */}
              <div className="space-y-2">
                <Label htmlFor="field">Select Field *</Label>
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.name} ({field.crop_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image/Video Upload */}
              <div className="space-y-2">
                <Label>Upload Image or Drone Video *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    previewUrl ? "border-primary" : "border-border"
                  }`}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      {fileType === 'image' ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg object-contain"
                        />
                      ) : (
                        <video
                          src={previewUrl}
                          controls
                          className="max-h-64 mx-auto rounded-lg"
                        />
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                        }}
                      >
                        Change {fileType === 'image' ? 'Image' : 'Video'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">
                          Images: JPG, PNG, WebP (10MB max)
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Drone Videos: MP4, MOV, AVI, MKV (50MB max)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select Image or Video
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                className="w-full focus-ring"
                disabled={!selectedFile || !selectedField || uploading || analyzing}
                size="lg"
                aria-label="Analyze crop health"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Uploading...
                  </>
                ) : analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Analyzing with AI...
                  </>
                ) : (
                  "Analyze Crop Health"
                )}
              </Button>

              {analyzing && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-center">
                    AI is analyzing your crop {fileType === 'video' ? 'video' : 'image'}. 
                    {fileType === 'video' && ' Video analysis may take longer...'}
                  </p>
                </div>
              )}
            </CardContent>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}