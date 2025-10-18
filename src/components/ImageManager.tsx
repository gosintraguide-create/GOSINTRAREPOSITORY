import { useState, useEffect } from "react";
import { Upload, Copy, Trash2, Image as ImageIcon, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface UploadedImage {
  name: string;
  url: string;
  uploadedAt: string;
  size: number;
}

export function ImageManager() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    loadImages();
  }, []);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/images/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileName: selectedFile.name,
              fileData: base64,
              fileType: selectedFile.type,
            }),
          }
        );

        const result = await response.json();
        if (result.success) {
          toast.success("Image uploaded successfully!");
          setSelectedFile(null);
          setPreviewUrl("");
          // Reset file input
          const fileInput = document.getElementById("image-upload") as HTMLInputElement;
          if (fileInput) fileInput.value = "";
          // Reload images
          loadImages();
        } else {
          toast.error(`Upload failed: ${result.error}`);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploading(false);
      };
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageName: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/images/${encodeURIComponent(imageName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Image deleted successfully!");
        loadImages();
      } else {
        toast.error(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Image URL copied to clipboard!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <Card className="border-border p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-foreground">Upload Images</h2>
          <div className="h-1 w-16 rounded-full bg-accent" />
          <p className="mt-4 text-muted-foreground">
            Upload images to use throughout your website. Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Select Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
            />
          </div>

          {previewUrl && (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-sm text-muted-foreground">Preview:</p>
              <div className="flex items-start gap-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg border border-border object-contain"
                />
                <div className="flex-1 space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedFile?.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Size:</span>{" "}
                    {selectedFile && formatFileSize(selectedFile.size)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {selectedFile?.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-primary hover:bg-primary/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </Card>

      <Card className="border-border p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-foreground">Uploaded Images</h2>
            <div className="h-1 w-16 rounded-full bg-accent" />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadImages}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading images...
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No images uploaded yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload your first image to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <div
                key={image.name}
                className="group relative overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
              >
                <div className="aspect-video bg-secondary/30">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="p-4">
                  <p className="mb-2 truncate text-sm font-medium" title={image.name}>
                    {image.name}
                  </p>
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(image.size)}</span>
                    <span>•</span>
                    <span>
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(image.url)}
                      className="flex-1 gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(image.url, "_blank")}
                      className="gap-2"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(image.name)}
                      className="gap-2 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
