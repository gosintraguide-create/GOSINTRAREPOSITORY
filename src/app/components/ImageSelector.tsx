import { useState, useRef } from "react";
import { Image as ImageIcon, RefreshCw, X, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from 'sonner';
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
  folder?: string;
}

export function ImageSelector({ label, value, onChange, description, folder }: ImageSelectorProps) {
  const [isOpen, setIsOpen]     = useState(false);
  const [images, setImages]     = useState<UploadedImage[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const all: UploadedImage[] = result.images;
        setImages(folder ? all.filter(img => img.name.startsWith(folder + '/')) : all);
      }
    } catch {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload  = () => resolve(reader.result as string);
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
            fileName: folder ? `${folder}/${file.name}` : file.name,
            fileData: base64,
            fileType: file.type,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success("Imagem carregada!");
        await loadImages();
        // Auto-select the uploaded image if URL is returned
        if (result.url) {
          onChange(result.url);
          setIsOpen(false);
        }
      } else {
        toast.error("Erro ao carregar imagem");
      }
    } catch {
      toast.error("Erro ao carregar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadImages();
  };

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {value ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-border">
            <img src={value} alt="Selected" className="h-32 w-full object-cover" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleOpen} className="flex-1">
              <ImageIcon className="mr-2 h-4 w-4" />
              Alterar imagem
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={handleOpen} className="flex-1">
            <ImageIcon className="mr-2 h-4 w-4" />
            Escolher imagem
          </Button>
          <Button
            type="button" variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Carregar do computador"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setIsOpen(true); handleUpload(f); } }}
          />
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Selecionar imagem</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  {uploading ? "A carregar…" : "Carregar do computador"}
                </Button>
                <Button variant="ghost" size="sm" onClick={loadImages} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Escolhe uma imagem da galeria ou carrega uma nova do teu computador.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
          />

          {uploading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Upload className="mx-auto mb-3 h-8 w-8 animate-bounce opacity-50" />
              A carregar imagem…
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-muted-foreground">A carregar…</div>
          ) : images.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Sem imagens ainda</p>
              <p className="mt-2 text-sm text-muted-foreground">Carrega uma imagem do teu computador</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <button
                  key={image.name}
                  type="button"
                  onClick={() => handleSelect(image.url)}
                  className="group relative overflow-hidden rounded-lg border border-border bg-secondary/20 transition-all hover:shadow-md hover:border-primary"
                >
                  <div className="aspect-video bg-secondary/30">
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium" title={image.name}>
                      {image.name.replace(/^.*\//, '')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {value === image.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-primary">
                      <div className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        Selecionada
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
