import { useEffect } from "react";
import { BlogArticle } from "../lib/blogManager";

interface BlogSEOProps {
  article: BlogArticle;
  categoryName: string;
}

export function BlogSEO({ article, categoryName }: BlogSEOProps) {
  useEffect(() => {
    // Update title
    document.title = article.seo.title || `${article.title} - Hop On Sintra Blog`;

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
    updateMetaTag("description", article.seo.description || article.excerpt);
    updateMetaTag("keywords", article.seo.keywords || article.tags.join(", "));
    updateMetaTag("robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    updateMetaTag("author", article.author);
    
    // Article specific tags
    updateMetaTag("article:published_time", new Date(article.publishDate).toISOString(), true);
    updateMetaTag("article:modified_time", new Date(article.lastModified).toISOString(), true);
    updateMetaTag("article:author", article.author, true);
    updateMetaTag("article:section", categoryName, true);
    
    // Add tags as article:tag
    article.tags.forEach(tag => {
      updateMetaTag(`article:tag`, tag, true);
    });
    
    // Open Graph tags for articles
    updateMetaTag("og:title", article.seo.title || article.title, true);
    updateMetaTag("og:description", article.seo.description || article.excerpt, true);
    updateMetaTag("og:type", "article", true);
    updateMetaTag("og:url", `https://gosintra.pt/blog/${article.slug}`, true);
    updateMetaTag("og:site_name", "Hop On Sintra Travel Guide", true);
    updateMetaTag("og:locale", "en_US", true);
    
    if (article.featuredImage) {
      updateMetaTag("og:image", article.featuredImage, true);
      updateMetaTag("og:image:secure_url", article.featuredImage, true);
      updateMetaTag("og:image:width", "1200", true);
      updateMetaTag("og:image:height", "630", true);
      updateMetaTag("og:image:alt", article.title, true);
    }
    
    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", article.seo.title || article.title);
    updateMetaTag("twitter:description", article.seo.description || article.excerpt);
    if (article.featuredImage) {
      updateMetaTag("twitter:image", article.featuredImage);
      updateMetaTag("twitter:image:alt", article.title);
    }
    updateMetaTag("twitter:creator", "@gosintra");
    updateMetaTag("twitter:site", "@gosintra");
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://gosintra.pt/blog/${article.slug}`;

    // Add JSON-LD structured data for Article
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement("script");
      structuredData.setAttribute("type", "application/ld+json");
      document.head.appendChild(structuredData);
    }

    // Create comprehensive Article schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": article.title,
      "description": article.excerpt,
      "image": article.featuredImage ? {
        "@type": "ImageObject",
        "url": article.featuredImage,
        "width": 1200,
        "height": 630
      } : undefined,
      "datePublished": new Date(article.publishDate).toISOString(),
      "dateModified": new Date(article.lastModified).toISOString(),
      "author": {
        "@type": "Organization",
        "name": article.author,
        "url": "https://gosintra.pt"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Hop On Sintra",
        "url": "https://gosintra.pt",
        "logo": {
          "@type": "ImageObject",
          "url": "https://gosintra.pt/icon-72x72.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://gosintra.pt/blog/${article.slug}`
      },
      "articleSection": categoryName,
      "keywords": article.tags.join(", "),
      "wordCount": article.content.split(/\s+/).length,
      "timeRequired": `PT${article.readTimeMinutes}M`,
      "inLanguage": "en-US",
      "about": {
        "@type": "Place",
        "name": "Sintra",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Sintra",
          "addressCountry": "PT"
        }
      }
    };

    // Add BreadcrumbList schema
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://gosintra.pt"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Travel Guide",
          "item": "https://gosintra.pt/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": categoryName,
          "item": `https://gosintra.pt/blog?category=${article.category}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": article.title,
          "item": `https://gosintra.pt/blog/${article.slug}`
        }
      ]
    };

    // Combine schemas using @graph
    const combinedSchema = {
      "@context": "https://schema.org",
      "@graph": [articleSchema, breadcrumbSchema]
    };

    structuredData.textContent = JSON.stringify(combinedSchema);
  }, [article, categoryName]);

  return null;
}