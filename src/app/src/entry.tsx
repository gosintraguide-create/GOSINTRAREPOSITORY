import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/styles/globals.css";

// Log to verify this new entry point is loading
console.log("✅ Loading from NEW entry point: /src/entry.tsx");

// Global error handler for chunk loading failures (Layer 1 Recovery)
window.addEventListener("error", (event) => {
  const target = event.target as any;
  
  // Check if this is a chunk loading error (script or module)
  if (
    (target?.tagName === "SCRIPT" || target?.tagName === "LINK") ||
    (event.message && event.message.includes("Failed to fetch dynamically imported module"))
  ) {
    console.error("🔄 Chunk loading failed, initiating cache clear and reload...");
    event.preventDefault();
    
    // Clear all caches and reload
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`🗑️ Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log("✅ All caches cleared, reloading page...");
        window.location.reload();
      });
    } else {
      // Just reload if cache API not available
      window.location.reload();
    }
  }
});

// Unhandled promise rejection handler for dynamic import failures (Layer 2 Recovery)
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason?.message?.includes("Failed to fetch dynamically imported module")) {
    console.error("🔄 Dynamic import failed, initiating cache clear and reload...");
    event.preventDefault();
    
    // Clear all caches and reload
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log(`🗑️ Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log("✅ All caches cleared, reloading page...");
        window.location.reload();
      });
    } else {
      // Just reload if cache API not available
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);