import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
  language?: string;
  structuredDataType?: "service" | "product" | "article" | "attraction";
  price?: string;
  noindex?: boolean;
}

export function SEOHead({
  title = "Hop On Sintra - Premium Hop-On/Hop-Off Day Pass | Small Vehicle Tours",
  description = "Explore Sintra's UNESCO World Heritage palaces and attractions with guaranteed seating in small vehicles. Premium hop-on/hop-off day pass with unlimited rides. Book your Sintra adventure online.",
  keywords = "Sintra tours, Sintra transport, hop on hop off Sintra, Pena Palace, Quinta da Regaleira, Sintra day pass, Portugal tours, small vehicle tours, tuk tuk Sintra",
  ogImage = "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop",
  canonicalPath = "",
  language = "en",
  structuredDataType = "service",
  price = "25",
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Language to locale mapping
    const localeMap: Record<string, string> = {
      en: "en_US",
      pt: "pt_PT",
      es: "es_ES",
      fr: "fr_FR",
      de: "de_DE",
      nl: "nl_NL",
      it: "it_IT",
    };

    // Standard meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("robots", noindex ? "noindex, nofollow" : "index, follow");
    updateMetaTag("author", "Hop On Sintra");
    updateMetaTag("viewport", "width=device-width, initial-scale=1.0");
    updateMetaTag("theme-color", "#ffffff");
    
    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:image:width", "1200", true);
    updateMetaTag("og:image:height", "630", true);
    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:url", `https://www.hoponsintra.com${canonicalPath}`, true);
    updateMetaTag("og:site_name", "Hop On Sintra", true);
    updateMetaTag("og:locale", localeMap[language] || "en_US", true);
    
    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", ogImage);
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://www.hoponsintra.com${canonicalPath}`;

    // Remove old hreflang tags
    document.querySelectorAll('link[rel="alternate"]').forEach(link => link.remove());

    // Add hreflang tags for all supported languages
    const languages = ["en", "pt", "es", "fr", "de", "nl", "it"];
    languages.forEach(lang => {
      const hreflang = document.createElement("link");
      hreflang.rel = "alternate";
      hreflang.hreflang = lang;
      hreflang.href = `https://www.hoponsintra.com${canonicalPath}?lang=${lang}`;
      document.head.appendChild(hreflang);
    });

    // Add x-default hreflang
    const defaultLang = document.createElement("link");
    defaultLang.rel = "alternate";
    defaultLang.hreflang = "x-default";
    defaultLang.href = `https://www.hoponsintra.com${canonicalPath}`;
    document.head.appendChild(defaultLang);

    // Add JSON-LD structured data
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.setAttribute("type", "application/ld+json");
      document.head.appendChild(structuredData);
    }

    // Build schema based on page type
    let schema: any = {
      "@context": "https://schema.org",
    };

    if (structuredDataType === "service" || structuredDataType === "attraction") {
      schema = {
        ...schema,
        "@type": ["TouristAttraction", "Service"],
        "name": "Hop On Sintra",
        "description": description,
        "url": `https://www.hoponsintra.com${canonicalPath}`,
        "image": ogImage,
        "provider": {
          "@type": "TouristInformationCenter",
          "name": "Hop On Sintra",
          "url": "https://www.hoponsintra.com"
        },
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Sintra",
          "addressRegion": "Lisbon",
          "addressCountry": "PT"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "38.7969",
          "longitude": "-9.3887"
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ],
          "opens": "09:00",
          "closes": "19:00"
        },
        "priceRange": "€€",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "250",
          "bestRating": "5"
        }
      };
    } else if (structuredDataType === "product") {
      schema = {
        ...schema,
        "@type": "Product",
        "name": title,
        "description": description,
        "image": ogImage,
        "brand": {
          "@type": "Brand",
          "name": "Hop On Sintra"
        },
        "offers": {
          "@type": "Offer",
          "url": `https://www.hoponsintra.com${canonicalPath}`,
          "priceCurrency": "EUR",
          "price": price,
          "availability": "https://schema.org/InStock",
          "validFrom": new Date().toISOString().split('T')[0]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "250"
        }
      };
    } else if (structuredDataType === "article") {
      schema = {
        ...schema,
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": ogImage,
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
        },
        "datePublished": new Date().toISOString(),
        "dateModified": new Date().toISOString()
      };
    }

    structuredData.textContent = JSON.stringify(schema);
  }, [title, description, keywords, ogImage, canonicalPath, language, structuredDataType, price, noindex]);

  return null;
}