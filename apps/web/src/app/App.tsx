import {useEffect, useState} from 'react';
import {WebsiteLanguageContext} from './lib/translations/websiteText';
import {selectWebsiteLanguage} from './lib/translations/language';
import { RouterProvider } from "react-router";
import { router } from "@/routes";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { CookieConsent } from "@/components/CookieConsent";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DynamicManifest } from "@/components/DynamicManifest";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { HelmetProvider } from "react-helmet-async";

const GA_MEASUREMENT_ID = "G-VM2HFTLH4R";
const CLARITY_PROJECT_ID = "";

function App() {
  const [language,setLanguage] = useState(() => selectWebsiteLanguage(localStorage.getItem('language'), navigator.languages?.length ? navigator.languages : [navigator.language], ['en','pt','es','fr','de','nl','it']));
  useEffect(() => {
    const observer = new MutationObserver(() => setLanguage(document.documentElement.lang || 'en'));
    observer.observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
    return () => observer.disconnect();
  }, []);
  return (
    <HelmetProvider>
      <WebsiteLanguageContext.Provider value={language}>
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
      <CookieConsent language={language} />
      <RouterProvider router={router} />
    </WebsiteLanguageContext.Provider>
    </HelmetProvider>
  );
}

export default App;