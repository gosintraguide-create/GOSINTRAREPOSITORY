import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useMatches } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Toaster } from "./ui/sonner";
import { Helmet } from "react-helmet-async";

export function RootLayout() {
  const [language, setLanguage] = useState<string>("en");
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

  return (
    <>
      <Helmet>
        <title>{meta.title || "Hop On Sintra"}</title>
        <meta
          name="description"
          content={
            meta.description ||
            "Explore Sintra with unlimited hop-on/hop-off day pass"
          }
        />
        {meta.keywords && <meta name="keywords" content={meta.keywords} />}
        {meta.index === false && <meta name="robots" content="noindex, nofollow" />}
        <link rel="canonical" href={`https://hoponsintra.com${location.pathname}`} />
        
        {/* Open Graph tags for social media sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Hop On Sintra" />
        <meta property="og:title" content={meta.title || "Hop On Sintra"} />
        <meta 
          property="og:description" 
          content={
            meta.description ||
            "Explore Sintra with unlimited hop-on/hop-off day pass"
          } 
        />
        <meta property="og:url" content={`https://hoponsintra.com${location.pathname}`} />
        <meta property="og:image" content="https://hoponsintra.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={language === 'en' ? 'en_US' : `${language}_${language.toUpperCase()}`} />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title || "Hop On Sintra"} />
        <meta 
          name="twitter:description" 
          content={
            meta.description ||
            "Explore Sintra with unlimited hop-on/hop-off day pass"
          } 
        />
        <meta name="twitter:image" content="https://hoponsintra.com/og-image.jpg" />
      </Helmet>

      <div className="flex min-h-screen flex-col bg-background">
        <Header
          currentPage={getCurrentPage()}
          language={language}
          onLanguageChange={handleLanguageChange}
          onNavigate={handleNavigate}
        />
        <main className="flex-1">
          <Outlet context={{ language, onNavigate: handleNavigate }} />
        </main>
        <Footer onNavigate={handleNavigate} language={language} />
      </div>
      <Toaster />
    </>
  );
}