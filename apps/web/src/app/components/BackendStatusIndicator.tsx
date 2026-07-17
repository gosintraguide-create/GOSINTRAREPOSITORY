import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function BackendStatusIndicator() {
  const [status, setStatus] = useState<"checking" | "online" | "offline" | "quota-exceeded" | null>(null);
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
      const timeoutId = setTimeout(() => {
        controller.abort(new Error("Backend health check timeout after 15 seconds"));
      }, 15000); // 15 second timeout (increased from 5 to handle cold starts)

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

      // Check if it's an HTML response (quota exceeded)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('exceeded your Free Plan quota') || text.includes('quota in this billing')) {
          console.warn("⚠️ Supabase quota exceeded");
          setStatus("quota-exceeded");
          setErrorDetails("Your Supabase account has exceeded the free tier Edge Function invocations quota. Please upgrade your Supabase plan or wait for the monthly quota to reset.");
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Backend is online:", data);
        setStatus("online");
      } else {
        console.log("ℹ️ Backend not deployed (this is normal in development):", response.status);
        setStatus("offline");
        setErrorDetails(
          `Backend returned ${response.status}. ${
            response.status === 404
              ? "Edge Function not deployed. App will work locally with cached data."
              : "Backend service error."
          }`
        );
      }
    } catch (error) {
      console.warn("⚠️ Backend check failed:", error);
      setStatus("offline");
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setErrorDetails("Backend timeout (15s). Service may be cold-starting or not deployed.");
        } else if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          setErrorDetails("Cannot reach backend. Edge Function may not be deployed.");
        } else {
          setErrorDetails(error.message || "Unknown error");
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

  // Show special alert for quota exceeded
  if (status === "quota-exceeded") {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <Alert className="bg-orange-50 border-orange-300 shadow-lg">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <strong className="block mb-1">⚠️ Supabase Quota Exceeded</strong>
                <p className="text-sm mb-2">
                  Your Supabase free tier limit has been reached. Bookings and payments are temporarily disabled.
                </p>
                {showDetails && errorDetails && (
                  <p className="text-xs bg-orange-100 p-2 rounded mb-2">
                    {errorDetails}
                  </p>
                )}
                <p className="text-xs mb-3 font-semibold">
                  Solutions:
                </p>
                <ul className="text-xs list-disc list-inside mb-3 space-y-1">
                  <li>Upgrade to Supabase Pro plan (recommended)</li>
                  <li>Wait for monthly quota reset</li>
                  <li>Site will operate in read-only mode with localStorage</li>
                </ul>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                    className="h-7 text-xs"
                  >
                    Upgrade Plan
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDetails(!showDetails)}
                    className="h-7 text-xs"
                  >
                    {showDetails ? "Hide" : "Details"}
                  </Button>
                </div>
              </div>
              <button
                onClick={() => setStatus(null)}
                className="text-orange-600 hover:text-orange-800 text-lg leading-none"
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