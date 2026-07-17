import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Trash2, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DatabaseCleanupProps {
  adminPassword: string;
}

export function DatabaseCleanup({ adminPassword }: DatabaseCleanupProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;

  const runCleanup = async (endpoint: string, name: string) => {
    setLoading(endpoint);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${serverUrl}/admin/cleanup/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Cleanup failed");
      }

      setResults({
        name,
        data: data.results,
        timestamp: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2">Database Cleanup</h2>
        <p className="text-muted-foreground text-sm">
          Remove old and unnecessary data from the database to optimize performance and storage.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>{results.name}</strong> completed successfully at {results.timestamp}
            {results.data.removed !== undefined && (
              <div className="mt-2 text-sm">
                {Array.isArray(results.data.removed) ? (
                  <>
                    <div>Removed {results.data.removed.length} items:</div>
                    {results.data.removed.length > 0 && (
                      <ul className="mt-1 ml-4 list-disc text-xs max-h-32 overflow-y-auto">
                        {results.data.removed.slice(0, 10).map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                        {results.data.removed.length > 10 && (
                          <li>...and {results.data.removed.length - 10} more</li>
                        )}
                      </ul>
                    )}
                  </>
                ) : (
                  <div>Removed: {results.data.removed} items</div>
                )}
              </div>
            )}
            {results.data.removed === false && (
              <div className="mt-2 text-sm">No legacy branding found</div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Full Database Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              Full Database Cleanup
            </CardTitle>
            <CardDescription className="text-xs">
              Remove all unnecessary data including old check-ins, destination tracking, and deprecated content structures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runCleanup("database", "Full Database Cleanup")}
              disabled={loading !== null}
              className="w-full"
              variant="default"
            >
              {loading === "database" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Run Full Cleanup
                </>
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              ⚠️ This will remove old data but keep all bookings and essential settings
            </p>
          </CardContent>
        </Card>

        {/* Legacy Branding Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5" />
              Remove Legacy Branding
            </CardTitle>
            <CardDescription className="text-xs">
              Clean up any remaining "Go Sintra" branding from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runCleanup("branding", "Legacy Branding Cleanup")}
              disabled={loading !== null}
              className="w-full"
              variant="secondary"
            >
              {loading === "branding" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Old Branding
                </>
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Safe to run - only removes old "Go Sintra" references
            </p>
          </CardContent>
        </Card>

        {/* Old Availability Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-5 w-5" />
              Clean Old Availability
            </CardTitle>
            <CardDescription className="text-xs">
              Remove availability records older than 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runCleanup("availability", "Old Availability Cleanup")}
              disabled={loading !== null}
              className="w-full"
              variant="secondary"
            >
              {loading === "availability" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Old Dates
                </>
              )}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Recommended to run monthly to keep database lean
            </p>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5" />
              About Database Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong className="text-foreground">What's Removed:</strong>
              <ul className="mt-1 ml-4 list-disc text-xs text-muted-foreground space-y-0.5">
                <li>Old check-in records</li>
                <li>Destination tracking data</li>
                <li>Deprecated content structures</li>
                <li>Old availability (30+ days)</li>
                <li>Legacy branding references</li>
              </ul>
            </div>
            <div>
              <strong className="text-foreground">What's Protected:</strong>
              <ul className="mt-1 ml-4 list-disc text-xs text-muted-foreground space-y-0.5">
                <li>All bookings (HOP-*)</li>
                <li>Current website content</li>
                <li>Pricing configuration</li>
                <li>Recent availability data</li>
                <li>Stripe payment data</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              💡 <strong>Tip:</strong> Run cleanup monthly for best performance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
