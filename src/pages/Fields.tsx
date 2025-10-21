import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [editingField, setEditingField] = useState<Field | null>(null);
  const { toast } = useToast();
  
  // Enable keyboard shortcuts
  useGlobalKeyboardShortcuts();

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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="secondary" size="lg" className="gap-2 hidden md:flex">
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
                <DialogDescription>
                  {editingField
                    ? "Update your field information"
                    : "Register a new field for crop monitoring"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Field Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., North Field"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crop_type">Crop Type *</Label>
                  <Select
                    value={formData.crop_type}
                    onValueChange={(value) => setFormData({ ...formData, crop_type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rice">Rice</SelectItem>
                      <SelectItem value="soybean">Soybean</SelectItem>
                      <SelectItem value="cotton">Cotton</SelectItem>
                      <SelectItem value="corn">Corn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acreage">Acreage *</Label>
                  <Input
                    id="acreage"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 45.5"
                    value={formData.acreage}
                    onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="0.0000001"
                      placeholder="32.73"
                      value={formData.location_lat}
                      onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="0.0000001"
                      placeholder="-91.76"
                      value={formData.location_lng}
                      onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional field information..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : editingField ? "Update Field" : "Add Field"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Mobile Add Button */}
      <div className="md:hidden">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="lg">
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingField ? "Edit Field" : "Add New Field"}</DialogTitle>
              <DialogDescription>
                {editingField
                  ? "Update your field information"
                  : "Register a new field for crop monitoring"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-mobile">Field Name *</Label>
                <Input
                  id="name-mobile"
                  placeholder="e.g., North Field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crop_type-mobile">Crop Type *</Label>
                <Select
                  value={formData.crop_type}
                  onValueChange={(value) => setFormData({ ...formData, crop_type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="soybean">Soybean</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="corn">Corn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="acreage-mobile">Acreage *</Label>
                <Input
                  id="acreage-mobile"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 45.5"
                  value={formData.acreage}
                  onChange={(e) => setFormData({ ...formData, acreage: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat-mobile">Latitude</Label>
                  <Input
                    id="lat-mobile"
                    type="number"
                    step="0.0000001"
                    placeholder="32.73"
                    value={formData.location_lat}
                    onChange={(e) => setFormData({ ...formData, location_lat: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lng-mobile">Longitude</Label>
                  <Input
                    id="lng-mobile"
                    type="number"
                    step="0.0000001"
                    placeholder="-91.76"
                    value={formData.location_lng}
                    onChange={(e) => setFormData({ ...formData, location_lng: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes-mobile">Notes</Label>
                <Textarea
                  id="notes-mobile"
                  placeholder="Additional field information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingField ? "Update Field" : "Add Field"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

        {loading && !dialogOpen ? (
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
            onAction={() => setDialogOpen(true)}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <SwipeableCard key={field.id}>
                <Card className="field-card border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={cropIcons[field.crop_type]}
                        alt={field.crop_type}
                        className="h-12 w-12 object-contain"
                      />
                      <div>
                        <CardTitle className="text-xl">{field.name}</CardTitle>
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(field.id)}
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
                      <span className="font-medium">{field.acreage} acres</span>
                    </div>
                    {field.location_lat && field.location_lng && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-xs">
                          {field.location_lat.toFixed(4)}, {field.location_lng.toFixed(4)}
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
              </Card>
              </SwipeableCard>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}