import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { getCookieContent } from "../lib/translations";

interface CookieConsentProps {
  language: string;
  onNavigate: (page: string) => void;
}

export function CookieConsent({ language, onNavigate }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    functional: false,
    analytics: false,
    marketing: false,
  });

  const content = getCookieContent(language);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error("Error loading cookie preferences:", e);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyNecessary);
    localStorage.setItem("cookie-consent", JSON.stringify(onlyNecessary));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl">
        {!showSettings ? (
          // Simple banner
          <Card className="border-2 border-primary/20 bg-white shadow-2xl p-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="h-8 w-8 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-foreground">{content.title}</h3>
                <p className="mb-4 text-muted-foreground">
                  {content.description}{" "}
                  <button
                    onClick={() => onNavigate("privacy-policy")}
                    className="text-primary hover:underline"
                  >
                    {content.privacyLink}
                  </button>
                  .
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={handleAcceptAll}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {content.acceptAll}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleRejectAll}
                  >
                    {content.rejectAll}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                  >
                    {content.customize}
                  </Button>
                </div>
              </div>
              <button
                onClick={handleRejectAll}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </Card>
        ) : (
          // Settings panel
          <Card className="border-2 border-primary/20 bg-white shadow-2xl p-6 animate-fade-in max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Cookie className="h-8 w-8 text-accent" />
                  <h3 className="text-foreground">{content.settingsTitle}</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-muted-foreground">
                {content.settingsDescription}
              </p>
            </div>

            <div className="space-y-6">
              {/* Necessary Cookies */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={true}
                    disabled={true}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="mb-2 text-foreground">
                      {content.categories.necessary.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {content.categories.necessary.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={preferences.functional}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, functional: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="mb-2 text-foreground">
                      {content.categories.functional.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {content.categories.functional.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, analytics: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="mb-2 text-foreground">
                      {content.categories.analytics.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {content.categories.analytics.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={preferences.marketing}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, marketing: !!checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="mb-2 text-foreground">
                      {content.categories.marketing.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {content.categories.marketing.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleSavePreferences}
                className="bg-primary hover:bg-primary/90"
              >
                {content.savePreferences}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleAcceptAll}
              >
                {content.acceptAll}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleRejectAll}
              >
                {content.rejectAll}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
