import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function BackendStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "online" | "offline" | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setStatus("checking");
    setErrorDetails("");

    try {
      console.log("🔍 Checking backend status...");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/health`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend is online:", data);
        setStatus("online");
      } else {
        console.error("❌ Backend returned error:", response.status);
        setStatus("offline");
        setErrorDetails(
          `Backend returned ${response.status}. ${
            response.status === 404
              ? "Edge Function may not be deployed."
              : "Backend service error."
          }`
        );
      }
    } catch (error) {
      console.error("❌ Backend check failed:", error);
      setStatus("offline");
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setErrorDetails("Backend timeout. Service may be starting up or not deployed.");
        } else if (error.message.includes("Failed to fetch")) {
          setErrorDetails("Cannot reach backend. Edge Function may not be deployed.");
        } else {
          setErrorDetails(error.message);
        }
      } else {
        setErrorDetails("Unknown connection error");
      }
    }
  };

  // Don't show anything if checking or online
  if (status === "checking" || status === "online" || status === null) {
    return null;
  }

  // Only show alert if offline
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-red-50 border-red-200 shadow-lg">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <strong className="block mb-1">⚠️ Backend Service Offline</strong>
              <p className="text-sm mb-2">
                Bookings and payments won't work until the backend is deployed.
              </p>
              {showDetails && errorDetails && (
                <p className="text-xs bg-red-100 p-2 rounded mb-2 font-mono">
                  {errorDetails}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkBackendStatus}
                  className="h-7 text-xs"
                >
                  <Loader2 className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-7 text-xs"
                >
                  {showDetails ? "Hide" : "Details"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("/diagnostics", "_blank")}
                  className="h-7 text-xs"
                >
                  Diagnostics
                </Button>
              </div>
            </div>
            <button
              onClick={() => setStatus(null)}
              className="text-red-600 hover:text-red-800 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
