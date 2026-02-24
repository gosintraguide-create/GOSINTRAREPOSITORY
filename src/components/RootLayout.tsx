import { useEffect, useState, Suspense, lazy } from "react";
import { Outlet, useLocation, useNavigate, useMatches } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "./ui/sonner";
import { LoadingIndicator } from "./LoadingIndicator";
import { ArrowUp } from "lucide-react";

// Lazy load LiveChatWidget to avoid initial bundle bloat
const LiveChatWidget = lazy(() => import("./LiveChatWidget").then(m => ({ default: m.LiveChatWidget })));

// Language to locale mapping
const LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  pt: "pt_PT",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  nl: "nl_NL",
  it: "it_IT",
};

export function RootLayout() {
  const [language, setLanguage] = useState<string>("en");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();

  // Get meta data from route handle
  const currentRoute = matches[matches.length - 1];
  const meta = currentRoute?.handle?.meta || {};

  // Determine current page from location pathname
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/buy-ticket") return "buy-ticket";
    if (path === "/hop-on-service") return "hop-on-service";
    if (path.startsWith("/attractions")) return "attractions";
    if (path.startsWith("/private-tours")) return "private-tours";
    if (path.startsWith("/blog")) return "blog";
    if (path === "/about") return "about";
    if (path === "/live-chat") return "live-chat";
    if (path === "/route-map") return "route-map";
    if (path === "/admin") return "admin";
    if (path === "/driver") return "driver-portal";
    return "home";
  };

  // Load language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Scroll restoration on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Update html lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Save language to localStorage when it changes
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  // Navigation helper that works with React Router
  const handleNavigate = (page: string, data?: any) => {
    if (page === "home") {
      navigate("/");
    } else if (page === "buy-ticket") {
      navigate("/buy-ticket", { state: data });
    } else if (page === "hop-on-service") {
      navigate("/hop-on-service");
    } else if (page === "attractions") {
      navigate("/attractions");
    } else if (page === "attraction-detail") {
      // Generate slug from attraction name or use provided slug
      const slug = data?.slug || generateSlugFromName(data?.attractionName);
      navigate(`/attractions/${slug}`, { state: data });
    } else if (page === "private-tours") {
      navigate("/private-tours");
    } else if (page === "private-tour-detail") {
      // Generate slug from tour ID or use provided slug
      const slug = data?.slug || data?.tourId;
      navigate(`/private-tours/${slug}`, { state: data });
    } else if (page === "blog") {
      navigate("/blog");
    } else if (page === "blog-article") {
      const slug = data?.slug || data?.articleId;
      navigate(`/blog/${slug}`, { state: data });
    } else if (page === "live-chat") {
      navigate("/live-chat");
    } else if (page === "about") {
      navigate("/about");
    } else if (page === "route-map") {
      navigate("/route-map");
    } else if (page === "admin") {
      navigate("/admin");
    } else if (page === "driver-portal") {
      navigate("/driver");
    } else {
      // Fallback for any unknown pages
      navigate(`/${page}`);
    }
  };

  // Helper to generate slug from attraction/tour name
  const generateSlugFromName = (name?: string): string => {
    if (!name) return "unknown";
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Consistent canonical base URL
  const canonicalBase = "https://www.hoponsintra.com";

  // Manage meta tags via direct DOM manipulation (replaces react-helmet-async)
  useEffect(() => {
    const updateMeta = (attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const pageTitle = (meta as any).title || "Hop On Sintra";
    const pageDesc = (meta as any).description || "Explore Sintra with unlimited hop-on/hop-off day pass";
    const pageKeywords = (meta as any).keywords;
    const shouldIndex = (meta as any).index !== false;
    const canonicalUrl = `${canonicalBase}${location.pathname}`;

    // Title
    document.title = pageTitle;

    // Standard meta
    updateMeta("name", "description", pageDesc);
    if (pageKeywords) {
      updateMeta("name", "keywords", pageKeywords);
    }
    updateMeta("name", "robots", shouldIndex ? "index, follow" : "noindex, nofollow");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Open Graph
    updateMeta("property", "og:type", "website");
    updateMeta("property", "og:site_name", "Hop On Sintra");
    updateMeta("property", "og:title", pageTitle);
    updateMeta("property", "og:description", pageDesc);
    updateMeta("property", "og:url", canonicalUrl);
    updateMeta("property", "og:image", "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop");
    updateMeta("property", "og:image:width", "1200");
    updateMeta("property", "og:image:height", "630");
    updateMeta("property", "og:locale", LOCALE_MAP[language] || "en_US");

    // Twitter Card
    updateMeta("name", "twitter:card", "summary_large_image");
    updateMeta("name", "twitter:title", pageTitle);
    updateMeta("name", "twitter:description", pageDesc);
    updateMeta("name", "twitter:image", "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop");
  }, [meta, location.pathname, language]);

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <div className="flex min-h-screen flex-col bg-background">
        <Header
          currentPage={getCurrentPage()}
          language={language}
          onLanguageChange={handleLanguageChange}
          onNavigate={handleNavigate}
        />
        <main id="main-content" className="flex-1">
          <Suspense fallback={<div className="flex h-[50vh] w-full items-center justify-center"><LoadingIndicator type="spinner" fullScreen={false} /></div>}>
            <Outlet context={{ language, onNavigate: handleNavigate }} />
          </Suspense>
        </main>
        <Footer onNavigate={handleNavigate} language={language} />
      </div>

      {/* Scroll-to-top button - mobile optimized */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary/90 hover:scale-110 active:scale-95 md:bottom-8 md:right-6"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <Toaster />
      
      {/* Live Chat Widget - show on all pages except admin, driver, and live-chat */}
      {!location.pathname.startsWith("/admin") && 
       !location.pathname.startsWith("/driver") && 
       location.pathname !== "/live-chat" && (
        <Suspense fallback={null}>
          <LiveChatWidget language={language} />
        </Suspense>
      )}
    </>
  );
}