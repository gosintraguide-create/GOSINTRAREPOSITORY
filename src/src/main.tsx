import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App.tsx";
import { ErrorBoundary } from "../components/ErrorBoundary.tsx";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

// TEMPORARILY DISABLED - Service Worker registration
// Uncomment this section once the module loading errors are resolved
/*
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);
      })
      .catch((error) => {
        console.log(
          "Service Worker registration failed:",
          error,
        );
      });
  });
}
*/

// Unregister any existing service workers to clear old cache
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      console.log("Unregistering service worker:", registration);
      registration.unregister();
    });
  });
}