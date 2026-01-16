import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { safeJsonFetch } from "../lib/apiErrorHandler";
import { ImageUploadField } from "./ImageUploadField";

export interface PrivateTour {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  duration: string;
  price: string;
  priceSubtext?: string;
  features: string[];
  badge?: string;
  badgeColor?: "primary" | "accent";
  buttonText: string;
  buttonVariant?: "default" | "outline";
  published: boolean;
  order: number;
  heroImage?: string;
}

const DEFAULT_TOUR: Omit<PrivateTour, "id" | "order"> = {
  title: "New Private Tour",
  description: "Describe your tour package",
  longDescription: "",
  duration: "4-5 hours",
  price: "From €150",
  priceSubtext: "per group",
  features: ["Feature 1", "Feature 2", "Feature 3"],
  badge: "",
  badgeColor: "accent",
  buttonText: "Request Quote",
  buttonVariant: "outline",
  published: true,
  heroImage: "",
};

export function PrivateTourManager() {
  const [tours, setTours] = useState<PrivateTour[]>([]);
  const [editingTour, setEditingTour] = useState<PrivateTour | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentFeature, setCurrentFeature] = useState("");

  useEffect(() => {
    loadTours();
  }, []);

  const loadTours = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTours(data.tours || []);
      }
    } catch (error) {
      console.error("Error loading tours:", error);
      toast.error("Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const saveTour = async (tour: PrivateTour) => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tour }),
        }
      );

      if (response.ok) {
        toast.success("Tour saved successfully");
        await loadTours();
        setEditingTour(null);
        setIsCreating(false);
      } else {
        toast.error("Failed to save tour");
      }
    } catch (error) {
      console.error("Error saving tour:", error);
      toast.error("Failed to save tour");
    } finally {
      setSaving(false);
    }
  };

  const deleteTour = async (tourId: string) => {
    if (!confirm("Are you sure you want to delete this tour?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours/${tourId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        toast.success("Tour deleted successfully");
        await loadTours();
      } else {
        toast.error("Failed to delete tour");
      }
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast.error("Failed to delete tour");
    }
  };

  const reorderTour = async (tourId: string, direction: "up" | "down") => {
    const tourIndex = tours.findIndex((t) => t.id === tourId);
    if (tourIndex === -1) return;
    
    const newIndex = direction === "up" ? tourIndex - 1 : tourIndex + 1;
    if (newIndex < 0 || newIndex >= tours.length) return;

    const newTours = [...tours];
    [newTours[tourIndex], newTours[newIndex]] = [newTours[newIndex], newTours[tourIndex]];
    
    // Update order values
    const updatedTours = newTours.map((tour, index) => ({
      ...tour,
      order: index,
    }));

    setTours(updatedTours);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours/reorder`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tours: updatedTours }),
        }
      );

      if (!response.ok) {
        toast.error("Failed to reorder tours");
        await loadTours(); // Reload to get correct order
      }
    } catch (error) {
      console.error("Error reordering tours:", error);
      toast.error("Failed to reorder tours");
      await loadTours();
    }
  };

  const startCreating = () => {
    const newTour: PrivateTour = {
      ...DEFAULT_TOUR,
      id: `tour_${Date.now()}`,
      order: tours.length,
    };
    setEditingTour(newTour);
    setIsCreating(true);
  };

  const cancelEditing = () => {
    setEditingTour(null);
    setIsCreating(false);
    setCurrentFeature("");
  };

  const handleAddFeature = () => {
    if (!editingTour || !currentFeature.trim()) return;
    
    setEditingTour({
      ...editingTour,
      features: [...editingTour.features, currentFeature.trim()],
    });
    setCurrentFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingTour) return;
    
    setEditingTour({
      ...editingTour,
      features: editingTour.features.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading tours...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Private Tours Manager</h2>
          <p className="text-sm text-muted-foreground">
            Manage your private tour packages and offerings
          </p>
        </div>
        <Button onClick={startCreating} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Tour
        </Button>
      </div>

      {/* Tour Editor */}
      {editingTour && (
        <Card className="border-2 border-primary p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {isCreating ? "Create New Tour" : "Edit Tour"}
            </h3>
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Tour Title</Label>
              <Input
                value={editingTour.title}
                onChange={(e) =>
                  setEditingTour({ ...editingTour, title: e.target.value })
                }
                placeholder="e.g., Half Day Private Tour"
              />
            </div>

            {/* Hero Image */}
            <div>
              <Label>Hero Image</Label>
              <ImageUploadField
                value={editingTour.heroImage || ""}
                onChange={(url) =>
                  setEditingTour({ ...editingTour, heroImage: url })
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Recommended size: 1200x600px. This image will be displayed on the tour card and detail page.
              </p>
            </div>

            {/* Short Description */}
            <div>
              <Label>Short Description</Label>
              <Textarea
                value={editingTour.description}
                onChange={(e) =>
                  setEditingTour({ ...editingTour, description: e.target.value })
                }
                placeholder="Brief description for the card view..."
                rows={2}
              />
            </div>

            {/* Long Description */}
            <div>
              <Label>Full Description</Label>
              <Textarea
                value={editingTour.longDescription || ""}
                onChange={(e) =>
                  setEditingTour({ ...editingTour, longDescription: e.target.value })
                }
                placeholder="Detailed description for the tour detail page..."
                rows={5}
              />
            </div>

            {/* Duration and Price Row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Duration</Label>
                <Input
                  value={editingTour.duration}
                  onChange={(e) =>
                    setEditingTour({ ...editingTour, duration: e.target.value })
                  }
                  placeholder="e.g., 4-5 hours"
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  value={editingTour.price}
                  onChange={(e) =>
                    setEditingTour({ ...editingTour, price: e.target.value })
                  }
                  placeholder="e.g., From €150"
                />
              </div>
            </div>

            {/* Price Subtext */}
            <div>
              <Label>Price Subtext (Optional)</Label>
              <Input
                value={editingTour.priceSubtext || ""}
                onChange={(e) =>
                  setEditingTour({ ...editingTour, priceSubtext: e.target.value })
                }
                placeholder="e.g., per group"
              />
            </div>

            {/* Badge */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Badge Text (Optional)</Label>
                <Input
                  value={editingTour.badge || ""}
                  onChange={(e) =>
                    setEditingTour({ ...editingTour, badge: e.target.value })
                  }
                  placeholder="e.g., Most Popular"
                />
              </div>
              <div>
                <Label>Badge Color</Label>
                <div className="flex gap-2">
                  <Button
                    variant={editingTour.badgeColor === "primary" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditingTour({ ...editingTour, badgeColor: "primary" })
                    }
                  >
                    Primary
                  </Button>
                  <Button
                    variant={editingTour.badgeColor === "accent" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditingTour({ ...editingTour, badgeColor: "accent" })
                    }
                  >
                    Accent
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                {editingTour.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={feature} readOnly className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={currentFeature}
                    onChange={(e) => setCurrentFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === "Enter" && handleAddFeature()}
                  />
                  <Button onClick={handleAddFeature} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Button Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Button Text</Label>
                <Input
                  value={editingTour.buttonText}
                  onChange={(e) =>
                    setEditingTour({ ...editingTour, buttonText: e.target.value })
                  }
                  placeholder="e.g., Request Quote"
                />
              </div>
              <div>
                <Label>Button Style</Label>
                <div className="flex gap-2">
                  <Button
                    variant={editingTour.buttonVariant === "default" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditingTour({ ...editingTour, buttonVariant: "default" })
                    }
                  >
                    Filled
                  </Button>
                  <Button
                    variant={editingTour.buttonVariant === "outline" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditingTour({ ...editingTour, buttonVariant: "outline" })
                    }
                  >
                    Outline
                  </Button>
                </div>
              </div>
            </div>

            {/* Published Status */}
            <div className="flex items-center gap-2">
              <Switch
                checked={editingTour.published}
                onCheckedChange={(checked) =>
                  setEditingTour({ ...editingTour, published: checked })
                }
              />
              <Label>Published (visible to customers)</Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => saveTour(editingTour)}
                disabled={saving}
                className="flex-1"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Tour"}
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tours List */}
      <div className="space-y-4">
        {tours.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No tours yet. Click "Add New Tour" to create your first tour package.
            </p>
          </Card>
        ) : (
          tours.map((tour, index) => (
            <Card key={tour.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Hero Image Thumbnail */}
                {tour.heroImage && (
                  <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-md">
                    <img 
                      src={tour.heroImage} 
                      alt={tour.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {tour.title}
                    </h3>
                    {tour.badge && (
                      <Badge
                        variant={tour.badgeColor === "accent" ? "default" : "secondary"}
                        className={
                          tour.badgeColor === "accent" ? "bg-accent" : "bg-primary"
                        }
                      >
                        {tour.badge}
                      </Badge>
                    )}
                    {!tour.published && (
                      <Badge variant="outline">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {tour.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Duration: <strong>{tour.duration}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Price: <strong>{tour.price}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Features: <strong>{tour.features.length}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderTour(tour.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => reorderTour(tour.id, "down")}
                      disabled={index === tours.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTour(tour)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTour(tour.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}