import { useState, useEffect, lazy, Suspense } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LiveChat } from "./components/LiveChat";
import { FloatingCTA } from "./components/FloatingCTA";
import { AdminAccess } from "./components/AdminAccess";
import { SEOHead } from "./components/SEOHead";
import { CookieConsent } from "./components/CookieConsent";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { DynamicManifest } from "./components/DynamicManifest";
import { loadContentWithLanguage } from "./lib/contentManager";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { Analytics } from "@vercel/analytics/react";

// Lazy load page components for better performance
const HomePage = lazy(() =>
  import("./components/HomePage").then((m) => ({
    default: m.HomePage,
  })),
);
const AttractionsPage = lazy(() =>
  import("./components/AttractionsPage").then((m) => ({
    default: m.AttractionsPage,
  })),
);
const HowItWorksPage = lazy(() =>
  import("./components/HowItWorksPage").then((m) => ({
    default: m.HowItWorksPage,
  })),
);
const BuyTicketPage = lazy(() =>
  import("./components/BuyTicketPage").then((m) => ({
    default: m.BuyTicketPage,
  })),
);
const AboutPage = lazy(() =>
  import("./components/AboutPage").then((m) => ({
    default: m.AboutPage,
  })),
);
const AttractionDetailPage = lazy(() =>
  import("./components/AttractionDetailPage").then((m) => ({
    default: m.AttractionDetailPage,
  })),
);
const RequestPickupPage = lazy(() =>
  import("./components/RequestPickupPage").then((m) => ({
    default: m.RequestPickupPage,
  })),
);
const AdminPage = lazy(() =>
  import("./components/AdminPage").then((m) => ({
    default: m.AdminPage,
  })),
);
const BookingConfirmationPage = lazy(() =>
  import("./components/BookingConfirmationPage").then((m) => ({
    default: m.BookingConfirmationPage,
  })),
);
const QRScannerPage = lazy(() =>
  import("./components/QRScannerPage").then((m) => ({
    default: m.QRScannerPage,
  })),
);
const DiagnosticsPage = lazy(() =>
  import("./components/DiagnosticsPage").then((m) => ({
    default: m.DiagnosticsPage,
  })),
);
const PrivacyPolicyPage = lazy(() =>
  import("./components/PrivacyPolicyPage").then((m) => ({
    default: m.PrivacyPolicyPage,
  })),
);
const TermsOfServicePage = lazy(() =>
  import("./components/TermsOfServicePage").then((m) => ({
    default: m.TermsOfServicePage,
  })),
);
const ManageBookingPage = lazy(() =>
  import("./components/ManageBookingPage").then((m) => ({
    default: m.ManageBookingPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("./components/AnalyticsPage").then((m) => ({
    default: m.AnalyticsPage,
  })),
);
const OperationsPage = lazy(() =>
  import("./components/OperationsPage").then((m) => ({
    default: m.OperationsPage,
  })),
);
const ManualBookingPage = lazy(() =>
  import("./components/ManualBookingPage").then((m) => ({
    default: m.ManualBookingPage,
  })),
);
const PWAIconUploader = lazy(() =>
  import("./components/PWAIconUploader").then((m) => ({
    default: m.PWAIconUploader,
  })),
);
const PWAIconInstaller = lazy(() =>
  import("./components/PWAIconInstaller").then((m) => ({
    default: m.PWAIconInstaller,
  })),
);
const DebugIconsPage = lazy(() =>
  import("./components/DebugIconsPage").then((m) => ({
    default: m.DebugIconsPage,
  })),
);
const BlogPage = lazy(() =>
  import("./components/BlogPage").then((m) => ({
    default: m.BlogPage,
  })),
);
const BlogArticlePage = lazy(() =>
  import("./components/BlogArticlePage").then((m) => ({
    default: m.BlogArticlePage,
  })),
);

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

// Detect user's browser language and map to supported languages
function detectBrowserLanguage(): string {
  const supportedLanguages = ["en", "es", "fr", "de", "pt"];

  // Get browser language (e.g., "en-US", "pt-BR", "es")
  const browserLang =
    navigator.language || navigator.languages?.[0] || "en";

  // Extract the language code (e.g., "en-US" -> "en")
  const langCode = browserLang.toLowerCase().split("-")[0];

  // Return the language if supported, otherwise default to English
  return supportedLanguages.includes(langCode)
    ? langCode
    : "en";
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [language, setLanguage] = useState(() => {
    // Priority: 1. Saved language, 2. Browser language, 3. Default to English
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || detectBrowserLanguage();
  });
  const [websiteContent, setWebsiteContent] = useState(() =>
    loadContentWithLanguage(language),
  );
  const [bookingData, setBookingData] = useState<any>(null);
  const [pageData, setPageData] = useState<any>(null);

  // Handle URL-based page navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(
      window.location.search,
    );
    const page = urlParams.get("page");
    if (page) {
      setCurrentPage(page);
    }
  }, []);

  // Update URL when page changes
  useEffect(() => {
    const urlParams = new URLSearchParams(
      window.location.search,
    );
    const currentUrlPage = urlParams.get("page");

    if (currentPage !== "home") {
      if (currentUrlPage !== currentPage) {
        window.history.pushState(
          {},
          "",
          `?page=${currentPage}`,
        );
      }
    } else {
      if (currentUrlPage) {
        window.history.pushState({}, "", "/");
      }
    }
  }, [currentPage]);

  // Remove dark class if it exists and initialize language
  useEffect(() => {
    // Force remove dark class
    document.documentElement.classList.remove("dark");

    // If no saved language, save the detected language
    const savedLanguage = localStorage.getItem("language");
    if (!savedLanguage) {
      localStorage.setItem("language", language);
    }
  }, [language]);

  // Register service worker for PWA functionality
  useEffect(() => {
    // Only register service worker in production (when not on localhost)
    const isProduction =
      !window.location.hostname.includes("localhost") &&
      !window.location.hostname.includes("127.0.0.1");

    if ("serviceWorker" in navigator && isProduction) {
      window.addEventListener("load", async () => {
        try {
          const registration =
            await navigator.serviceWorker.register("/sw.js");

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  toast.info(
                    "New version available! Refresh to update.",
                    {
                      duration: 10000,
                      action: {
                        label: "Refresh",
                        onClick: () => window.location.reload(),
                      },
                    },
                  );
                }
              });
            }
          });
        } catch (error) {
          // Silently fail
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener(
        "message",
        (event) => {
          if (event.data.type === "SYNC_COMPLETE") {
            toast.success(event.data.message);
          }
        },
      );
    }
  }, []);

  // Sync content from database on app startup (non-blocking)
  useEffect(() => {
    async function syncContent() {
      try {
        const { syncContentFromDatabaseWithLanguage } = await import("./lib/contentManager");
        const freshContent = await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
        console.log('✅ Content synced from database');
      } catch (error) {
        console.log('ℹ️ Using local content (backend unavailable)');
        // Silently fail and use local content - this is expected in development
      }
    }
    
    // Delay sync slightly to not block initial render
    const timer = setTimeout(syncContent, 100);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Update content when language changes
  useEffect(() => {
    setWebsiteContent(loadContentWithLanguage(language));
  }, [language]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    // Content will update via the useEffect hook
  };

  // Handle navigation with optional data
  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    if (data) {
      setPageData(data);
    }
  };

  // Get SEO config for current page
  const getSeoConfig = () => {
    switch (currentPage) {
      case "home":
        return { ...websiteContent.seo.home, path: "/" };
      case "attractions":
        return {
          ...websiteContent.seo.attractions,
          path: "/attractions",
        };
      case "how-it-works":
        return {
          ...websiteContent.seo.howItWorks,
          path: "/how-it-works",
        };
      case "buy-ticket":
        return {
          ...websiteContent.seo.buyTicket,
          path: "/buy-ticket",
        };
      case "about":
        return { ...websiteContent.seo.about, path: "/about" };
      case "request-pickup":
        return {
          title: "Request Pickup - Go Sintra Live Tracking",
          description:
            "Request a pickup at your current location. Track your vehicle in real-time and get estimated arrival times.",
          keywords:
            "Sintra pickup, live vehicle tracking, request Sintra transport",
          path: "/request-pickup",
        };
      case "blog":
        return {
          title:
            "Sintra Travel Guide & Blog - Expert Tips & Guides",
          description:
            "Comprehensive guides and articles about visiting Sintra. Learn how to plan your trip, get to Sintra, and make the most of your visit.",
          keywords:
            "Sintra travel guide, Sintra blog, Sintra tips, how to visit Sintra, Sintra planning",
          path: "/blog",
        };
      case "blog-article":
        return {
          title: pageData?.title
            ? `${pageData.title} - Go Sintra Blog`
            : "Article - Go Sintra Blog",
          description:
            pageData?.excerpt ||
            "Read our comprehensive guide about visiting Sintra.",
          keywords:
            pageData?.tags?.join(", ") ||
            "Sintra, travel guide",
          path: `/blog/${pageData?.slug || ""}`,
        };
      default:
        return { ...websiteContent.seo.home, path: "/" };
    }
  };

  const seoConfig = getSeoConfig();

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "attractions":
        return (
          <AttractionsPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "how-it-works":
        return (
          <HowItWorksPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "buy-ticket":
        return (
          <BuyTicketPage
            onNavigate={handleNavigate}
            onBookingComplete={(booking) => {
              setBookingData(booking);
              setCurrentPage("booking-confirmation");
            }}
            language={language}
          />
        );
      case "booking-confirmation":
        return (
          <BookingConfirmationPage
            onNavigate={handleNavigate}
            booking={bookingData}
            language={language}
          />
        );
      case "request-pickup":
        return (
          <RequestPickupPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "about":
        return <AboutPage language={language} />;
      case "blog":
        return <BlogPage onNavigate={handleNavigate} />;
      case "blog-article":
        return (
          <BlogArticlePage
            onNavigate={handleNavigate}
            slug={pageData?.slug || ""}
          />
        );
      case "admin":
        return <AdminPage onNavigate={handleNavigate} />;
      case "analytics":
        return <AnalyticsPage onNavigate={handleNavigate} />;
      case "operations":
        return <OperationsPage onNavigate={handleNavigate} />;
      case "manual-booking":
        return (
          <ManualBookingPage onNavigate={handleNavigate} />
        );
      case "qr-scanner":
        return <QRScannerPage onNavigate={handleNavigate} />;
      case "diagnostics":
        return <DiagnosticsPage onNavigate={handleNavigate} />;
      case "privacy-policy":
        return (
          <PrivacyPolicyPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "terms-of-service":
        return (
          <TermsOfServicePage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "manage-booking":
        return (
          <ManageBookingPage onNavigate={handleNavigate} />
        );
      case "pwa-icons":
        return <PWAIconUploader onNavigate={handleNavigate} />;
      case "pwa-installer":
        return <PWAIconInstaller onNavigate={handleNavigate} />;
      case "debug-icons":
        return <DebugIconsPage onNavigate={handleNavigate} />;
      case "pena-palace":
      case "quinta-regaleira":
      case "moorish-castle":
      case "monserrate-palace":
      case "sintra-palace":
        return (
          <AttractionDetailPage
            onNavigate={handleNavigate}
            attractionId={currentPage}
            language={language}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            language={language}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* SEO Meta Tags */}
      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" && (
          <SEOHead
            title={seoConfig.title}
            description={seoConfig.description}
            keywords={seoConfig.keywords}
            canonicalPath={seoConfig.path}
          />
        )}

      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" && (
          <Header
            currentPage={currentPage}
            onNavigate={handleNavigate}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        )}

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>

      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "diagnostics" && (
          <Footer
            onNavigate={handleNavigate}
            language={language}
          />
        )}
      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "diagnostics" && (
          <LiveChat onNavigate={handleNavigate} />
        )}
      {/* Show floating CTA on all pages except buy-ticket and admin */}
      {currentPage !== "buy-ticket" &&
        currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "booking-confirmation" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" && (
          <FloatingCTA onNavigate={handleNavigate} />
        )}
      {/* Admin access button - always visible except on admin page */}
      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "booking-confirmation" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" && (
          <AdminAccess onNavigate={handleNavigate} />
        )}

      {/* Cookie Consent Banner */}
      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" && (
          <CookieConsent
            language={language}
            onNavigate={handleNavigate}
          />
        )}

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Dynamic Manifest Loader */}
      <DynamicManifest />

      {/* Toast notifications */}
      <Toaster position="top-center" richColors />

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}