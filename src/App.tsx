import { useState, useEffect, lazy, Suspense } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LiveChat } from "./components/LiveChat";
import { FloatingCTA } from "./components/FloatingCTA";
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
const DriverLoginPage = lazy(() =>
  import("./components/DriverLoginPage").then((m) => ({
    default: m.DriverLoginPage,
  })),
);
const DriverDashboard = lazy(() =>
  import("./components/DriverDashboard").then((m) => ({
    default: m.DriverDashboard,
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

const PrivateToursPage = lazy(() =>
  import("./components/PrivateToursPage").then((m) => ({
    default: m.PrivateToursPage,
  })),
);

const SunsetSpecialPurchasePage = lazy(() =>
  import("./components/SunsetSpecialPurchasePage").then(
    (m) => ({
      default: m.SunsetSpecialPurchasePage,
    }),
  ),
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
  const supportedLanguages = [
    "en",
    "es",
    "fr",
    "de",
    "pt",
    "nl",
    "it",
  ];

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
  const [driverSession, setDriverSession] = useState<{
    driver: any;
    token: string;
  } | null>(() => {
    // Check for existing driver session in localStorage
    const savedSession = localStorage.getItem("driver_session");
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch {
        return null;
      }
    }
    return null;
  });

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
          { page: currentPage },
          "",
          `?page=${currentPage}`,
        );
      }
    } else {
      if (currentUrlPage) {
        window.history.pushState({ page: "home" }, "", "/");
      }
    }
  }, [currentPage]);

  // Handle browser back/forward navigation and mobile swipe gestures
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      const page = urlParams.get("page");
      
      // Update the page state to match the URL
      if (page) {
        setCurrentPage(page);
      } else {
        setCurrentPage("home");
      }
      
      // Clear page data when navigating back
      setPageData(null);
    };

    // Listen for browser back/forward events (including mobile swipe gestures)
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

          // Preload essential images for offline use
          const preloadImages = [
            "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5hJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwMnww&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1668377298351-3f7a745a56fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWludGElMjBkYSUyMHJlZ2FsZWlyYSUyMHNpbnRyYXxlbnwxfHx8fDE3NjMxNjg3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1651520011190-6f37b5213684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29yaXNoJTIwY2FzdGxlJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2ODc2OXww&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zZXJyYXRlJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1672692921041-f676e2cae79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb252ZW50byUyMGNhcHVjaG9zJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1700739745973-bbd552072e98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJvJTIwZGElMjByb2NhJTIwbGlnaHRob3VzZXxlbnwxfHx8fDE3NjMxNjY2MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
            "https://images.unsplash.com/photo-1670060434149-220a5fce89da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYSUyMHNhc3NldHRpJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
          ];

          // Send message to service worker to cache images
          if (registration.active) {
            registration.active.postMessage({
              type: 'CACHE_URLS',
              urls: preloadImages
            });
            console.log('📦 Preloading attraction images for offline use');
          }

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
        const { syncContentFromDatabaseWithLanguage } =
          await import("./lib/contentManager");
        const freshContent =
          await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
        console.log("✅ Content synced from database");
      } catch (error) {
        console.log(
          "ℹ️ Using local content (backend unavailable)",
        );
        // Silently fail and use local content - this is expected in development
      }
    }

    // Delay sync slightly to not block initial render
    const timer = setTimeout(syncContent, 100);
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Update content when language changes - sync from database
  useEffect(() => {
    async function syncContentForLanguage() {
      try {
        const { syncContentFromDatabaseWithLanguage } =
          await import("./lib/contentManager");
        const freshContent =
          await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
        console.log(
          `✅ Content synced for language: ${language}`,
        );
      } catch (error) {
        console.log(
          "ℹ️ Using local content for language change",
        );
        // Fallback to local content
        setWebsiteContent(loadContentWithLanguage(language));
      }
    }

    syncContentForLanguage();
  }, [language]);

  // Periodic content refresh every 3 minutes to catch updates
  useEffect(() => {
    async function periodicSync() {
      try {
        const { syncContentFromDatabaseWithLanguage } =
          await import("./lib/contentManager");
        const freshContent =
          await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
        console.log("🔄 Periodic content refresh completed");
      } catch (error) {
        // Silently fail - this is a background refresh
      }
    }

    // Set up periodic refresh every 3 minutes (180000ms)
    const interval = setInterval(periodicSync, 180000);

    return () => clearInterval(interval);
  }, [language]); // Re-set interval when language changes

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Listen for content updates from admin panel
  useEffect(() => {
    const handleContentUpdate = async () => {
      console.log(
        "📢 Content update event received, reloading...",
      );
      try {
        const { syncContentFromDatabaseWithLanguage } =
          await import("./lib/contentManager");
        const freshContent =
          await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
        console.log("✅ Content reloaded after admin update");
        toast.success("Content updated!");
      } catch (error) {
        console.error("Error reloading content:", error);
        // Fallback to localStorage
        setWebsiteContent(loadContentWithLanguage(language));
      }
    };

    window.addEventListener(
      "content-updated",
      handleContentUpdate,
    );
    return () =>
      window.removeEventListener(
        "content-updated",
        handleContentUpdate,
      );
  }, [language]);

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

  // Handle driver login
  const handleDriverLogin = (driver: any, token: string) => {
    const session = { driver, token };
    setDriverSession(session);
    localStorage.setItem(
      "driver_session",
      JSON.stringify(session),
    );
    setCurrentPage("operations");
  };

  // Handle driver logout
  const handleDriverLogout = () => {
    setDriverSession(null);
    localStorage.removeItem("driver_session");
    setCurrentPage("driver-login");
  };

  // Get SEO config for current page
  const getSeoConfig = () => {
    switch (currentPage) {
      case "home":
        return {
          ...websiteContent.seo.home,
          path: "/",
          type: "service" as const,
        };
      case "attractions":
        return {
          ...websiteContent.seo.attractions,
          path: "/attractions",
          type: "attraction" as const,
        };
      case "buy-ticket":
        return {
          ...websiteContent.seo.buyTicket,
          path: "/buy-ticket",
          type: "product" as const,
        };
      case "about":
        return {
          ...websiteContent.seo.about,
          path: "/about",
          type: "service" as const,
        };
      case "request-pickup":
        return {
          title: "Request Pickup - Hop On Sintra Live Tracking",
          description:
            "Request a pickup at your current location. Track your vehicle in real-time and get estimated arrival times.",
          keywords:
            "Sintra pickup, live vehicle tracking, request Sintra transport",
          path: "/request-pickup",
          type: "service" as const,
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
          type: "article" as const,
        };
      case "blog-article":
        return {
          title: pageData?.title
            ? `${pageData.title} - Hop On Sintra Blog`
            : "Article - Hop On Sintra Blog",
          description:
            pageData?.excerpt ||
            "Read our comprehensive guide about visiting Sintra.",
          keywords:
            pageData?.tags?.join(", ") ||
            "Sintra, travel guide",
          path: `/blog/${pageData?.slug || ""}`,
          type: "article" as const,
        };
      case "private-tours":
        return {
          title:
            "Private Tours of Sintra - Personalized Guided Experiences",
          description:
            "Experience Sintra your way with a private tour. Expert local guides, custom itineraries, and flexible schedules. Perfect for families, couples, and groups seeking a personalized adventure.",
          keywords:
            "Sintra private tours, private Sintra guide, custom Sintra tour, personalized Sintra experience, private guide Sintra",
          path: "/private-tours",
          type: "product" as const,
        };
      case "sunset-special-purchase":
        return {
          title:
            "Add Sunset Special - Exclusive Sunset Drive to Cabo da Roca",
          description:
            "Add an exclusive sunset drive to Cabo da Roca to your Hop On Sintra booking. Experience the breathtaking sunset at Europe's westernmost point.",
          keywords:
            "Sintra sunset tour, Cabo da Roca sunset, sunset drive Sintra, exclusive Sintra experience",
          path: "/sunset-special-purchase",
          type: "product" as const,
        };
      default:
        return {
          ...websiteContent.seo.home,
          path: "/",
          type: "service" as const,
        };
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
            websiteContent={websiteContent}
          />
        );
      case "attractions":
        return (
          <AttractionsPage
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
        return (
          <BlogPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "blog-article":
        return (
          <BlogArticlePage
            onNavigate={handleNavigate}
            slug={pageData?.slug || ""}
            language={language}
          />
        );
      case "private-tours":
        return (
          <PrivateToursPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "sunset-special-purchase":
        return (
          <SunsetSpecialPurchasePage
            onNavigate={handleNavigate}
            language={language}
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
          <ManageBookingPage
            onNavigate={handleNavigate}
            language={language}
          />
        );
      case "driver-login":
        return (
          <DriverLoginPage onLoginSuccess={handleDriverLogin} />
        );
      case "driver-dashboard":
        if (!driverSession) {
          // If no session, redirect to login
          setCurrentPage("driver-login");
          return (
            <DriverLoginPage
              onLoginSuccess={handleDriverLogin}
            />
          );
        }
        return (
          <DriverDashboard
            driver={driverSession.driver}
            token={driverSession.token}
            onLogout={handleDriverLogout}
            onNavigate={handleNavigate}
          />
        );
      case "pena-palace":
      case "quinta-regaleira":
      case "moorish-castle":
      case "monserrate-palace":
      case "sintra-palace":
      case "convento-capuchos":
      case "cabo-da-roca":
      case "villa-sassetti":
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
            websiteContent={websiteContent}
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
        currentPage !== "diagnostics" &&
        currentPage !== "driver-login" &&
        currentPage !== "driver-dashboard" && (
          <SEOHead
            title={seoConfig.title}
            description={seoConfig.description}
            keywords={seoConfig.keywords}
            canonicalPath={seoConfig.path}
            language={language}
            structuredDataType={seoConfig.type}
          />
        )}

      {currentPage !== "admin" &&
        currentPage !== "analytics" &&
        currentPage !== "operations" &&
        currentPage !== "manual-booking" &&
        currentPage !== "qr-scanner" &&
        currentPage !== "diagnostics" &&
        currentPage !== "driver-login" &&
        currentPage !== "driver-dashboard" && (
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