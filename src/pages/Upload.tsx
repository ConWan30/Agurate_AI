import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, Loader2, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  location_lat?: number;
  location_lng?: number;
}

export default function Upload() {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFields();
  }, []);

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only allow JPEG, PNG, WebP
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Unsupported image format",
        description: "Please use JPG, PNG, or WebP format. AVIF is not supported.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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

      // Upload image to storage
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("crop-images")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("crop-images")
        .getPublicUrl(fileName);

      setUploading(false);
      setAnalyzing(true);

      // Get field data for crop type and location
      const field = fields.find((f) => f.id === selectedField);
      if (!field) throw new Error("Field not found");
      
      const fieldLocation = field.location_lat && field.location_lng 
        ? `${field.location_lat}, ${field.location_lng}`
        : "Louisiana Delta region";

      // Call real AI analysis
      await performAIAnalysis(publicUrl, field.crop_type, fieldLocation, selectedField);

      toast({
        title: "Analysis complete!",
        description: "Crop health assessment has been saved",
      });

      navigate("/history");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const performAIAnalysis = async (imageUrl: string, cropType: string, location: string, fieldId: string) => {
    // Call the AI edge function with two-step analysis
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-crop', {
      body: { imageUrl, cropType, location }
    });

    if (aiError) throw aiError;
    if (!aiResult) throw new Error('No analysis results received');

    // Insert assessment with AI results
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        field_id: fieldId,
        image_url: imageUrl,
        health_score: aiResult.health_score,
        stress_level: aiResult.stress_level,
        symptoms: aiResult.symptoms,
        confidence_score: aiResult.confidence_score,
        weather_temp_f: aiResult.weather_data?.temp_f,
        weather_precipitation_mm: aiResult.weather_data?.precipitation_inch ? 
          aiResult.weather_data.precipitation_inch * 25.4 : null, // Convert inches to mm
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Insert AI-generated recommendations
    const recommendations = aiResult.recommendations.map((rec: any) => ({
      assessment_id: assessment.id,
      recommendation_text: rec.text,
      priority: rec.priority,
      category: rec.category,
    }));

    const { error: recError } = await supabase.from("recommendations").insert(recommendations);

    if (recError) throw recError;
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl gradient-delta p-8 md:p-12 shadow-glow">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
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
          <Card className="field-card border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex items-center justify-center h-20 w-20 rounded-2xl gradient-sky shadow-glow mx-auto mb-4">
                <ImageIcon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">No fields available</h3>
              <p className="text-muted-foreground mb-4">Add a field first to analyze crops</p>
              <Button onClick={() => navigate("/fields")} size="lg">Go to My Fields</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="field-card">
            <CardHeader>
              <CardTitle className="text-2xl font-display">New Assessment</CardTitle>
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

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Upload Image *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    previewUrl ? "border-primary" : "border-border"
                  }`}
                >
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg object-contain"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                        }}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG, or WebP up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select Image
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                className="w-full"
                disabled={!selectedFile || !selectedField || uploading || analyzing}
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  "Analyze Crop Health"
                )}
              </Button>

              {analyzing && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-center">
                    AI is analyzing your crop image. This may take a few moments...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}