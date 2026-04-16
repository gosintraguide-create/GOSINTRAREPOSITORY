import { useState, useEffect } from "react";
import { Flag, Save, RefreshCw, Info, Check } from "lucide-react";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";

interface FeatureFlags {
  privateToursEnabled: boolean;
  sunsetSpecialEnabled: boolean;
  monumentTicketsEnabled: boolean;
  liveChat: boolean;
  cookieConsent: boolean;
  offlineMode: boolean;
  pwaInstallPrompt: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  privateToursEnabled: false,
  sunsetSpecialEnabled: true,
  monumentTicketsEnabled: false,
  liveChat: true,
  cookieConsent: true,
  offlineMode: true,
  pwaInstallPrompt: true,
};

const FLAG_DESCRIPTIONS: Record<keyof FeatureFlags, { title: string; description: string }> = {
  privateToursEnabled: {
    title: "Private Tours Page",
    description: "Show full Private Tours page instead of 'Coming Soon' message"
  },
  sunsetSpecialEnabled: {
    title: "Sunset Special Carousel",
    description: "Display the sunset drive special offer on the homepage"
  },
  monumentTicketsEnabled: {
    title: "Monument Ticket Sales",
    description: "Enable online purchase of attraction entrance tickets during booking"
  },
  liveChat: {
    title: "Live Chat Widget",
    description: "Enable WhatsApp live chat widget on all pages"
  },
  cookieConsent: {
    title: "Cookie Consent Banner",
    description: "Show cookie consent banner for GDPR compliance"
  },
  offlineMode: {
    title: "Offline Mode",
    description: "Enable Progressive Web App offline functionality"
  },
  pwaInstallPrompt: {
    title: "PWA Install Prompt",
    description: "Show install prompt for Progressive Web App"
  },
};

export function FeatureFlagManager() {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load flags from localStorage on mount
  useEffect(() => {
    const savedFlags = localStorage.getItem("feature-flags");
    if (savedFlags) {
      try {
        const parsed = JSON.parse(savedFlags);
        setFlags({ ...DEFAULT_FLAGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse feature flags:", e);
      }
    }
  }, []);

  const toggleFlag = (key: keyof FeatureFlags) => {
    setFlags(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const saveFlags = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("feature-flags", JSON.stringify(flags));
      toast.success("Feature flags saved successfully!");
      setHasChanges(false);
      
      // Trigger a storage event to update components
      window.dispatchEvent(new Event("storage"));
      
      // Reload to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (e) {
      console.error("Failed to save feature flags:", e);
      toast.error("Failed to save feature flags");
    } finally {
      setIsSaving(false);
    }
  };

  const resetFlags = () => {
    if (confirm("Reset all feature flags to default values?")) {
      setFlags(DEFAULT_FLAGS);
      setHasChanges(true);
      toast.info("Feature flags reset to defaults. Click Save to apply.");
    }
  };

  return (
    <Card className="border-border p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Flag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-foreground">Feature Flags</h2>
              <p className="text-sm text-muted-foreground">
                Control which features are enabled on your site
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFlags}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={saveFlags}
              disabled={!hasChanges || isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        <div className="h-1 w-16 rounded-full bg-accent mt-3" />
      </div>

      {hasChanges && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            You have unsaved changes. Click <strong>Save Changes</strong> to apply them. The page will reload automatically.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {(Object.keys(FLAG_DESCRIPTIONS) as Array<keyof FeatureFlags>).map((key) => {
          const flag = FLAG_DESCRIPTIONS[key];
          return (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-4 transition-colors hover:bg-secondary/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={key}
                    className="cursor-pointer text-sm text-foreground"
                  >
                    {flag.title}
                  </Label>
                  {flags[key] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      <Check className="h-3 w-3" />
                      Enabled
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {flag.description}
                </p>
              </div>
              <div className="ml-4">
                <Switch
                  id={key}
                  checked={flags[key]}
                  onCheckedChange={() => toggleFlag(key)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Changes take effect immediately after saving. 
              The page will reload automatically to apply the new settings.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
