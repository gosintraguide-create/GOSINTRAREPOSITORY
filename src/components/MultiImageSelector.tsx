import { useState } from "react";
import { Image as ImageIcon, RefreshCw, X, Plus, GripVertical } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface UploadedImage {
  name: string;
  url: string;
  uploadedAt: string;
  size: number;
}

interface MultiImageSelectorProps {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  description?: string;
  maxImages?: number;
}

export function MultiImageSelector({ 
  label, 
  value = [], 
  onChange, 
  description,
  maxImages = 10 
}: MultiImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/images`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (result.success && result.images) {
        setImages(result.images);
      } else {
        console.error("Failed to load images:", result.error);
      }
    } catch (error) {
      console.error("Error loading images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadImages();
  };

  const handleSelect = (url: string) => {
    if (value.includes(url)) {
      // Remove if already selected
      onChange(value.filter(u => u !== url));
      toast.success("Image removed from carousel");
    } else if (value.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
    } else {
      // Add to selection
      onChange([...value, url]);
      toast.success("Image added to carousel");
    }
  };

  const handleRemove = (url: string) => {
    onChange(value.filter(u => u !== url));
    toast.success("Image removed");
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newValue = [...value];
    const [removed] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, removed);
    onChange(newValue);
  };

  const moveUp = (index: number) => {
    if (index > 0) {
      handleReorder(index, index - 1);
    }
  };

  const moveDown = (index: number) => {
    if (index < value.length - 1) {
      handleReorder(index, index + 1);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {/* Selected Images */}
      {value.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Selected Images ({value.length}/{maxImages})
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {value.map((imageUrl, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-border bg-white"
              >
                <div className="aspect-video bg-secondary/30">
                  <img
                    src={imageUrl}
                    alt={`Carousel image ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black/60 text-white rounded px-2 py-1 text-xs font-medium">
                  #{index + 1}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => moveUp(index)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Move up"
                    >
                      ↑
                    </Button>
                  )}
                  {index < value.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => moveDown(index)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Move down"
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(imageUrl)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Images Button */}
      <Button
        type="button"
        variant="outline"
        onClick={handleOpen}
        className="w-full"
        disabled={value.length >= maxImages}
      >
        <Plus className="mr-2 h-4 w-4" />
        {value.length === 0 ? "Add Carousel Images" : `Add More Images (${value.length}/${maxImages})`}
      </Button>

      {/* Image Selection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Select Carousel Images</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadImages}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Click images to add or remove them from the carousel ({value.length}/{maxImages} selected)
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading images...
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No images uploaded yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload images in the Image Manager first
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => {
                const isSelected = value.includes(image.url);
                const selectedIndex = value.indexOf(image.url);
                
                return (
                  <button
                    key={image.name}
                    type="button"
                    onClick={() => handleSelect(image.url)}
                    className={`group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-md ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="aspect-video bg-secondary/30">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-medium" title={image.name}>
                        {image.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        #{selectedIndex + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
