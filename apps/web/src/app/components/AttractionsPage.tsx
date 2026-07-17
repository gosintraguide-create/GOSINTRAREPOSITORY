import { useState, useEffect, useRef, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Search,
  MapPin,
  Clock,
  ArrowRight,
  Landmark,
  Ticket,
  Car,
  Compass,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import {
  loadArticles,
  type BlogArticle,
} from "../lib/blogManager";
import { getUITranslation, getTranslation } from "../lib/translations/loader";
import { useEditableContent } from "../lib/useEditableContent";
import { generateSlug } from "../routes";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}


export function AttractionsPage() {
  const { language = "en", onNavigate } =
    useOutletContext<OutletContext>();
  const navigate = useNavigate();

  // Use the hook that auto-updates when content changes
  const content = useEditableContent(language);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    BlogArticle[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const t = getUITranslation(language);

  // Inline SEO via direct DOM manipulation (matching pattern used across all other pages)
  useEffect(() => {
    const seoTitle = content.seo?.attractions?.title || "Sintra Attractions - Top Palaces & Historic Sites";
    const seoDescription = content.seo?.attractions?.description || "Discover Sintra's UNESCO World Heritage attractions including Pena Palace, Quinta da Regaleira, Moorish Castle, and more. Buy combined tickets with your day pass.";
    const seoKeywords = content.seo?.attractions?.keywords || "Sintra attractions, Pena Palace, Quinta da Regaleira, Moorish Castle, Monserrate Palace, Sintra palaces, UNESCO Sintra";
    const canonicalPath = "/attractions";
    const ogImage = "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop";

    document.title = seoTitle;

    const updateMetaTag = (name: string, value: string, property = false) => {
      const attribute = property ? "property" : "name";
      let el = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attribute, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    updateMetaTag("description", seoDescription);
    updateMetaTag("keywords", seoKeywords);
    updateMetaTag("robots", "index, follow");
    updateMetaTag("author", "Hop On Sintra");
    updateMetaTag("og:title", seoTitle, true);
    updateMetaTag("og:description", seoDescription, true);
    updateMetaTag("og:image", ogImage, true);
    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:url", `https://www.hoponsintra.com${canonicalPath}`, true);
    updateMetaTag("og:site_name", "Hop On Sintra", true);
    updateMetaTag("og:locale", language === "en" ? "en_US" : `${language}_${language.toUpperCase()}`, true);
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", seoTitle);
    updateMetaTag("twitter:description", seoDescription);
    updateMetaTag("twitter:image", ogImage);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `https://www.hoponsintra.com${canonicalPath}`;
  }, [language, content]);

  // Structured Data for SEO (matching HopOnServiceDetailPage pattern)
  const structuredData = useMemo(() => {
    const attractionEntries = Object.entries(getTranslation(language).attractions);

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t.attractionsPageTitle || "Sintra Attractions",
      description: t.attractionsPageSubtitle || "UNESCO World Heritage Sites in Sintra",
      numberOfItems: attractionEntries.length,
      itemListElement: attractionEntries.map(([id, attr], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: attr.name,
        url: `https://www.hoponsintra.com/attractions/${generateSlug(id)}`,
      })),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.hoponsintra.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Attractions",
          item: "https://www.hoponsintra.com/attractions",
        },
      ],
    };

    return { itemList: itemListSchema, breadcrumb: breadcrumbSchema };
  }, [language]);

  // Blog article search
  const searchArticles = (query: string): BlogArticle[] => {
    const posts = loadArticles();
    const lowerQuery = query.toLowerCase();

    return posts.filter((post) => {
      const titleMatch = post.title
        .toLowerCase()
        .includes(lowerQuery);
      const excerptMatch = post.excerpt
        ?.toLowerCase()
        .includes(lowerQuery);
      const tagsMatch = post.tags?.some((tag) =>
        tag.toLowerCase().includes(lowerQuery),
      );
      const categoryMatch = post.category
        ?.toLowerCase()
        .includes(lowerQuery);

      return (
        titleMatch || excerptMatch || tagsMatch || categoryMatch
      );
    });
  };

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = searchArticles(searchQuery);
      setSearchResults(results.slice(0, 5));
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
  }, []);

  const attractions = useMemo(() => {
    // Always use locale data for translated text (name, description).
    // Overlay CMS data only for images so the card text is always in the correct language.
    const localeAttrs = getTranslation(language).attractions as Record<string, any>;
    const cmsDetails = content.attractions?.attractionDetails ?? {};

    return Object.entries(localeAttrs).map(([id, attr]) => {
      const cmsAttr: Record<string, any> = cmsDetails[id] ?? {};
      return {
        id,
        name: attr.name,
        description: attr.description,
        duration: attr.duration,
        price: attr.price,
        parkOnlyPrice: attr.parkOnlyPrice,
        // CMS stores "cardImage" / "heroImage" / "gallery"; locale stores "imageUrl"
        imageUrl:
          cmsAttr.cardImage ||
          cmsAttr.heroImage ||
          cmsAttr.gallery?.[0] ||
          attr.imageUrl ||
          "",
      };
    });
  }, [language, content.attractions?.attractionDetails]);

  const handleExploreClick = (attractionId: string) => {
    const slug = generateSlug(attractionId);
    navigate(`/attractions/${slug}`);
  };

  return (
    <div className="flex-1">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      {/* Header Section - matches BlogPage (Travel Guide) style */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-primary font-extrabold text-[23px]">
              {t.attractionsPageTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t.attractionsPageSubtitle}
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.searchAttractions || "Search attractions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl bg-secondary/30 pl-12 pr-4"
              aria-label="Search attractions and articles"
              autoComplete="off"
            />

            {/* Live Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-white shadow-xl animate-[fadeInDown_0.2s_ease-out]">
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                  {searchResults.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        navigate(`/travel-guide/${article.slug}`);
                        setShowResults(false);
                      }}
                      className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                    >
                      {article.featuredImage && (
                        <ImageWithFallback
                          src={article.featuredImage}
                          alt={article.title}
                          className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="mb-1 font-semibold text-foreground">
                          {article.title}
                        </h4>
                        {article.excerpt && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showResults &&
              searchResults.length === 0 &&
              searchQuery.trim().length > 1 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-border bg-white p-4 text-center shadow-xl animate-[fadeInDown_0.2s_ease-out]">
                  <p className="text-muted-foreground">
                    {t.noArticlesFoundTryDifferent}
                  </p>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* Attractions Grid - matches BlogPage articles grid style */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Badge>
              {attractions.length} {attractions.length === 1 ? t.attractionSingular : t.attractionPlural}
            </Badge>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((attraction) => (
              <div key={attraction.id}>
                <Card
                  className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                  onClick={() => handleExploreClick(attraction.id)}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={attraction.imageUrl || ""}
                      alt={`${attraction.name} - Sintra attraction`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      width={400}
                      height={300}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {attraction.duration && (
                      <Badge className="absolute left-4 top-4 bg-primary text-white">
                        {attraction.duration}
                      </Badge>
                    )}
                    {attraction.price != null && (
                      <Badge className="absolute right-4 top-4 bg-black/50 text-white backdrop-blur-sm">
                        {attraction.price > 0 ? `€${attraction.price}` : (t.free || "Free")}
                      </Badge>
                    )}
                  </div>

                  <div className="flex h-full flex-col p-4 sm:p-5">
                    <h3 className="mb-2 text-foreground group-hover:text-primary">
                      {attraction.name}
                    </h3>

                    <p className="mb-4 flex-1 line-clamp-2 text-sm text-muted-foreground">
                      {attraction.description}
                    </p>

                    <div className="flex items-center gap-2 text-primary">
                      <span className="text-sm">{t.exploreMore || "Explore"}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore More Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">
              {t.moreWaysTitle}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t.moreWaysSubtitle}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Hop On Service Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate("/hop-on-hop-off-sintra")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Car className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                {t.moreWays?.hopOnTitle}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.moreWays?.hopOnDescription}
              </p>
              <Badge className="bg-primary/10 text-primary">
                {t.moreWays?.hopOnBadge}
              </Badge>
            </Card>

            {/* Private Tours Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate("/private-tours")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                  <Compass className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                {t.moreWays?.privateToursTitle}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.moreWays?.privateToursDescription}
              </p>
              <Badge className="bg-purple-500/10 text-purple-600">
                {t.moreWays?.privateToursBadge}
              </Badge>
            </Card>

            {/* Travel Guide Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate("/travel-guide")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                {t.moreWays?.travelGuideTitle}
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t.moreWays?.travelGuideDescription}
              </p>
              <Badge className="bg-blue-500/10 text-blue-600">
                {t.moreWays?.travelGuideBadge}
              </Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - matches BlogPage CTA style */}
      <section className="bg-accent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
              <Landmark className="h-8 w-8 text-accent" />
            </div>
          </div>

          <h2 className="mb-4 text-white">
            {t.attractionsCtaTitle}
          </h2>
          <p className="mb-8 text-xl text-white/90">
            {t.attractionsCtaDescription}
          </p>
          <Button
            size="lg"
            className="bg-white text-accent shadow-xl hover:bg-white/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            {t.attractionsCtaButton}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}