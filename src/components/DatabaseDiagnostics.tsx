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
  const [dbCheck, setDbCheck] = useState<any>(null);
  const [checkingDb, setCheckingDb] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setDiagnostics(null); // Clear previous results
    try {
      console.log("🔍 Starting database diagnostics...");
      
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

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);
      
      if (result.success) {
        setDiagnostics(result.diagnostics);
        if (result.diagnostics.hasDuplicates) {
          toast.warning(`Found ${result.diagnostics.duplicates.length} duplicate keys`);
        } else {
          toast.success("Database is healthy - no duplicates found");
        }
      } else {
        console.error("Diagnostics failed:", result);
        toast.error(`Failed to run diagnostics: ${result.error || 'Unknown error'}`);
        // Still set some diagnostic info to show the error
        setDiagnostics({
          error: result.error,
          hint: result.hint,
          details: result.details
        });
      }
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast.error(`Failed to run diagnostics: ${error instanceof Error ? error.message : 'Network error'}`);
      setDiagnostics({
        error: error instanceof Error ? error.message : 'Network error'
      });
    }
    setLoading(false);
  };

  const testDatabaseConnection = async () => {
    setCheckingDb(true);
    setDbCheck(null);
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/db-check`;
      console.log("🔍 Testing database connection...");
      console.log("URL:", url);
      console.log("Project ID:", projectId);
      console.log("Has Anon Key:", !!publicAnonKey);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      const result = await response.json();
      console.log("Database check result:", result);
      setDbCheck(result);
      
      if (result.success) {
        toast.success(`Database connected! ${result.rowCount} rows found`);
      } else {
        toast.error(`Database connection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error checking database:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      toast.error(`Failed to check database: ${errorMessage}`);
      
      setDbCheck({
        success: false,
        error: errorMessage,
        hint: "Make sure the Supabase Edge Function is deployed and accessible",
        troubleshooting: [
          "1. Check if the Edge Function 'make-server-3bd0ade8' is deployed in Supabase",
          "2. Verify your internet connection",
          "3. Check browser console for CORS errors",
          "4. Ensure Supabase project is active and not paused"
        ]
      });
    }
    setCheckingDb(false);
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
          <div className="flex gap-2">
            <Button
              onClick={testDatabaseConnection}
              disabled={checkingDb}
              variant="outline"
              className="gap-2"
            >
              <Database className={`h-4 w-4 ${checkingDb ? 'animate-pulse' : ''}`} />
              Test Connection
            </Button>
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </Button>
          </div>
        </div>

        {/* Database Connection Test Result */}
        {dbCheck && (
          <div className="mb-6">
            {dbCheck.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Database Connected!</strong> Found {dbCheck.rowCount} rows in kv_store_3bd0ade8
                  <div className="mt-1 text-sm text-green-700">
                    Connection tested at {new Date(dbCheck.timestamp).toLocaleTimeString()}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>Connection Failed:</strong> {dbCheck.error}
                  {dbCheck.hint && (
                    <div className="mt-2 text-sm">
                      <strong>Hint:</strong> {dbCheck.hint}
                    </div>
                  )}
                  {dbCheck.troubleshooting && (
                    <div className="mt-3 text-sm">
                      <strong>Troubleshooting Steps:</strong>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {dbCheck.troubleshooting.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dbCheck.supabaseUrl && (
                    <div className="mt-2 text-sm">
                      <strong>Supabase URL:</strong> {dbCheck.supabaseUrl}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>About the "duplicate" warning in Supabase:</strong> This warning is normal and expected. 
            It appears when the database updates existing keys using the upsert operation (which is the correct behavior). 
            This diagnostics tool helps verify that there are no <em>actual</em> duplicate rows in the database.
          </AlertDescription>
        </Alert>

        {diagnostics && diagnostics.error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-900">
              <strong>Error:</strong> {diagnostics.error}
              {diagnostics.hint && (
                <div className="mt-2 text-sm">
                  <strong>Hint:</strong> {diagnostics.hint}
                </div>
              )}
              {diagnostics.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 rounded">
                    {JSON.stringify(diagnostics.details, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}

        {diagnostics && !diagnostics.error && (
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
                  <div className="mt-2 text-sm">
                    The "duplicate" warnings in Supabase are just informational messages about the upsert operation working correctly.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {diagnostics.explanation && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-blue-900 mb-3">
                  <strong>Understanding the "Duplicate" Warning</strong>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  <div>
                    <strong>What is Upsert?</strong> {diagnostics.explanation.whatIsUpsert}
                  </div>
                  <div>
                    <strong>Why the warning?</strong> {diagnostics.explanation.whyWarning}
                  </div>
                  <div>
                    <strong>Is this bad?</strong> {diagnostics.explanation.isThisBad}
                  </div>
                  <div>
                    <strong>When to worry:</strong> {diagnostics.explanation.whenToWorry}
                  </div>
                </div>
              </div>
            )}

            {diagnostics.note && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="text-muted-foreground mb-2">Note:</div>
                <p className="text-foreground">
                  {diagnostics.note}
                </p>
              </div>
            )}
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
