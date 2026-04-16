import { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Upload,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import {
  loadMonuments,
  saveMonuments,
  saveMonumentsToServer,
  loadMonumentsFromServer,
  generateSlug,
  type Monument,
} from "../lib/monumentManager";

export function MonumentEditor() {
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const loadedMonuments = await loadMonumentsFromServer(projectId, publicAnonKey);
      setMonuments(loadedMonuments);
    } catch (error) {
      console.error("Error loading monuments:", error);
      toast.error("Failed to load monuments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save locally first
      saveMonuments(monuments);
      
      // Then sync to server
      const success = await saveMonumentsToServer(monuments, projectId, publicAnonKey);
      
      if (success) {
        toast.success("Monuments saved successfully!");
        setEditingId(null);
      } else {
        toast.error("Failed to sync monuments to server");
      }
    } catch (error) {
      console.error("Error saving monuments:", error);
      toast.error("Failed to save monuments");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMonument = () => {
    const newMonument: Monument = {
      id: `monument-${Date.now()}`,
      slug: "",
      name: "New Monument",
      shortDescription: "",
      longDescription: "",
      highlights: [""],
      hours: "9:30 AM - 6:00 PM",
      duration: "2-3 hours recommended",
      tips: [""],
      price: 0,
      isVisible: true,
      displayOrder: monuments.length + 1,
      lastModified: new Date().toISOString(),
    };
    setMonuments([...monuments, newMonument]);
    setEditingId(newMonument.id);
    setExpandedId(newMonument.id);
  };

  const handleDeleteMonument = (id: string) => {
    if (confirm("Are you sure you want to delete this monument?")) {
      setMonuments(monuments.filter(m => m.id !== id));
      toast.success("Monument deleted");
    }
  };

  const handleToggleVisibility = (id: string) => {
    setMonuments(monuments.map(m => 
      m.id === id ? { ...m, isVisible: !m.isVisible } : m
    ));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMonuments = [...monuments];
    [newMonuments[index - 1], newMonuments[index]] = [newMonuments[index], newMonuments[index - 1]];
    // Update display orders
    newMonuments.forEach((m, i) => m.displayOrder = i + 1);
    setMonuments(newMonuments);
  };

  const handleMoveDown = (index: number) => {
    if (index === monuments.length - 1) return;
    const newMonuments = [...monuments];
    [newMonuments[index], newMonuments[index + 1]] = [newMonuments[index + 1], newMonuments[index]];
    // Update display orders
    newMonuments.forEach((m, i) => m.displayOrder = i + 1);
    setMonuments(newMonuments);
  };

  const updateMonument = (id: string, updates: Partial<Monument>) => {
    setMonuments(monuments.map(m => 
      m.id === id 
        ? { 
            ...m, 
            ...updates, 
            lastModified: new Date().toISOString(),
            // Auto-generate slug from name if name changes
            slug: updates.name ? generateSlug(updates.name) : m.slug
          } 
        : m
    ));
  };

  const addHighlight = (id: string) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      updateMonument(id, { highlights: [...monument.highlights, ""] });
    }
  };

  const removeHighlight = (id: string, index: number) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      const newHighlights = monument.highlights.filter((_, i) => i !== index);
      updateMonument(id, { highlights: newHighlights });
    }
  };

  const updateHighlight = (id: string, index: number, value: string) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      const newHighlights = [...monument.highlights];
      newHighlights[index] = value;
      updateMonument(id, { highlights: newHighlights });
    }
  };

  const addTip = (id: string) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      updateMonument(id, { tips: [...monument.tips, ""] });
    }
  };

  const removeTip = (id: string, index: number) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      const newTips = monument.tips.filter((_, i) => i !== index);
      updateMonument(id, { tips: newTips });
    }
  };

  const updateTip = (id: string, index: number, value: string) => {
    const monument = monuments.find(m => m.id === id);
    if (monument) {
      const newTips = [...monument.tips];
      newTips[index] = value;
      updateMonument(id, { tips: newTips });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading monuments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground">Monument Manager</h2>
          <p className="text-muted-foreground">
            Add, edit, hide, or reorder monuments shown on the Attractions page
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddMonument} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Monument
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Instructions */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2 text-foreground">How to use:</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Use the <Eye className="inline h-3 w-3" />/<EyeOff className="inline h-3 w-3" /> button to show/hide monuments from the Attractions page</li>
          <li>• Use the <ChevronUp className="inline h-3 w-3" />/<ChevronDown className="inline h-3 w-3" /> arrows to reorder monuments</li>
          <li>• Click a monument card to expand and edit details</li>
          <li>• Click "Save All Changes" to publish your changes</li>
        </ul>
      </Card>

      {/* Monument List */}
      <div className="space-y-3">
        {monuments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No monuments yet. Click "Add Monument" to create one.</p>
          </Card>
        ) : (
          monuments.map((monument, index) => (
            <Card key={monument.id} className="p-4">
              {/* Monument Header */}
              <div className="flex items-start gap-3">
                {/* Drag/Order Controls */}
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === monuments.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Monument Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {monument.name}
                    </h3>
                    {!monument.isVisible && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Order: {monument.displayOrder}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {monument.shortDescription || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>€{monument.price}</span>
                    <span>•</span>
                    <span>{monument.duration}</span>
                    {monument.slug && (
                      <>
                        <span>•</span>
                        <code className="bg-muted px-1 rounded">{monument.slug}</code>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleVisibility(monument.id)}
                  >
                    {monument.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExpandedId(expandedId === monument.id ? null : monument.id);
                      setEditingId(monument.id);
                    }}
                  >
                    {expandedId === monument.id ? "Collapse" : "Edit"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMonument(monument.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Expanded Edit Form */}
              {expandedId === monument.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Basic Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Name</label>
                      <Input
                        value={monument.name}
                        onChange={(e) => updateMonument(monument.id, { name: e.target.value })}
                        placeholder="Monument name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Slug (URL)</label>
                      <Input
                        value={monument.slug}
                        onChange={(e) => updateMonument(monument.id, { slug: e.target.value })}
                        placeholder="url-friendly-name"
                      />
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div>
                    <label className="text-sm font-medium text-foreground">Short Description</label>
                    <Textarea
                      value={monument.shortDescription}
                      onChange={(e) => updateMonument(monument.id, { shortDescription: e.target.value })}
                      placeholder="Brief description shown in cards"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Long Description</label>
                    <Textarea
                      value={monument.longDescription}
                      onChange={(e) => updateMonument(monument.id, { longDescription: e.target.value })}
                      placeholder="Detailed description shown on detail page"
                      rows={4}
                    />
                  </div>

                  {/* Highlights */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">Highlights</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addHighlight(monument.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {monument.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={highlight}
                            onChange={(e) => updateHighlight(monument.id, idx, e.target.value)}
                            placeholder="Highlight point"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHighlight(monument.id, idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">Visitor Tips</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTip(monument.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {monument.tips.map((tip, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={tip}
                            onChange={(e) => updateTip(monument.id, idx, e.target.value)}
                            placeholder="Visitor tip"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTip(monument.id, idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Opening Hours</label>
                      <Input
                        value={monument.hours}
                        onChange={(e) => updateMonument(monument.id, { hours: e.target.value })}
                        placeholder="9:30 AM - 6:00 PM"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Recommended Duration</label>
                      <Input
                        value={monument.duration}
                        onChange={(e) => updateMonument(monument.id, { duration: e.target.value })}
                        placeholder="2-3 hours recommended"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Ticket Price (€)</label>
                      <Input
                        type="number"
                        value={monument.price}
                        onChange={(e) => updateMonument(monument.id, { price: parseFloat(e.target.value) || 0 })}
                        placeholder="14"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Park Only Price (€) - Optional</label>
                      <Input
                        type="number"
                        value={monument.parkOnlyPrice || ""}
                        onChange={(e) => updateMonument(monument.id, { parkOnlyPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        placeholder="8"
                      />
                    </div>
                  </div>

                  {/* Images */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">Card Image URL</label>
                      <Input
                        value={monument.cardImage || ""}
                        onChange={(e) => updateMonument(monument.id, { cardImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Image shown in attraction cards
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Hero Image URL</label>
                      <Input
                        value={monument.heroImage || ""}
                        onChange={(e) => updateMonument(monument.id, { heroImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Large image shown on detail page
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Bottom Save Button */}
      {monuments.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
