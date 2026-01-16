// Child pricing feature: ages 7-12 - Build 2024-12-19-002
// Force rebuild - Private Tour Detail Page - Build 2025-01-09
import { useState, useEffect, lazy, Suspense } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LiveChat } from "./components/LiveChat";
import { FloatingCTA } from "./components/FloatingCTA";
import { SEOHead } from "./components/SEOHead";
import { CookieConsent } from "./components/CookieConsent";
import { InstallPrompt } from "./components/InstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { BackendStatusIndicator } from "./components/BackendStatusIndicator";
import { DynamicManifest } from "./components/DynamicManifest";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { MicrosoftClarity } from "./components/MicrosoftClarity";
import { loadContentWithLanguage } from "./lib/contentManager";
import { trackPageView } from "./lib/analytics";
import { createSessionFromBooking } from "./lib/sessionManager";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { Analytics } from "@vercel/analytics/react";
import { LoadingIndicator } from "./components/LoadingIndicator";

// Analytics Configuration
// Get your free Google Analytics ID: https://analytics.google.com/
// Get your free Microsoft Clarity ID: https://clarity.microsoft.com/
const GA_MEASUREMENT_ID = "G-VM2HFTLH4R"; // Hop On Sintra GA4 Measurement ID
const CLARITY_PROJECT_ID = ""; // Replace with your Clarity project ID (optional)

// Build timestamp: Force rebuild - Language selector fix

// Helper function to add error handling to lazy imports
const lazyWithErrorHandling = (
  importFn: () => Promise<any>,
  componentName: string,
) => {
  return lazy(() =>
    importFn()
      .then((module) => module)
      .catch((error) => {
        console.error(
          `🚨 Failed to load ${componentName}:`,
          error,
        );
        // Check if it's a module loading error
        if (
          error.message?.includes("Unexpected token") ||
          error.message?.includes("expected expression")
        ) {
          console.error(
            `❌ This is a module loading error - likely a 404 or HTML being parsed as JavaScript`,
          );
        }
        // Re-throw to let ErrorBoundary catch it
        throw new Error(
          `Failed to load ${componentName}: ${error.message}`,
        );
      }),
  );
};

// Lazy load page components for better performance
const HomePage = lazyWithErrorHandling(
  () =>
    import("./components/HomePage").then((m) => ({
      default: m.HomePage,
    })),
  "HomePage",
);
const AttractionsPage = lazyWithErrorHandling(
  () =>
    import("./components/AttractionsPage").then((m) => ({
      default: m.AttractionsPage,
    })),
  "AttractionsPage",
);
const BuyTicketPage = lazyWithErrorHandling(
  () =>
    import("./components/BuyTicketPage").then((m) => ({
      default: m.BuyTicketPage,
    })),
  "BuyTicketPage",
);
const AboutPage = lazyWithErrorHandling(
  () =>
    import("./components/AboutPage").then((m) => ({
      default: m.AboutPage,
    })),
  "AboutPage",
);
const AttractionDetailPage = lazyWithErrorHandling(
  () =>
    import("./components/AttractionDetailPage").then((m) => ({
      default: m.AttractionDetailPage,
    })),
  "AttractionDetailPage",
);
const RequestPickupPage = lazyWithErrorHandling(
  () =>
    import("./components/RequestPickupPage").then((m) => ({
      default: m.RequestPickupPage,
    })),
  "RequestPickupPage",
);
const AdminPage = lazyWithErrorHandling(
  () =>
    import("./components/AdminPage").then((m) => ({
      default: m.AdminPage,
    })),
  "AdminPage",
);
const BookingConfirmationPage = lazyWithErrorHandling(
  () =>
    import("./components/BookingConfirmationPage").then(
      (m) => ({ default: m.BookingConfirmationPage }),
    ),
  "BookingConfirmationPage",
);
const QRScannerPage = lazyWithErrorHandling(
  () =>
    import("./components/QRScannerPage").then((m) => ({
      default: m.QRScannerPage,
    })),
  "QRScannerPage",
);
const DiagnosticsPage = lazyWithErrorHandling(
  () =>
    import("./components/DiagnosticsPage").then((m) => ({
      default: m.DiagnosticsPage,
    })),
  "DiagnosticsPage",
);
const PrivacyPolicyPage = lazyWithErrorHandling(
  () =>
    import("./components/PrivacyPolicyPage").then((m) => ({
      default: m.PrivacyPolicyPage,
    })),
  "PrivacyPolicyPage",
);
const TermsOfServicePage = lazyWithErrorHandling(
  () =>
    import("./components/TermsOfServicePage").then((m) => ({
      default: m.TermsOfServicePage,
    })),
  "TermsOfServicePage",
);
const ManageBookingPage = lazyWithErrorHandling(
  () =>
    import("./components/ManageBookingPage").then((m) => ({
      default: m.ManageBookingPage,
    })),
  "ManageBookingPage",
);
const AnalyticsPage = lazyWithErrorHandling(
  () =>
    import("./components/AnalyticsPage").then((m) => ({
      default: m.AnalyticsPage,
    })),
  "AnalyticsPage",
);
const OperationsPage = lazyWithErrorHandling(
  () =>
    import("./components/OperationsPage").then((m) => ({
      default: m.OperationsPage,
    })),
  "OperationsPage",
);
const ManualBookingPage = lazyWithErrorHandling(
  () =>
    import("./components/ManualBookingPage").then((m) => ({
      default: m.ManualBookingPage,
    })),
  "ManualBookingPage",
);
const DriverLoginPage = lazyWithErrorHandling(
  () =>
    import("./components/DriverLoginPage").then((m) => ({
      default: m.DriverLoginPage,
    })),
  "DriverLoginPage",
);
const DriverDashboard = lazyWithErrorHandling(
  () =>
    import("./components/DriverDashboard").then((m) => ({
      default: m.DriverDashboard,
    })),
  "DriverDashboard",
);

