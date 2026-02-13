// Child pricing feature: ages 7-12 - Build 2024-12-19-002
// Force rebuild - React Router implementation - Build 2025-02-10
import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { router } from "./routes.tsx";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { MicrosoftClarity } from "./components/MicrosoftClarity";
import { CookieConsent } from "./components/CookieConsent";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { BackendStatusIndicator } from "./components/BackendStatusIndicator";
import { DynamicManifest } from "./components/DynamicManifest";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { Analytics } from "@vercel/analytics/react";

// Analytics Configuration
const GA_MEASUREMENT_ID = "G-VM2HFTLH4R";
const CLARITY_PROJECT_ID = "";

function App() {
  return (
    <HelmetProvider>
      {/* Analytics */}
      {GA_MEASUREMENT_ID && (
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      )}
      {CLARITY_PROJECT_ID && (
        <MicrosoftClarity projectId={CLARITY_PROJECT_ID} />
      )}
      <Analytics />

      {/* PWA & System Components */}
      <DynamicManifest />
      <DynamicFavicon />
      <InstallPrompt />
      <OfflineIndicator />
      <BackendStatusIndicator />
      <CookieConsent />

      {/* Main Router */}
      <RouterProvider router={router} />
    </HelmetProvider>
  );
}

export default App;