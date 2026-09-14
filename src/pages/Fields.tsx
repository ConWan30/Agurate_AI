import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Edit, Trash2 } from "lucide-react";
import riceIcon from "@/assets/rice-icon.png";
import soybeanIcon from "@/assets/soybean-icon.png";
import cottonIcon from "@/assets/cotton-icon.png";
import cornIcon from "@/assets/corn-icon.png";
import { useDemoData } from "@/contexts/DemoDataContext";
import bgTractorField from "@/assets/bg-tractor-field.jpg";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { EmptyState } from "@/components/ui/empty-state";
import { DeltaConversationalForm } from "@/components/forms/DeltaConversationalForm";
import { Sparkles } from "lucide-react";
import { VarietyRecommendationCard } from "@/components/VarietyRecommendationCard";
import { VarietyRecommendation } from "@/types/enhanced-features";
import { useQuery } from "@tanstack/react-query";

interface Field {
  id: string;
  name: string;
  crop_type: string;
  acreage: number;
  location_lat?: number;
  location_lng?: number;
  notes?: string;
}

const cropIcons: Record<string, string> = {
  rice: riceIcon,
  soybean: soybeanIcon,
  cotton: cottonIcon,
  corn: cornIcon,
};

export default function Fields() {
  const { isDemoMode, fields: demoFields } = useDemoData();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [conversationalDialogOpen, setConversationalDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const { toast } = useToast();
  
  // Enable keyboard shortcuts
  useGlobalKeyboardShortcuts();

  // Fetch variety recommendations
  const { data: varietyRecommendations } = useQuery({
    queryKey: ['variety-recommendations'],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // variety_recommendations links to fields, not users directly
        const { data: userFields } = await supabase
          .from('fields')
          .select('id')
          .eq('user_id', user.id);

        const fieldIds = (userFields || []).map((f) => f.id);
        if (fieldIds.length === 0) return [];

        const response = await (supabase as any)
          .from('variety_recommendations')
          .select('*')
          .in('field_id', fieldIds)
          .order('created_at', { ascending: false })
          .limit(3);

        if (response.error) {
          console.error('Error fetching variety recommendations:', response.error);
          return [];
        }
        return response.data as VarietyRecommendation[];
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    enabled: !isDemoMode
  }) as { data: VarietyRecommendation[] | undefined };

  const [formData, setFormData] = useState({
    name: "",
    crop_type: "",
    acreage: "",
    location_lat: "",
    location_lng: "",
    notes: "",
  });

  useEffect(() => {
    if (isDemoMode) {
      setFields(demoFields);
      setLoading(false);
    } else {
      fetchFields();
    }
  }, [isDemoMode]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setFields(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fieldData = {
        user_id: user.id,
        name: formData.name,
        crop_type: formData.crop_type,
        acreage: parseFloat(formData.acreage),
        location_lat: formData.location_lat ? parseFloat(formData.location_lat) : null,
        location_lng: formData.location_lng ? parseFloat(formData.location_lng) : null,
        notes: formData.notes || null,
      };

      if (editingField) {
        const { error } = await supabase
          .from("fields")
          .update(fieldData)
          .eq("id", editingField.id);

        if (error) throw error;
        toast({ title: "Field updated successfully" });
      } else {
        const { error } = await supabase.from("fields").insert(fieldData);

        if (error) throw error;
        toast({ title: "Field added successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      const { error } = await supabase.from("fields").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Field deleted successfully" });
      fetchFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (field: Field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      crop_type: field.crop_type,
      acreage: field.acreage.toString(),
      location_lat: field.location_lat?.toString() || "",
      location_lng: field.location_lng?.toString() || "",
      notes: field.notes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      crop_type: "",
      acreage: "",
      location_lat: "",
      location_lng: "",
      notes: "",
    });
    setEditingField(null);
  };

  interface FieldRegistrationData {
    name?: string;
    fieldName?: string;
    crop_type?: string;
    cropType?: string;
    acreage?: number | string;
    location_lat?: number | string;
    location_lng?: number | string;
    notes?: string;
    [key: string]: unknown;
  }

  const handleConversationalComplete = async (extractedData: FieldRegistrationData) => {
    if (import.meta.env.DEV) console.log('🎯 Conversational form completed with data:', extractedData);
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Map the extracted data to field schema (DB CHECK expects singular soybean)
      const rawCrop = String(extractedData.crop_type || extractedData.cropType || '');
      const cropType = rawCrop === 'soybeans' ? 'soybean' : rawCrop;

      const fieldData = {
        user_id: user.id,
        name: extractedData.name || extractedData.fieldName,
        crop_type: cropType,
        acreage: parseFloat(String(extractedData.acreage)),
        location_lat: extractedData.location_lat ? parseFloat(String(extractedData.location_lat)) : null,
        location_lng: extractedData.location_lng ? parseFloat(String(extractedData.location_lng)) : null,
        notes: extractedData.notes ? String(extractedData.notes) : null,
      };

      if (import.meta.env.DEV) console.log('💾 Inserting field with data:', fieldData);

      // Validate required fields
      if (!fieldData.name) {
        throw new Error("Field name is required");
      }
      if (!fieldData.crop_type) {
        throw new Error("Crop type is required");
      }
      if (!fieldData.acreage || isNaN(fieldData.acreage)) {
        throw new Error("Valid acreage is required");
      }

      const { data: insertedField, error } = await supabase
        .from("fields")
        .insert(fieldData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      if (import.meta.env.DEV) console.log('✅ Field created successfully:', insertedField);

      toast({ 
        title: "🎉 Field registered successfully!",
        description: `${fieldData.name} has been added to your fields.`
      });

      setConversationalDialogOpen(false);
      fetchFields();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('❌ Error in handleConversationalComplete:', error);
      toast({
        title: "Error creating field",
        description: errorMessage || "Failed to create field. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PullToRefresh onRefresh={fetchFields}>
      <div className="space-y-8">
      {/* Hero Header */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 md:p-12 shadow-delta-mist"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.92) 0%, rgba(37, 99, 235, 0.88) 100%), url(${bgTractorField})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">My Fields</h1>
            <p className="text-white/90 text-base md:text-lg">Manage your farm fields and crop types</p>
          </div>
          <Dialog
            open={conversationalDialogOpen}
            onOpenChange={setConversationalDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="default" size="lg" className="gap-2 hidden md:flex">
                <Sparkles className="h-4 w-4" />
                Add Field with Delta AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0" hideCloseButton>
              <DeltaConversationalForm
                formType="field-registration"
                onComplete={handleConversationalComplete}
                onAbandon={() => setConversationalDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Variety Recommendations */}
      {varietyRecommendations && varietyRecommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">LSU Variety Recommendations for Your Fields</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {varietyRecommendations.map((recommendation) => (
              <VarietyRecommendationCard 
                key={recommendation.id} 
                recommendation={recommendation}
                onAdopt={() => {
                  toast({ 
                    title: "Variety Noted",
                    description: `${recommendation.recommended_variety} noted for your review (not saved to field records yet).`
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Add Button */}
      <div className="md:hidden">
        <Dialog
          open={conversationalDialogOpen}
          onOpenChange={setConversationalDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="lg">
              <Sparkles className="h-4 w-4" />
              Add Field with Delta AI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-full max-h-[90vh] p-0 m-4" hideCloseButton>
            <DeltaConversationalForm
              formType="field-registration"
              onComplete={handleConversationalComplete}
              onAbandon={() => setConversationalDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

        {loading && !conversationalDialogOpen ? (
          <Card className="field-card">
            <CardContent className="flex items-center justify-center py-16">
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Loading fields...</p>
              </div>
            </CardContent>
          </Card>
        ) : fields.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Fields Registered"
            description="Register your first field to start monitoring crop health. Add location, crop type, and acreage details."
            actionLabel="Add Your First Field"
            onAction={() => setConversationalDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field, index) => (
              <SwipeableCard key={field.id}>
                <AnimatedCard 
                  delay={index * 50}
                  hover={true}
                  className="border-2"
                >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={cropIcons[field.crop_type]}
                        alt={`${field.crop_type} crop icon`}
                        className="h-12 w-12 object-contain"
                      />
                      <div>
                        <CardTitle className="text-xl font-heading">{field.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {field.crop_type}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(field)}
                        aria-label={`Edit ${field.name}`}
                        className="focus-ring"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(field.id)}
                        aria-label={`Delete ${field.name}`}
                        className="focus-ring"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acreage:</span>
                      <span className="font-mono font-medium">{field.acreage} acres</span>
                    </div>
                    {field.location_lat && field.location_lng && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-mono font-medium text-xs">
                          {field.location_lat != null && field.location_lng != null ? `${Number(field.location_lat).toFixed(4)}, ${Number(field.location_lng).toFixed(4)}` : 'Location not set'}
                        </span>
                      </div>
                    )}
                    {field.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground">{field.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
              </SwipeableCard>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}