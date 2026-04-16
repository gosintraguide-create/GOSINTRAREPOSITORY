import { useRouteError } from "react-router";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export function RouterErrorFallback() {
  const error = useRouteError() as any;

  console.error("🚨 Router Error:", error);

  const handleGoHome = () => {
    // Clear any corrupted state and go home
    window.location.href = '/';
  };

  const handleReload = () => {
    // Clear service worker cache and reload
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[RouterError] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[RouterError] All caches cleared, reloading...');
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            We encountered an unexpected error. Please try one of the options below.
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={handleGoHome} size="lg">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
          <Button onClick={handleReload} variant="outline" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm">
            <p className="font-mono text-red-900">
              <strong>Error:</strong> {error.message || error.statusText || "Unknown error"}
            </p>
            {error.stack && (
              <details className="mt-2">
                <summary className="cursor-pointer font-semibold text-red-800">
                  Technical Details
                </summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-800">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
          <h3 className="mb-2 font-semibold">Common solutions:</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Reload the page to clear any temporary issues</li>
            <li>Clear your browser cache and cookies</li>
            <li>Check your internet connection</li>
            <li>Try accessing the site in an incognito/private window</li>
          </ul>
        </div>
      </div>
    </div>
  );
}