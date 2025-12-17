import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console
    console.error("🚨 Error Boundary caught an error:", error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    // Clear service worker cache and reload
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[ErrorBoundary] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[ErrorBoundary] All caches cleared, reloading...');
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-2xl">
            <div className="mb-6 text-center">
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h1 className="mb-2 text-2xl text-gray-900">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Please try reloading the page.
              </p>
            </div>

            <div className="mb-6 flex justify-center gap-3">
              <Button onClick={this.handleReload} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleReset} variant="outline" size="lg">
                Try Again
              </Button>
            </div>

            {isDevelopment && this.state.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  <div className="mb-2 font-mono text-sm">
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-mono text-sm font-semibold">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-auto whitespace-pre-wrap font-mono text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
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

    return this.props.children;
  }
}
