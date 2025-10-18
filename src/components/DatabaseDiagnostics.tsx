import { useState } from "react";
import { Database, AlertCircle, CheckCircle2, RefreshCw, Trash2, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DatabaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/db-diagnostics`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setDiagnostics(result.diagnostics);
        if (result.diagnostics.hasDuplicates) {
          toast.warning(`Found ${result.diagnostics.duplicates.length} duplicate keys`);
        } else {
          toast.success("Database is healthy - no duplicates found");
        }
      } else {
        toast.error("Failed to run diagnostics");
      }
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast.error("Failed to run diagnostics");
    }
    setLoading(false);
  };

  const cleanupDatabase = async () => {
    if (!confirm("This will remove any duplicate rows. Are you sure?")) {
      return;
    }

    setCleaning(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/db-cleanup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Database cleaned! ${result.recordsRestored} records restored`);
        // Re-run diagnostics
        await runDiagnostics();
      } else {
        toast.error("Failed to clean database");
      }
    } catch (error) {
      console.error("Error cleaning database:", error);
      toast.error("Failed to clean database");
    }
    setCleaning(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-foreground">Database Diagnostics</h2>
              <p className="text-muted-foreground">Check database health and clean up duplicates</p>
            </div>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>About the "duplicate" warning in Supabase:</strong> This warning is normal and expected. 
            It appears when the database updates existing keys using the upsert operation (which is the correct behavior). 
            This diagnostics tool helps verify that there are no <em>actual</em> duplicate rows in the database.
          </AlertDescription>
        </Alert>

        {diagnostics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-muted-foreground mb-1">Total Keys</div>
                <div className="text-foreground">{diagnostics.totalKeys}</div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-muted-foreground mb-1">Total Rows</div>
                <div className="text-foreground">{diagnostics.totalRows}</div>
              </div>
            </div>

            {diagnostics.hasDuplicates ? (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  <strong>Warning:</strong> Found {diagnostics.duplicates.length} keys with duplicate rows.
                  <div className="mt-2 space-y-1">
                    {diagnostics.duplicates.map((key: string) => (
                      <div key={key} className="font-mono text-sm">
                        {key}: {diagnostics.keyCount[key]} rows
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={cleanupDatabase}
                    disabled={cleaning}
                    variant="outline"
                    className="mt-4 gap-2 border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    {cleaning ? "Cleaning..." : "Clean Up Duplicates"}
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>All good!</strong> No duplicate rows found in the database.
                  The "duplicate" warnings in Supabase are just informational messages about the upsert operation.
                </AlertDescription>
              </Alert>
            )}

            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="text-muted-foreground mb-2">Note:</div>
              <p className="text-foreground">
                {diagnostics.note}
              </p>
            </div>
          </div>
        )}

        {!diagnostics && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            Click "Run Diagnostics" to check your database health
          </div>
        )}
      </Card>
    </div>
  );
}
