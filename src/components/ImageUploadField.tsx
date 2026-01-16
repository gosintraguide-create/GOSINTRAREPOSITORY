import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export function ImageUploadField({
  value,
  onChange,
  placeholder = "Enter image URL or upload...",
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState(value);

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
  };

  const handleClear = () => {
    setPreviewUrl("");
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {value && (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={value}
            alt="Preview"
            className="h-48 w-full object-cover"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage failed to load%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Paste an image URL (e.g., from Unsplash, Imgur, or your own hosting)
      </p>
    </div>
  );
}