const BlogPage = lazyWithErrorHandling(
  () =>
    import("./components/BlogPage").then((m) => ({
      default: m.BlogPage,
    })),
  "BlogPage",
);
const BlogArticlePage = lazyWithErrorHandling(
  () =>
    import("./components/BlogArticlePage").then((m) => ({
      default: m.BlogArticlePage,
    })),
  "BlogArticlePage",
);

const PrivateToursPage = lazyWithErrorHandling(
  () =>
    import("./components/PrivateToursPage").then((m) => ({
      default: m.PrivateToursPage,
    })),
  "PrivateToursPage",
);
// Private tours enabled - force rebuild

const PrivateTourDetailPage = lazyWithErrorHandling(
  () =>
    import("./components/PrivateTourDetailPage").then((m) => ({
      default: m.PrivateTourDetailPage,
    })),
  "PrivateTourDetailPage",
);
// Force rebuild - Private tour detail page added

const RouteMapPage = lazyWithErrorHandling(
  () =>
    import("./components/RouteMapPage").then((m) => ({
      default: m.RouteMapPage,
    })),
  "RouteMapPage",
);

const SunsetSpecialPurchasePage = lazyWithErrorHandling(
  () =>
    import("./components/SunsetSpecialPurchasePage").then(
      (m) => ({
        default: m.SunsetSpecialPurchasePage,
      }),
    ),
  "SunsetSpecialPurchasePage",
);

