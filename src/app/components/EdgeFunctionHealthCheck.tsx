import { useState } from "react";
import { Activity, AlertCircle, CheckCircle2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function EdgeFunctionHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8`;
  const healthEndpoint = `${edgeFunctionUrl}/health`;
  const supabaseDashboard = `https://supabase.com/dashboard/project/${projectId}/functions`;

  const checkHealth = async () => {
    setChecking(true);
    setHealthStatus(null);

    try {
      console.log("🏥 Checking Edge Function health...");
      console.log("URL:", healthEndpoint);

      const startTime = Date.now();
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log("Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`
      });

      if (response.ok) {
        const data = await response.json();
        setHealthStatus({
          success: true,
          status: data.status,
          timestamp: data.timestamp,
          responseTime,
          message: "Edge Function is running and healthy!"
        });
        toast.success("Edge Function is healthy!");
      } else {
        setHealthStatus({
          success: false,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          message: `Edge Function returned status ${response.status}`,
          hint: response.status === 404 
            ? "The endpoint doesn't exist. The Edge Function may not be deployed."
            : response.status === 401
            ? "Authentication failed. Check your Supabase credentials."
            : "The Edge Function is deployed but returned an error."
        });
        toast.error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Health check error:", error);
      
      setHealthStatus({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: "Cannot reach Edge Function",
        hint: "The Edge Function may not be deployed, or there's a network/CORS issue.",
        troubleshooting: [
          "Check if the Edge Function is deployed in Supabase Dashboard",
          "Verify your internet connection",
          "Check browser console for CORS errors",
          "Ensure the Supabase project is active (not paused)"
        ]
      });
      toast.error("Failed to reach Edge Function");
    }

    setChecking(false);
  };

  const copyToClipboard = (text: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          toast.success("Copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopyText(text);
        });
    } else {
      // Use fallback for non-secure contexts
      fallbackCopyText(text);
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
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error("Failed to copy. Please copy manually.");
      }
    } catch (err) {
      toast.error("Failed to copy. Please copy manually.");
    }

    document.body.removeChild(textArea);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-foreground">Edge Function Health Check</h2>
            <p className="text-muted-foreground">Verify the Supabase Edge Function is deployed and accessible</p>
          </div>
        </div>
        <Button
          onClick={checkHealth}
          disabled={checking}
          className="gap-2"
        >
          <Activity className={`h-4 w-4 ${checking ? 'animate-pulse' : ''}`} />
          Check Health
        </Button>
      </div>

      {/* Connection Info */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <h3 className="font-medium mb-3 text-foreground">Connection Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Project ID:</span>
            <code className="bg-muted px-2 py-1 rounded text-foreground">{projectId}</code>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Edge Function URL:</span>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-1 rounded text-xs text-foreground max-w-[300px] truncate">
                {edgeFunctionUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(edgeFunctionUrl)}
                className="h-7 w-7 p-0"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Has Anon Key:</span>
            <span className="text-foreground">{publicAnonKey ? "✅ Yes" : "❌ No"}</span>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(supabaseDashboard, '_blank')}
            className="gap-2 w-full"
          >
            <ExternalLink className="h-4 w-4" />
            Open Supabase Edge Functions Dashboard
          </Button>
        </div>
      </div>

      {/* Health Check Result */}
      {healthStatus && (
        <div className="space-y-4">
          {healthStatus.success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>{healthStatus.message}</strong>
                <div className="mt-2 text-sm space-y-1">
                  <div>Status: {healthStatus.status}</div>
                  <div>Response Time: {healthStatus.responseTime}ms</div>
                  <div>Timestamp: {new Date(healthStatus.timestamp).toLocaleString()}</div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>{healthStatus.message}</strong>
                {healthStatus.error && (
                  <div className="mt-2 text-sm">
                    <strong>Error:</strong> {healthStatus.error}
                  </div>
                )}
                {healthStatus.hint && (
                  <div className="mt-2 text-sm">
                    <strong>Hint:</strong> {healthStatus.hint}
                  </div>
                )}
                {healthStatus.troubleshooting && (
                  <div className="mt-3">
                    <strong className="text-sm">Troubleshooting Steps:</strong>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                      {healthStatus.troubleshooting.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <h3 className="font-medium mb-2 text-blue-900">How to Deploy the Edge Function</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>If the health check fails, you may need to deploy the Edge Function:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open the Supabase Dashboard (click button above)</li>
            <li>Go to "Edge Functions" in the left sidebar</li>
            <li>Look for a function called "make-server-3bd0ade8"</li>
            <li>If it doesn't exist or shows as "not deployed", deploy it from your code</li>
            <li>Check the logs for any deployment errors</li>
          </ol>
          <div className="mt-3 p-3 bg-blue-100 rounded">
            <strong>Note:</strong> In development, you can also run the Edge Function locally using:
            <code className="block mt-1 bg-blue-200 px-2 py-1 rounded text-xs">
              supabase functions serve make-server-3bd0ade8
            </code>
          </div>
        </div>
      </div>
    </Card>
  );
}
