import { useState, useEffect } from "react";
import { Save, Calculator } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { ImageSelector } from "./ImageSelector";
import { toast } from "sonner";
import {
  loadComprehensiveContent,
  saveComprehensiveContentAsync,
} from "../lib/comprehensiveContent";

// The 8 sites shown in the Sintra Day Planner calculator, in display order
const PLANNER_SITES = [
  {
    key: "pena" as const,
    label: "Pena Palace",
    description: "Fairytale palace · shown first in step 6",
  },
  {
    key: "moorish" as const,
    label: "Moorish Castle",
    description: "Castle walls + panoramic views",
  },
  {
    key: "regaleira" as const,
    label: "Quinta da Regaleira",
    description: "Initiation Well · Masonic tunnels",
  },
  {
    key: "monserrate" as const,
    label: "Monserrate Palace",
    description: "Best gardens in Sintra · hidden gem",
  },
  {
    key: "biester" as const,
    label: "Biester Palace",
    description: "Secret find · 50 m from Regaleira",
  },
  {
    key: "national" as const,
    label: "National Palace",
    description: "In town centre · historically significant",
  },
  {
    key: "capuchos" as const,
    label: "Convento dos Capuchos",
    description: "16th-century hermit monastery",
  },
  {
    key: "cabo" as const,
    label: "Cabo da Roca",
    description: "Westernmost point of continental Europe",
  },
] as const;

type SiteKey = (typeof PLANNER_SITES)[number]["key"];

export function PlannerImagesEditor() {
  const [images, setImages] = useState<Record<SiteKey, string>>({
    pena: "",
    moorish: "",
    regaleira: "",
    monserrate: "",
    biester: "",
    national: "",
    capuchos: "",
    cabo: "",
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing images from CMS on mount
  useEffect(() => {
    const content = loadComprehensiveContent();
    if (content.dayPlanner?.siteImages) {
      setImages(content.dayPlanner.siteImages as Record<SiteKey, string>);
    }
  }, []);

  function handleChange(key: SiteKey, url: string) {
    setImages((prev) => ({ ...prev, [key]: url }));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const content = loadComprehensiveContent();
      const updated = {
        ...content,
        dayPlanner: { siteImages: { ...images } },
      };
      const result = await saveComprehensiveContentAsync(updated);
      if (result.success) {
        toast.success("Planner images saved!");
        setHasChanges(false);
      } else {
        toast.error("Save failed — " + (result.error ?? "unknown error"));
      }
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Calculator className="h-5 w-5 text-primary" />
            Day Planner Images
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These images appear on the monument cards in Step 6 of the Sintra
            Day Planner calculator. If a slot is empty the planner falls back to
            a static placeholder.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="shrink-0">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Grid of image pickers */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {PLANNER_SITES.map(({ key, label, description }) => (
          <Card key={key} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{label}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageSelector
                label=""
                value={images[key]}
                onChange={(url) => handleChange(key, url)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sticky save bar shown when there are unsaved changes */}
      {hasChanges && (
        <div className="sticky bottom-4 flex justify-end">
          <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-lg">
            <span className="text-sm text-muted-foreground">Unsaved changes</span>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
