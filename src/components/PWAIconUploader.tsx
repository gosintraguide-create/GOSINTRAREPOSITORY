import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ArrowLeft, Upload, Check, FileImage, Download } from "lucide-react";
import { toast } from "sonner@2.0.3";

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

interface IconData {
  size: number;
  file: File | null;
  base64: string;
  uploaded: boolean;
}

interface PWAIconUploaderProps {
  onNavigate: (page: string) => void;
}

export function PWAIconUploader({ onNavigate }: PWAIconUploaderProps) {
  const [icons, setIcons] = useState<IconData[]>(
    ICON_SIZES.map(size => ({
      size,
      file: null,
      base64: "",
      uploaded: false
    }))
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const completedCount = icons.filter(icon => icon.uploaded).length;
  const progressPercent = Math.round((completedCount / 8) * 100);

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDraggingIndex(null);

    const files = Array.from(e.dataTransfer.files);
    const pngFile = files.find(file => file.type === "image/png");

    if (!pngFile) {
      toast.error("Please drop a PNG file!");
      return;
    }

    await processFile(pngFile, index);
  };

  // Process uploaded file
  const processFile = async (file: File, index: number) => {
    try {
      const base64 = await fileToBase64(file);
      
      // Validate it's an image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = base64;
      });

      // Update icon data
      const newIcons = [...icons];
      newIcons[index] = {
        ...newIcons[index],
        file,
        base64,
        uploaded: true
      };
      setIcons(newIcons);

      toast.success(`✅ ${icons[index].size}×${icons[index].size} icon ready!`);
    } catch (error) {
      toast.error("Failed to process image!");
    }
  };

  // Handle file input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      toast.error("Please select a PNG file!");
      return;
    }

    await processFile(file, index);
  };

  // Download all icons data as JSON for easy sharing
  const downloadIconsData = () => {
    const dataToDownload = {
      icons: icons.filter(icon => icon.uploaded).map(icon => ({
        filename: `icon-${icon.size}x${icon.size}.png`,
        size: `${icon.size}x${icon.size}`,
        dataUrl: icon.base64
      })),
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(dataToDownload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pwa-icons-data.json";
    link.click();
    URL.revokeObjectURL(url);

    toast.success("📥 Icons data downloaded! Use the PWA Icon Installer to complete setup.");
  };

  // Clear specific icon
  const clearIcon = (index: number) => {
    const newIcons = [...icons];
    newIcons[index] = {
      size: newIcons[index].size,
      file: null,
      base64: "",
      uploaded: false
    };
    setIcons(newIcons);
    toast.info(`Cleared ${icons[index].size}×${icons[index].size} icon`);
  };

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onNavigate("home")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>

          {completedCount === 8 && (
            <Button
              onClick={downloadIconsData}
              className="gap-2"
              variant="default"
            >
              <Download className="h-4 w-4" />
              Download Icons Data
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-foreground mb-2">🎨 PWA Icon Uploader</h1>
          <p className="text-muted-foreground">
            Upload all 8 icon sizes for your Progressive Web App. Drag and drop your PNG files below.
          </p>
        </div>

        {/* Progress */}
        <Card className="border-border p-6 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Progress: {completedCount} / 8 icons uploaded
            </span>
            <span className="text-sm text-primary">
              {progressPercent}%
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 p-6 mb-6">
          <div className="flex gap-3">
            <FileImage className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-foreground mb-2">📋 How to Upload</h3>
              <ol className="text-sm space-y-1 text-blue-900 list-decimal list-inside">
                <li>Drag your PNG files into the corresponding size boxes below</li>
                <li>Or click "Browse" to select files from your computer</li>
                <li>Preview will appear when file is loaded</li>
                <li>When all 8 icons are uploaded, click "Download Icons Data"</li>
                <li>Go to "Install PWA Icons" and paste the downloaded JSON content</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Icon Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {icons.map((icon, index) => (
            <Card 
              key={icon.size}
              className={`border-2 border-dashed transition-all ${
                draggingIndex === index
                  ? "border-accent bg-accent/10 scale-105"
                  : icon.uploaded
                  ? "border-green-500 bg-green-50"
                  : "border-border"
              }`}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={(e) => {
                e.preventDefault();
                setDraggingIndex(index);
              }}
              onDragLeave={() => setDraggingIndex(null)}
            >
              <div className="p-4">
                {/* Size Label */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-foreground">
                    {icon.size}×{icon.size}
                  </h3>
                  {icon.uploaded && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {/* Upload Area or Preview */}
                {!icon.uploaded ? (
                  <div className="text-center">
                    <FileImage className={`h-12 w-12 mx-auto mb-2 transition-all ${
                      draggingIndex === index 
                        ? "text-accent scale-110" 
                        : "text-muted-foreground"
                    }`} />
                    <p className="text-xs text-muted-foreground mb-3">
                      {draggingIndex === index ? "Drop here!" : "Drag & drop PNG"}
                    </p>
                    
                    <input
                      type="file"
                      accept="image/png"
                      onChange={(e) => handleFileSelect(e, index)}
                      className="hidden"
                      id={`file-input-${icon.size}`}
                    />
                    <label htmlFor={`file-input-${icon.size}`}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(`file-input-${icon.size}`)?.click();
                        }}
                      >
                        Browse
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="text-center">
                    {/* Preview */}
                    <div className="mb-3 flex justify-center">
                      <img
                        src={icon.base64}
                        alt={`Icon ${icon.size}x${icon.size}`}
                        className="w-16 h-16 border border-border rounded-lg shadow-sm"
                      />
                    </div>
                    <p className="text-xs text-green-600 mb-2">
                      ✓ Ready
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => clearIcon(index)}
                    >
                      Replace
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Success Message */}
        {completedCount === 8 && (
          <Card className="border-green-200 bg-green-50 p-6 mt-6">
            <div className="text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-foreground mb-2">🎉 All Icons Uploaded!</h2>
              <p className="text-sm text-green-900 mb-4">
                Click "Download Icons Data" above, then use the PWA Icon Installer to complete the setup!
              </p>
              <Button
                onClick={() => onNavigate("pwa-installer")}
                className="bg-accent hover:bg-accent/90"
              >
                Go to PWA Icon Installer
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
