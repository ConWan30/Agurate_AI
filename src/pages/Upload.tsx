import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
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
        .select("id, name, crop_type")
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
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

      // Get field data for crop type
      const field = fields.find((f) => f.id === selectedField);
      if (!field) throw new Error("Field not found");

      // Simulate AI analysis (in production, this would call Lovable AI or edge function)
      await simulateAIAnalysis(publicUrl, field.crop_type, selectedField);

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

  const simulateAIAnalysis = async (imageUrl: string, cropType: string, fieldId: string) => {
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock analysis results
    const healthScore = 0.65 + Math.random() * 0.3; // 0.65-0.95
    const stressLevel =
      healthScore > 0.75 ? "Healthy" : healthScore > 0.5 ? "Moderate" : "Severe";

    const symptoms = [
      "Good canopy coverage",
      "Minor yellowing observed in 10-15% of plants",
      "No visible disease symptoms",
    ];

    // Insert assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        field_id: fieldId,
        image_url: imageUrl,
        health_score: healthScore,
        stress_level: stressLevel,
        symptoms: symptoms,
        confidence_score: 0.85,
        weather_temp_f: 88,
        weather_precipitation_mm: 0.5,
      })
      .select()
      .single();

    if (assessmentError) throw assessmentError;

    // Insert recommendations
    const recommendations = [
      {
        assessment_id: assessment.id,
        recommendation_text: "Monitor nitrogen levels - consider soil test within 5-7 days",
        priority: "normal",
        category: "fertilization",
      },
      {
        assessment_id: assessment.id,
        recommendation_text: "Maintain current irrigation schedule",
        priority: "low",
        category: "irrigation",
      },
    ];

    const { error: recError } = await supabase.from("recommendations").insert(recommendations);

    if (recError) throw recError;
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold mb-2">Upload Crop Image</h1>
          <p className="text-muted-foreground">AI-powered crop health analysis</p>
        </div>

        {fields.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No fields available</h3>
              <p className="text-muted-foreground mb-4">Add a field first to analyze crops</p>
              <Button onClick={() => navigate("/fields")}>Go to My Fields</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>New Assessment</CardTitle>
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
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
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
    </Layout>
  );
}