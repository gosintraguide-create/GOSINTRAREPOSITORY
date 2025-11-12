import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalPath?: string;
}

export function SEOHead({
  title = "Hop On Sintra - Premium Hop-On/Hop-Off Day Pass",
  description = "Explore Sintra's palaces and attractions with guaranteed seating in small vehicles. Unlimited rides, every 30 minutes. Book your day pass online.",
  keywords = "Sintra tours, Sintra transport, hop on hop off Sintra, Pena Palace, Quinta da Regaleira, Sintra day pass, Portugal tours",
  ogImage = "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop",
  canonicalPath = "",
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

    // Standard meta tags
    updateMetaTag("description", description);
    updateMetaTag("keywords", keywords);
    updateMetaTag("robots", "index, follow");
    updateMetaTag("author", "Hop On Sintra");
    updateMetaTag("viewport", "width=device-width, initial-scale=1.0");
    
    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:image:width", "1200", true);
    updateMetaTag("og:image:height", "630", true);
    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:url", `https://gosintra.pt${canonicalPath}`, true);
    updateMetaTag("og:site_name", "Hop On Sintra", true);
    updateMetaTag("og:locale", "en_US", true);
    
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
    canonical.href = `https://gosintra.pt${canonicalPath}`;

    // Add JSON-LD structured data
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.setAttribute("type", "application/ld+json");
      document.head.appendChild(structuredData);
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      "name": "Hop On Sintra",
      "description": description,
      "url": `https://gosintra.pt${canonicalPath}`,
      "image": ogImage,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Sintra",
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
        "closes": "20:00"
      },
      "priceRange": "€€",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "250"
      }
    };

    structuredData.textContent = JSON.stringify(schema);
  }, [title, description, keywords, ogImage, canonicalPath]);

  return null;
}