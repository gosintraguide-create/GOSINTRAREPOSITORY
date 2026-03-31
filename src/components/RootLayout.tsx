import { useEffect, useState, Suspense, lazy, useRef } from "react";
import { Outlet, useLocation, useNavigate, useMatches } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "./ui/sonner";
import { LoadingIndicator } from "./LoadingIndicator";
import { ArrowUp } from "lucide-react";
import { useEditableContent } from "../lib/useEditableContent";
import { ScrollToTop } from "./ScrollToTop";

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
  const [isLanguageInitialized, setIsLanguageInitialized] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();

  // Get content for OG images - useEditableContent returns ComprehensiveContent directly
  const editableContent = useEditableContent(language);

  // Get enabled languages from admin settings and stabilize the array reference
  const enabledLanguages = editableContent?.adminSettings?.enabledLanguages || ['en', 'pt', 'es', 'fr', 'de', 'nl', 'it'];
  const enabledLanguagesKey = JSON.stringify(enabledLanguages);
  const prevEnabledLanguagesKeyRef = useRef<string>('');

  // Helper function to get browser's preferred language
  const getBrowserLanguage = (): string => {
    // Get browser language (e.g., "en-US", "pt-BR", "es")
    const browserLang = navigator.language || (navigator as any).userLanguage;
    // Extract the language code (e.g., "en" from "en-US")
    const langCode = browserLang.split('-')[0].toLowerCase();
    return langCode;
  };

  // Helper function to get the best available language based on preference and enabled languages
  const getBestAvailableLanguage = (preferredLang: string | null, availableLanguages: string[]): string => {
    // If preferred language is enabled, use it
    if (preferredLang && availableLanguages.includes(preferredLang)) {
      return preferredLang;
    }
    
    // Try browser language
    const browserLang = getBrowserLanguage();
    if (availableLanguages.includes(browserLang)) {
      return browserLang;
    }
    
    // Otherwise, fall back to first enabled language (preferably English)
    if (availableLanguages.includes('en')) {
      return 'en';
    }
    
    // If English is disabled, use the first enabled language
    return availableLanguages[0] || 'en';
  };

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

  // Load language from localStorage or detect from browser, respecting enabled languages
  useEffect(() => {
    // Only validate if enabled languages actually changed or on first initialization
    if (prevEnabledLanguagesKeyRef.current !== enabledLanguagesKey) {
      const savedLanguage = localStorage.getItem("language");
      const bestLanguage = getBestAvailableLanguage(savedLanguage, enabledLanguages);
      
      // Only update if different from current
      if (bestLanguage !== language) {
        setLanguage(bestLanguage);
        localStorage.setItem("language", bestLanguage);
      }
      
      prevEnabledLanguagesKeyRef.current = enabledLanguagesKey;
      setIsLanguageInitialized(true);
    }
  }, [enabledLanguagesKey]); // Re-run when enabled languages key changes

  // Scroll restoration on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname, location.search]);

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
    } else if (page === "sunset-special-purchase") {
      navigate("/sunset-special", { state: data });
    } else if (page === "hop-on-service") {
      navigate("/hop-on-service");
    } else if (page === "attractions") {
      navigate("/attractions");
    } else if (page === "attraction-detail") {
      const slug = data?.slug || generateSlugFromName(data?.attractionName);
      navigate(`/attractions/${slug}`, { state: data });
    } else if (page === "private-tours") {
      navigate("/private-tours");
    } else if (page === "private-tour-detail") {
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
    } else if (page === "qr-scanner") {
      navigate("/qr-scanner");
    } else {
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

  // Manage meta tags via direct DOM manipulation
  useEffect(() => {
    const updateMeta = (attr: string, attrValue: string, metaContent: string) => {
      let el = document.querySelector(`meta[${attr}=\"${attrValue}\"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", metaContent);
    };

    // Helper function to extract slug from URL and find corresponding content
    const getDynamicMetaForDetailPage = () => {
      const path = location.pathname;
      
      // Attraction detail pages
      if (path.startsWith('/attractions/') && path !== '/attractions/') {
        const slug = path.split('/')[2];
        const attractions = editableContent?.attractions?.list || [];
        const attraction = attractions.find((a: any) => {
          const attractionSlug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return attractionSlug === slug || a.id === slug;
        });
        
        if (attraction) {
          return {
            title: `${attraction.name} - Visit with Hop On Sintra Day Pass`,
            description: attraction.shortDescription || attraction.longDescription?.substring(0, 160) || `Discover ${attraction.name} in Sintra. Book your hop-on/hop-off day pass for convenient access.`,
            keywords: `${attraction.name}, Sintra ${attraction.name}, visit ${attraction.name}, ${attraction.name} tickets, Sintra attractions, Hop On Sintra`,
            ogImage: attraction.imageUrl || editableContent?.seo?.defaultOgImage,
          };
        }
      }
      
      // Private tour detail pages
      if (path.startsWith('/private-tours/') && path !== '/private-tours/') {
        const slug = path.split('/')[2];
        const tours = editableContent?.privateTours?.tours || [];
        const tour = tours.find((t: any) => {
          const tourSlug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return tourSlug === slug || t.id === slug;
        });
        
        if (tour) {
          return {
            title: `${tour.name} - Private Tour in Sintra`,
            description: tour.description?.substring(0, 160) || `Experience ${tour.name} with a private guide. Personalized tour of Sintra's top attractions.`,
            keywords: `${tour.name}, Sintra private tour, ${tour.name} guide, Sintra guided tour, private Sintra experience`,
            ogImage: tour.imageUrl || editableContent?.seo?.defaultOgImage,
          };
        }
      }
      
      // Blog article pages
      if (path.startsWith('/blog/') && path !== '/blog/') {
        const slug = path.split('/')[2];
        const articles = editableContent?.blog?.articles || [];
        const article = articles.find((a: any) => {
          const articleSlug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return articleSlug === slug || a.id === slug;
        });
        
        if (article) {
          return {
            title: `${article.title} - Hop On Sintra Travel Guide`,
            description: article.excerpt?.substring(0, 160) || article.content?.substring(0, 160) || `Read our guide about ${article.title}.`,
            keywords: `${article.title}, Sintra guide, Sintra blog, Sintra travel tips, visit Sintra`,
            ogImage: article.imageUrl || editableContent?.seo?.defaultOgImage,
          };
        }
      }
      
      return null;
    };

    // Get dynamic meta for detail pages or fall back to route meta
    const dynamicMeta = getDynamicMetaForDetailPage();
    const pageTitle = dynamicMeta?.title || (meta as any).title || "Hop On Sintra";
    const pageDesc = dynamicMeta?.description || (meta as any).description || "Explore Sintra with unlimited hop-on/hop-off day pass";
    const pageKeywords = dynamicMeta?.keywords || (meta as any).keywords;
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
    const defaultOgImage = "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop&q=80";
    const ogImage = dynamicMeta?.ogImage || editableContent?.seo?.defaultOgImage || defaultOgImage;

    updateMeta("property", "og:type", "website");
    updateMeta("property", "og:site_name", "Hop On Sintra");
    updateMeta("property", "og:title", pageTitle);
    updateMeta("property", "og:description", pageDesc);
    updateMeta("property", "og:url", canonicalUrl);
    updateMeta("property", "og:image", ogImage);
    updateMeta("property", "og:image:secure_url", ogImage);
    updateMeta("property", "og:image:alt", pageTitle);
    updateMeta("property", "og:image:width", "1200");
    updateMeta("property", "og:image:height", "630");
    updateMeta("property", "og:locale", LOCALE_MAP[language] || "en_US");

    // Twitter Card
    updateMeta("name", "twitter:card", "summary_large_image");
    updateMeta("name", "twitter:title", pageTitle);
    updateMeta("name", "twitter:description", pageDesc);
    updateMeta("name", "twitter:image", ogImage);
    updateMeta("name", "twitter:image:alt", pageTitle);

    // Add structured data (JSON-LD) for detail pages
    const addStructuredData = () => {
      const path = location.pathname;
      let structuredData: any = null;

      // Attraction detail pages - TouristAttraction schema
      if (path.startsWith('/attractions/') && path !== '/attractions/') {
        const slug = path.split('/')[2];
        const attractions = editableContent?.attractions?.list || [];
        const attraction = attractions.find((a: any) => {
          const attractionSlug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return attractionSlug === slug || a.id === slug;
        });

        if (attraction) {
          structuredData = {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            "name": attraction.name,
            "description": attraction.shortDescription || attraction.longDescription,
            "image": attraction.imageUrl,
            "url": `${canonicalBase}${path}`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Sintra",
              "addressRegion": "Lisbon",
              "addressCountry": "PT"
            }
          };
        }
      }

      // Private tour detail pages - TouristTrip schema
      if (path.startsWith('/private-tours/') && path !== '/private-tours/') {
        const slug = path.split('/')[2];
        const tours = editableContent?.privateTours?.tours || [];
        const tour = tours.find((t: any) => {
          const tourSlug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return tourSlug === slug || t.id === slug;
        });

        if (tour) {
          structuredData = {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            "name": tour.name,
            "description": tour.description,
            "image": tour.imageUrl,
            "url": `${canonicalBase}${path}`,
            "provider": {
              "@type": "Organization",
              "name": "Hop On Sintra",
              "url": "https://www.hoponsintra.com"
            }
          };
        }
      }

      // Blog article pages - Article schema
      if (path.startsWith('/blog/') && path !== '/blog/') {
        const slug = path.split('/')[2];
        const articles = editableContent?.blog?.articles || [];
        const article = articles.find((a: any) => {
          const articleSlug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          return articleSlug === slug || a.id === slug;
        });

        if (article) {
          structuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.excerpt,
            "image": article.imageUrl,
            "url": `${canonicalBase}${path}`,
            "datePublished": article.date || new Date().toISOString(),
            "author": {
              "@type": "Organization",
              "name": "Hop On Sintra"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Hop On Sintra",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.hoponsintra.com/logo.png"
              }
            }
          };
        }
      }

      // Update or create JSON-LD script tag
      let jsonLdScript = document.querySelector('script[type="application/ld+json"]#dynamic-structured-data');
      if (structuredData) {
        if (!jsonLdScript) {
          jsonLdScript = document.createElement('script');
          jsonLdScript.setAttribute('type', 'application/ld+json');
          jsonLdScript.setAttribute('id', 'dynamic-structured-data');
          document.head.appendChild(jsonLdScript);
        }
        jsonLdScript.textContent = JSON.stringify(structuredData);
      } else if (jsonLdScript) {
        // Remove structured data if not on a detail page
        jsonLdScript.remove();
      }
    };

    addStructuredData();
  }, [meta, location.pathname, language, editableContent]);

  return (
    <>
      {/* Scroll to top on route change */}
      <ScrollToTop />

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