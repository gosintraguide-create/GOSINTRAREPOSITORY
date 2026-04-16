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
import { getUITranslation } from "../lib/translations";
import { useEditableContent } from "../lib/useEditableContent";
import { generateSlug } from "../routes";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

// Fallback images for attractions without uploaded images
const attractionFallbackImages: { [key: string]: string } = {
  "pena-palace":
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW5hJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwMnww&ixlib=rb-4.1.0&q=80&w=1080",
  "quinta-regaleira":
    "https://images.unsplash.com/photo-1668377298351-3f7a745a56fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWludGElMjBkYSUyMHJlZ2FsZWlyYSUyMHNpbnRyYXxlbnwxfHx8fDE3NjMxNjg3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "moorish-castle":
    "https://images.unsplash.com/photo-1651520011190-6f37b5213684?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb29yaXNoJTIwY2FzdGxlJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2ODc2OXww&ixlib=rb-4.1.0&q=80&w=1080",
  "monserrate-palace":
    "https://images.unsplash.com/photo-1609137144813-7d9921338f24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25zZXJyYXRlJTIwcGFsYWNlJTIwc2ludHJhfGVufDF8fHx8MTc2MDE0MDYwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "sintra-palace":
    "https://images.unsplash.com/photo-1668945306762-a31d14d8a940?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW50cmElMjBwb3J0dWdhbCUyMHBhbGFjZXxlbnwxfHx8fDE3NjAxNDAyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "convento-capuchos":
    "https://images.unsplash.com/photo-1672692921041-f676e2cae79a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb252ZW50byUyMGNhcHVjaG9zJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjU5OHww&ixlib=rb-4.1.0&q=80&w=1080",
  "cabo-da-roca":
    "https://images.unsplash.com/photo-1700739745973-bbd552072e98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJvJTIwZGElMjByb2NhJTIwbGlnaHRob3VzZXxlbnwxfHx8fDE3NjMxNjY2MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "villa-sassetti":
    "https://images.unsplash.com/photo-1670060434149-220a5fce89da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYSUyMHNhc3NldHRpJTIwc2ludHJhfGVufDF8fHx8MTc2MzE2NjYwNnww&ixlib=rb-4.1.0&q=80&w=1080",
  "biester-chalet":
    "https://images.unsplash.com/photo-1630272088070-8daf9644018b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWVzdGVyJTIwY2hhbGV0JTIwc2ludHJhfGVufDF8fHx8MTc2NTEzMjc3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "queluz-palace":
    "https://images.unsplash.com/photo-1720434566459-4c3eb849a0d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWVsdXolMjBwYWxhY2UlMjBwb3J0dWdhbHxlbnwxfHx8fDE3NjUxMzI3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "mafra-convent":
    "https://images.unsplash.com/photo-1726156982862-e75f7cacc21c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWZyYSUyMGNvbnZlbnQlMjBwb3J0dWdhbHxlbnwxfHx8fDE3NjUxMzI3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

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
    const attractionEntries = Object.entries(content.attractions.attractionDetails);

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: content.attractions.hero?.title || "Sintra Attractions",
      description: content.attractions.hero?.subtitle || "UNESCO World Heritage Sites in Sintra",
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
  }, [content.attractions]);

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

  const attractions = useMemo(() => Object.entries(
    content.attractions.attractionDetails,
  ).map(([id, attr]) => ({
    id,
    name: attr.name,
    description: attr.shortDescription,
    duration: attr.duration,
    price: attr.price,
    parkOnlyPrice: attr.parkOnlyPrice,
    cardImage: attr.cardImage,
    heroImage: attr.heroImage,
  })), [content.attractions.attractionDetails]);

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
              {content.attractions.hero?.title || "Discover Sintra's Treasures"}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {content.attractions.hero?.subtitle || "Explore UNESCO World Heritage Sites with Your Day Pass"}
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl" ref={searchRef}>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t.searchAttractions}
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
                        navigate(`/blog/${article.slug}`);
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
              {attractions.length} {attractions.length === 1 ? "attraction" : "attractions"}
            </Badge>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((attraction) => (
              <div key={attraction.id}>
                <Card
                  className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                  onClick={() => handleExploreClick(attraction.id)}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback
                      src={
                        attraction.cardImage ||
                        attractionFallbackImages[attraction.id] ||
                        ""
                      }
                      alt={`${attraction.name} - Sintra attraction`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      width={400}
                      height={300}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {attraction.duration && (
                      <Badge className="absolute left-4 top-4 bg-primary text-white">
                        {attraction.duration}
                      </Badge>
                    )}
                  </div>

                  <div className="flex h-full flex-col p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {attraction.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {attraction.duration}
                        </div>
                      )}
                      {attraction.price != null && (
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {attraction.price > 0 ? `€${attraction.price}` : "Free"}
                        </div>
                      )}
                    </div>

                    <h3 className="mb-3 text-foreground group-hover:text-primary">
                      {attraction.name}
                    </h3>

                    <p className="mb-4 flex-1 line-clamp-3 text-muted-foreground">
                      {attraction.description}
                    </p>

                    <div className="flex items-center gap-2 text-primary">
                      <span>{t.explorMore || "Explore"}</span>
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
              More Ways to Explore Sintra
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Discover our services designed to make your Sintra experience unforgettable
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Hop On Service Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate("/hop-on-service")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Car className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                Hop On Service
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlimited hop-on/hop-off day pass to visit all attractions at your own pace
              </p>
              <Badge className="bg-primary/10 text-primary">
                9am - 7pm Daily
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
                Private Tours
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Personalized guided tours with expert local guides and custom itineraries
              </p>
              <Badge className="bg-purple-500/10 text-purple-600">
                Custom Experience
              </Badge>
            </Card>

            {/* Travel Guide Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate("/blog")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                Travel Guide
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Insider tips, photography spots, and expert advice for visiting Sintra
              </p>
              <Badge className="bg-blue-500/10 text-blue-600">
                Local Insights
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
            {content.hopOnService?.callToAction?.title || "Ready to Explore Sintra?"}
          </h2>
          <p className="mb-8 text-xl text-white/90">
            {content.attractions.hero?.description || "Your Hop On Sintra day pass gives you access to all these magnificent attractions. Hop on and off as you please, spending as much time as you'd like at each location."}
          </p>
          <Button
            size="lg"
            className="bg-white text-accent shadow-xl hover:bg-white/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            {content.hopOnService?.callToAction?.buttonText || "Book Your Day Pass"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}