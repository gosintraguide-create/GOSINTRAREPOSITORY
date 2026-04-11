import { RouterProvider } from "react-router";
import { router } from "./routes";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { MicrosoftClarity } from "./components/MicrosoftClarity";
import { CookieConsent } from "./components/CookieConsent";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { BackendStatusIndicator } from "./components/BackendStatusIndicator";
import { DynamicManifest } from "./components/DynamicManifest";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { HelmetProvider } from "react-helmet-async";

const GA_MEASUREMENT_ID = "G-VM2HFTLH4R";
const CLARITY_PROJECT_ID = "";

function App() {
  return (
    <HelmetProvider>
      {GA_MEASUREMENT_ID && (
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      )}
      {CLARITY_PROJECT_ID && (
        <MicrosoftClarity projectId={CLARITY_PROJECT_ID} />
      )}
      <DynamicManifest />
      <DynamicFavicon />
      <InstallPrompt />
      <OfflineIndicator />
      <BackendStatusIndicator />
      <CookieConsent />
      <RouterProvider router={router} />
    </HelmetProvider>
  );
}

export default App;
