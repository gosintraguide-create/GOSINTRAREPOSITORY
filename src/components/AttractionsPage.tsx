import { useState, useEffect, useRef } from "react";
import {
  Star,
  Clock,
  MapPin,
  Search,
  BookOpen,
  TrendingUp,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  loadComprehensiveContent,
  type ComprehensiveContent,
  DEFAULT_COMPREHENSIVE_CONTENT,
} from "../lib/comprehensiveContent";
import { getUITranslation } from "../lib/translations";
import {
  searchArticles,
  type BlogArticle,
} from "../lib/blogManager";
import { motion } from "motion/react";

interface AttractionsPageProps {
  onNavigate: (page: string, data?: any) => void;
  language?: string;
}

export function AttractionsPage({
  onNavigate,
  language = "en",
}: AttractionsPageProps) {
  const [content, setContent] = useState<ComprehensiveContent>(
    DEFAULT_COMPREHENSIVE_CONTENT,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    BlogArticle[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const t = getUITranslation(language);

  useEffect(() => {
    setContent(loadComprehensiveContent());
  }, [language]);

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

  const attractions = Object.entries(
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
  }));

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
  };

  return (
    <div className="flex-1">
      {/* Header Section */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-foreground">
              {t.attractionsPageTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t.attractionsPageSubtitle}
            </p>
          </div>

          {/* Search Bar with Live Recommendations */}
          <div
            ref={searchRef}
            className="relative mx-auto max-w-2xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.searchTravelGuidesPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() =>
                  searchQuery.trim().length > 1 &&
                  setShowResults(true)
                }
                className="h-12 rounded-xl bg-secondary/30 pl-12 pr-4"
              />
            </div>

            {/* Live Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <motion.div
                className="absolute top-full z-50 mt-2 w-full rounded-xl border border-border bg-white shadow-xl"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="p-2">
                  <div className="mb-2 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    {t.travelGuideRecommendations}
                  </div>
                  {searchResults.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => {
                        onNavigate("blog-article", {
                          slug: article.slug,
                        });
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-secondary"
                    >
                      <BookOpen className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate">
                          {article.title}
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {article.excerpt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {showResults &&
              searchResults.length === 0 &&
              searchQuery.trim().length > 1 && (
                <motion.div
                  className="absolute top-full z-50 mt-2 w-full rounded-xl border border-border bg-white p-4 text-center shadow-xl"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-muted-foreground">
                    {t.noArticlesFoundTryDifferent}
                  </p>
                </motion.div>
              )}
          </div>
        </div>
      </section>

      {/* Attractions Grid */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {attractions.map((attraction) => (
              <Card
                key={attraction.id}
                className="group h-full cursor-pointer overflow-hidden border bg-white shadow-md transition-all hover:shadow-xl"
                onClick={() => onNavigate(attraction.id)}
              >
                {/* Image - Larger, more prominent */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <ImageWithFallback
                    src={
                      attraction.cardImage ||
                      attractionFallbackImages[
                        attraction.id
                      ] ||
                      "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop"
                    }
                    alt={attraction.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Title on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white">
                      {attraction.name}
                    </h3>
                  </div>
                </div>

                {/* Minimal Content */}
                <div className="p-5">
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {attraction.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {attraction.duration}
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <span>{t.learnMore}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Info Section */}
      <section className="border-t border-border bg-secondary/20 py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-foreground">
            {t.planningYourVisit}
          </h2>
          <p className="mb-6 text-muted-foreground">
            {t.browseTravelGuidesDescription}
          </p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate("blog")}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            {t.readTravelGuides}
          </Button>
        </div>
      </section>
    </div>
  );
}