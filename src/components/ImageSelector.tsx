import { useState, useEffect } from "react";
import { Image as ImageIcon, RefreshCw, X } from "lucide-react";
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

interface ImageSelectorProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
}

export function ImageSelector({ label, value, onChange, description }: ImageSelectorProps) {
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
    onChange(url);
    setIsOpen(false);
    toast.success("Image selected!");
  };

  const handleClear = () => {
    onChange("");
    toast.success("Image cleared");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      
      {value ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-border">
            <img
              src={value}
              alt="Selected"
              className="h-32 w-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpen}
              className="flex-1"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Change Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleOpen}
          className="w-full"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Select Image
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Select Image</span>
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
              Choose from your uploaded images
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
              {images.map((image) => (
                <button
                  key={image.name}
                  type="button"
                  onClick={() => handleSelect(image.url)}
                  className="group relative overflow-hidden rounded-lg border border-border bg-white transition-all hover:shadow-md hover:border-primary"
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
                  {value === image.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-primary">
                      <div className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        Selected
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