// Loading fallback component for lazy-loaded pages
function PageLoader() {
  return <LoadingIndicator type="spinner" fullScreen />;
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
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

  // Hide initial loading screen after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Handle URL-based page navigation
  useEffect(() => {
    // Debug logging
    console.log("[App] Initial URL load:", {
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    });

    // Check if we were redirected from 404.html
    const redirectPath = sessionStorage.getItem("redirect");
    if (redirectPath && redirectPath !== "/") {
      console.log(
        "[App] Redirect from 404.html detected:",
        redirectPath,
      );
      sessionStorage.removeItem("redirect");
      // Update the URL without reload
      window.history.replaceState({}, "", redirectPath);
    }

    // Function to extract page from URL
    const getPageFromURL = () => {
      // First, check for clean URLs (pathname-based)
      const pathname = window.location.pathname;

      // Remove leading/trailing slashes
      const cleanPath = pathname.replace(/^\/+|\/+$/g, "");

      // If we have a clean path, use it
      if (cleanPath) {
        // Handle blog article URLs (e.g., /blog/article-slug)
        if (cleanPath.startsWith("blog/")) {
          const slug = cleanPath.replace("blog/", "");
          return { page: "blog-article", slug };
        }

        // Handle sunset-special URL
        if (cleanPath === "sunset-special") {
          return { page: "sunset-special-purchase" };
        }

        // For all other clean URLs, return the path as the page name
        return { page: cleanPath };
      }

      // Fallback: check for query parameters (backward compatibility)
      const urlParams = new URLSearchParams(
        window.location.search,
      );
      const page = urlParams.get("page");
      const slug = urlParams.get("slug");

      if (page) {
        return { page, slug };
      }

      return { page: null, slug: null };
    };

    const { page, slug } = getPageFromURL();

    console.log("[App] Parsed URL:", {
      page,
      slug,
      cleanPath: window.location.pathname,
    });

    if (page) {
      console.log("[App] Setting page to:", page);
      setCurrentPage(page);
      if (slug) {
        setPageData({ slug });
      }
    }
  }, []);

  // Update URL when page changes
  useEffect(() => {
    if (currentPage !== "home") {
      // Use clean URLs
      let path = `/${currentPage}`;

      // Handle blog articles with slugs
      if (currentPage === "blog-article" && pageData?.slug) {
        path = `/blog/${pageData.slug}`;
      }

      // Handle sunset special
      if (currentPage === "sunset-special-purchase") {
        path = "/sunset-special";
      }

      // Only update if the path has changed
      if (window.location.pathname !== path) {
        window.history.pushState(
          { page: currentPage },
          "",
          path,
        );
      }
    } else {
      // Home page
      if (window.location.pathname !== "/") {
        window.history.pushState({ page: "home" }, "", "/");
      }
    }
  }, [currentPage, pageData]);

  // Handle browser back/forward navigation and mobile swipe gestures
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Function to extract page from URL
      const getPageFromURL = () => {
        // First, check for clean URLs (pathname-based)
        const pathname = window.location.pathname;

        // Remove leading/trailing slashes
        const cleanPath = pathname.replace(/^\/+|\/+$/g, "");

        // If we have a clean path, use it
        if (cleanPath) {
          // Handle blog article URLs (e.g., /blog/article-slug)
          if (cleanPath.startsWith("blog/")) {
            const slug = cleanPath.replace("blog/", "");
            return { page: "blog-article", slug };
          }

          // Handle sunset-special URL
          if (cleanPath === "sunset-special") {
            return { page: "sunset-special-purchase" };
          }

          // For all other clean URLs, return the path as the page name
          return { page: cleanPath };
        }

        // Fallback: check for query parameters (backward compatibility)
        const urlParams = new URLSearchParams(
          window.location.search,
        );
        const page = urlParams.get("page");
        const slug = urlParams.get("slug");

        if (page) {
          return { page, slug };
        }

        return { page: null, slug: null };
      };

      const { page, slug } = getPageFromURL();

      // Update the page state to match the URL
      if (page) {
        setCurrentPage(page);
        if (slug) {
          setPageData({ slug });
        } else {
          setPageData(null);
        }
      } else {
        setCurrentPage("home");
        setPageData(null);
      }
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
    // TEMPORARILY DISABLED - Service worker causing module loading errors
    // Will re-enable after fixing the root cause
    console.log(
      "[App] Service worker registration disabled to fix module errors",
    );

    /* 
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
              type: "CACHE_URLS",
              urls: preloadImages,
            });
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
    */
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
      } catch (error) {
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
      } catch (error) {
        // Fallback to local content
        setWebsiteContent(loadContentWithLanguage(language));
      }
    }

    syncContentForLanguage();
  }, [language]);

  // Content updates are handled by the 'content-updated' event from admin panel
  // No polling needed - realtime updates via localStorage events

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Listen for content updates from admin panel
  useEffect(() => {
    const handleContentUpdate = async () => {
      try {
        const { syncContentFromDatabaseWithLanguage } =
          await import("./lib/contentManager");
        const freshContent =
          await syncContentFromDatabaseWithLanguage(language);
        setWebsiteContent(freshContent);
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
      case "private-tour-detail":
        return {
          title:
            "Private Tour Detail - Personalized Guided Experiences",
          description:
            "Experience Sintra your way with a private tour. Expert local guides, custom itineraries, and flexible schedules. Perfect for families, couples, and groups seeking a personalized adventure.",
          keywords:
            "Sintra private tours, private Sintra guide, custom Sintra tour, personalized Sintra experience, private guide Sintra",
          path: `/private-tour-detail/${pageData?.tourId || ""}`,
          type: "product" as const,
        };
      case "route-map":
        return {
          title: "Route Map & Stops - Hop On Sintra Locations",
          description:
            "View all Hop On Sintra stops and pickup locations on an interactive Google Map. Plan your journey and see exactly where we service throughout Sintra.",
          keywords:
            "Sintra route map, Sintra stops, hop on hop off map, Sintra locations, Sintra pickup points",
          path: "/route-map",
          type: "service" as const,
        };
      case "sunset-special-purchase":
        return {
          title:
            "Add Sunset Special - Exclusive Sunset Drive to Cabo da Roca",
          description:
            "Add an exclusive sunset drive to Cabo da Roca to your Hop On Sintra booking. Experience the breathtaking sunset at Europe's westernmost point.",
          keywords:
            "Sintra sunset tour, Cabo da Roca sunset, sunset drive Sintra, exclusive Sintra experience",
          path: "/sunset-special",
          type: "product" as const,
          noindex: true, // This is a transactional page that should not be indexed
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
              console.log(
                "🎫 Booking complete, auto-logging in user...",
              );
              setBookingData(booking);
              // Automatically log in the user with their new booking
              try {
                createSessionFromBooking(booking);
                console.log(
                  "✅ Session created, showing toast...",
                );
                toast.success("🎉 You're now logged in!", {
                  duration: 4000,
                });
              } catch (error) {
                console.error(
                  "❌ Error creating session:",
                  error,
                );
                toast.error("Login failed. Please try again.");
              }
              // Small delay to ensure toast renders before navigation
              setTimeout(() => {
                setCurrentPage("booking-confirmation");
              }, 100);
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
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <div className="text-primary">Loading...</div>
              </div>
            }
          >
            <RequestPickupPage
              onNavigate={handleNavigate}
              language={language}
            />
          </Suspense>
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
      case "private-tour-detail":
        return (
          <PrivateTourDetailPage
            onNavigate={handleNavigate}
            tourId={pageData?.tourId || ""}
            language={language}
          />
        );
      case "route-map":
        return (
          <RouteMapPage
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
          <ManualBookingPage
            onNavigate={handleNavigate}
            language={language}
          />
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
      case "biester-chalet":
      case "queluz-palace":
      case "mafra-convent":
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
    <>
      {/* Initial Loading Screen */}
      {isInitialLoad && (
        <LoadingIndicator type="both" fullScreen />
      )}

      <div className="flex min-h-screen flex-col w-full overflow-x-hidden">
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
              noindex={seoConfig.noindex}
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
            <LiveChat
              onNavigate={handleNavigate}
              language={language}
            />
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

        {/* Backend Status Indicator */}
        <BackendStatusIndicator />

        {/* Dynamic Manifest Loader */}
        <DynamicManifest />

        {/* Dynamic Favicon Loader */}
        <DynamicFavicon />

        {/* Toast notifications */}
        <Toaster
          position="top-center"
          richColors
          expand={true}
          closeButton
          toastOptions={{
            style: {
              zIndex: 9999,
            },
          }}
        />

        {/* Vercel Analytics */}
        <Analytics />

        {/* Google Analytics */}
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />

        {/* Microsoft Clarity */}
        <MicrosoftClarity projectId={CLARITY_PROJECT_ID} />
      </div>
    </>
  );
}