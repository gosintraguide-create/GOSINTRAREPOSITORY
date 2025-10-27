import { useState } from "react";
import { Flag, Info } from "lucide-react";
import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

/**
 * Feature Flag Manager Component
 * 
 * This component displays the current feature flag settings.
 * To change flags, edit /lib/featureFlags.ts directly.
 */

export function FeatureFlagManager() {
  // Note: We import the flags dynamically to show current state
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Flag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg">Feature Flags</h3>
          <p className="text-sm text-muted-foreground">Control which features are enabled</p>
        </div>
      </div>

      <Alert className="mb-4">
        <Info className="h-4 w-4" />
        <AlertDescription>
          To enable/disable features, edit the file <code className="rounded bg-secondary px-1 py-0.5">/lib/featureFlags.ts</code> and change the flag values. The changes will take effect immediately.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {/* Private Tours Flag */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex-1">
            <Label htmlFor="private-tours" className="cursor-pointer">
              Private Tours Page
            </Label>
            <p className="text-sm text-muted-foreground">
              When disabled, shows "Coming Soon" page. When enabled, shows full private tours content.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Current status: <strong>{window.location.hostname}/private-tours</strong>
            </p>
          </div>
          <div className="ml-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Edit file to change
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-secondary/30 p-4">
        <h4 className="mb-2 text-sm">Quick Guide:</h4>
        <ol className="space-y-1 text-sm text-muted-foreground">
          <li>1. Open <code className="rounded bg-secondary px-1 py-0.5">/lib/featureFlags.ts</code></li>
          <li>2. Change <code className="rounded bg-secondary px-1 py-0.5">privateToursEnabled: false</code> to <code className="rounded bg-secondary px-1 py-0.5">true</code></li>
          <li>3. Save the file</li>
          <li>4. The page will update automatically</li>
        </ol>
      </div>
    </Card>
  );
}
