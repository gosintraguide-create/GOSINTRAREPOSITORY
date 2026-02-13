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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

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
    const files = e.target.files;
    if (files) {
      const validFiles: File[] = [];
      const urls: string[] = [];

      for (const file of files) {
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

        validFiles.push(file);
        // Create preview URL
        const url = URL.createObjectURL(file);
        urls.push(url);
      }

      setSelectedFiles(validFiles);
      setPreviewUrls(urls);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });

    try {
      let successCount = 0;
      let failCount = 0;

      // Upload all files sequentially to show progress
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/images/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: file.name,
                fileData: base64,
                fileType: file.type,
              }),
            }
          );

          const result = await response.json();
          if (result.success) {
            successCount++;
            setUploadProgress({ current: i + 1, total: selectedFiles.length });
          } else {
            failCount++;
            console.error(`Failed to upload ${file.name}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Show summary message
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${failCount} failed`);
      } else {
        toast.error("All uploads failed");
      }

      // Reset state
      setSelectedFiles([]);
      setPreviewUrls([]);
      setUploadProgress(null);
      
      // Reset file input
      const fileInput = document.getElementById("image-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      // Reload images
      await loadImages();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
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
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast.success("Image URL copied to clipboard!");
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopyText(url);
        });
    } else {
      // Use fallback for non-secure contexts
      fallbackCopyText(url);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        toast.success("Image URL copied to clipboard!");
      } else {
        toast.error("Failed to copy. Please copy manually.");
      }
    } catch (err) {
      toast.error("Failed to copy. Please copy manually.");
    }

    document.body.removeChild(textArea);
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
            <Label htmlFor="image-upload">Select Images (Multiple)</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
              multiple
            />
            <p className="mt-1 text-xs text-muted-foreground">
              You can select multiple images at once. Hold Ctrl/Cmd to select multiple files.
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="mb-3 text-sm font-medium">
                Selected Images ({selectedFiles.length})
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative overflow-hidden rounded-lg border border-border bg-white p-3">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="aspect-video w-full rounded object-cover"
                    />
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="truncate font-medium" title={selectedFiles[index]?.name}>
                        {selectedFiles[index]?.name}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedFiles[index] && formatFileSize(selectedFiles[index].size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadProgress && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">Uploading images...</span>
                <span className="text-muted-foreground">
                  {uploadProgress.current} / {uploadProgress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="bg-primary hover:bg-primary/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading 
              ? `Uploading ${uploadProgress?.current || 0} of ${selectedFiles.length}...` 
              : selectedFiles.length > 0
              ? `Upload ${selectedFiles.length} Image${selectedFiles.length > 1 ? 's' : ''}`
              : "Upload Images"}
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