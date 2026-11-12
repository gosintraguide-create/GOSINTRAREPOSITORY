import {useWebsiteText} from '../lib/translations/websiteText';
import { useOutletContext, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Search,
  Clock,
  Calendar,
  Tag,
  ArrowRight,
  Filter,
  X,
  BookOpen,
  Compass,
  Map,
  Camera,
  Utensils,
  Bus,
  Car,
  Landmark,
  ChevronRight,
} from "lucide-react";
import { getUITranslation } from "../lib/translations";
import { getTranslation } from "../lib/translations/loader";
import {
  loadArticles,
  getPublicArticleTranslation as getArticleTranslation,
  loadCategories,
  getBlogSettings,
  getBlogStats,
  loadArticlesFromServer,
  loadCategoriesFromServer,
  getCategoryTranslation,
  type BlogArticle,
  type BlogCategory,
} from "../lib/blogManager";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { SmallSpinner } from "./LoadingIndicator";

interface OutletContext {
  language: string;
  onNavigate: (page: string, data?: any) => void;
}

export function BlogPage() {
  const wt = useWebsiteText();
  const { language = "en", onNavigate } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tb = getTranslation(language).blog;
  // Seed from localStorage immediately so the page renders without waiting for
  // the network. The async effect below will update with fresh data if needed.
  const [articles, setArticles] = useState<BlogArticle[]>(() => {
    try {
      const raw = localStorage.getItem("blog-articles-cache");
      if (raw) {
        const parsed: BlogArticle[] = JSON.parse(raw);
        return parsed.filter((a: any) => a.isPublished !== false);
      }
    } catch (_) {}
    return [];
  });
  const [categories, setCategories] = useState<BlogCategory[]>(() => {
    try {
      const raw = localStorage.getItem("blog-categories-cache");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  });
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get("tag") || "");
  const [searchQuery, setSearchQuery] = useState("");
  // Only show spinner on true first load (no cache)
  const [isLoading, setIsLoading] = useState(
    () => !localStorage.getItem("blog-articles-cache")
  );

  // SEO for /travel-guide is handled entirely by RootLayout via the route handle meta.

  useEffect(() => {
    const loadData = async () => {
      // Don't reset isLoading — we already show stale data if available
      try {
        const [loadedArticles, loadedCategories] = await Promise.all([
          loadArticlesFromServer(projectId, publicAnonKey),
          loadCategoriesFromServer(projectId, publicAnonKey),
        ]);
        const publishedArticles = loadedArticles.filter(article => article.isPublished);
        setArticles(publishedArticles);
        setCategories(loadedCategories);
        setFilteredArticles(publishedArticles);
      } catch (error) {
        console.error("Error loading blog data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    if (selectedTag) {
      filtered = filtered.filter(article => article.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(article => {
        const translation = getArticleTranslation(article, language);
        return (
          translation.title.toLowerCase().includes(lowerQuery) ||
          translation.excerpt.toLowerCase().includes(lowerQuery) ||
          article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      });
    }

    filtered = [...filtered].sort(
      (a, b) =>
        new Date(b.publishDate).getTime() -
        new Date(a.publishDate).getTime(),
    );

    setFilteredArticles(filtered);
  }, [selectedCategory, selectedTag, searchQuery, articles]);

  const handleArticleClick = (article: BlogArticle) => {
    onNavigate("blog-article", { slug: article.slug });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
      en: "en-US",
      pt: "pt-PT",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
      nl: "nl-NL",
      it: "it-IT",
    };
    const locale = localeMap[language] || "en-US";
    return date.toLocaleDateString(locale, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryName = (categorySlug: string) => {
    const jsonName = tb.categories[categorySlug as keyof typeof tb.categories];
    if (jsonName) return jsonName;
    const category = categories.find((cat) => cat.slug === categorySlug);
    if (category) {
      return getCategoryTranslation(category, language).name;
    }
    return wt(categorySlug);
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, typeof Search> = {
      "Pena Palace": Search,
      "Sintra Castle": Map,
      "Palacio Nacional de Sintra": Camera,
      "Sintra Village": Utensils,
      "Sintra Transportation": Bus,
    };
    return iconMap[categoryName] || Search;
  };

  return (
    <div className="flex-1">
      {/* Header: title + search + category filters \u2014 single unified block */}
      <section className="border-b border-border bg-white pb-6 pt-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 text-center">
            <h1 className="mb-2 text-primary font-extrabold text-[23px]">
              {tb.pageTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground">
              {tb.pageSubtitle.replace(/\u2728/g, "").trim()}
            </p>
          </div>

          <div className="relative mx-auto mb-5 max-w-xl">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={tb.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl bg-secondary/30 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Button
              variant={selectedCategory === "all" && !selectedTag ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full text-xs"
              onClick={() => { setSelectedCategory("all"); setSelectedTag(""); }}
            >
              {tb.allArticles}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full text-xs"
                onClick={() => { setSelectedCategory(category.slug); setSelectedTag(""); }}
              >
                {getCategoryName(category.slug)}
              </Button>
            ))}
            {selectedTag && (
              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
                <Tag className="h-3 w-3" />
                {wt(selectedTag)}
                <button onClick={() => setSelectedTag("")} aria-label={wt("Clear tag filter")} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <SmallSpinner className="h-12 w-12" />
                <p className="text-muted-foreground">{wt("Loading articles...")}</p>
              </div>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-foreground">
                {tb.noArticlesFound}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? tb.tryDifferentSearch
                  : tb.noArticlesInCategory}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <Badge variant="outline">
                  {filteredArticles.length}{" "}
                  {filteredArticles.length === 1 ? tb.article : tb.articles}{" "}
                  {tb.articlesFound}
                </Badge>
              </div>

              {/* Uniform portrait-card grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => {
                  const t = getArticleTranslation(article, language);
                  const imgSrc = article.thumbnailImage || article.featuredImage || "";
                  return (
                    <div
                      key={article.id}
                      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                      onClick={() => handleArticleClick(article)}
                    >
                      {/* Portrait image with title/meta overlay */}
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {imgSrc ? (
                          <ImageWithFallback
                            src={imgSrc}
                            alt={t.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-stone-200" />
                        )}
                        {/* gradient — stronger at bottom for text legibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Category badge — top left */}
                        <Badge className="absolute left-3 top-3 bg-primary/90 text-white text-xs backdrop-blur-sm">
                          {getCategoryName(article.category)}
                        </Badge>

                        {/* Title + author + date — bottom overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="mb-2.5 text-base font-bold leading-snug text-white sm:text-lg">
                            {t.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-white/80">
                            {article.author && (
                              <span className="flex items-center gap-1">
                                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/40 text-[9px]">✦</span>
                                {article.author}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(article.publishDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Excerpt + read more — below image */}
                      <div className="p-4">
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {t.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {article.readTimeMinutes} {tb.minRead}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
                            {tb.readGuide}
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Explore More Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">{wt("Plan Your Sintra Adventure")}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">{wt("Ready to explore? Choose the best way to experience Sintra")}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Hop On Service Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => onNavigate("hop-on-hop-off-sintra")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Car className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">{wt("Hop On Service")}<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{wt("Unlimited hop-on/hop-off day pass to all major attractions with guaranteed seating")}</p>
              <Badge className="bg-primary/10 text-primary">{wt("Most Flexible")}</Badge>
            </Card>

            {/* Attractions Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => onNavigate("attractions")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                  <Landmark className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">{wt("Attractions")}<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{wt("Explore UNESCO palaces, castles, and historic sites across Sintra")}</p>
              <Badge className="bg-amber-500/10 text-amber-600">{wt("11+ Destinations")}</Badge>
            </Card>

            {/* Private Tours Link */}
            <Card
              className="p-6 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => onNavigate("private-tours")}
            >
              <div className="mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                  <Compass className="h-7 w-7" />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">{wt("Private Tours")}<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{wt("Personalized guided experiences with local experts and custom itineraries")}</p>
              <Badge className="bg-purple-500/10 text-purple-600">{wt("Exclusive Access")}</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="border-t border-border bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">
              {tb.browseTopics}
            </Badge>
            <h2 className="mb-4 text-foreground">
              {tb.exploreByCategory}
            </h2>
            <p className="text-muted-foreground">
              {tb.exploreCategoryDescription}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const catTranslation = getCategoryTranslation(category, language);
              const Icon = getCategoryIcon(catTranslation.name);
              const articlesInCategory =
                articles.filter(
                  (article) =>
                    article.category === category.id ||
                    article.category === category.slug,
                ).length;

              return (
                <div
                  key={category.id}
                  className="group"
                >
                  <Card
                    className="group h-full cursor-pointer p-6 transition-all hover:shadow-lg"
                    onClick={() =>
                      setSelectedCategory(category.slug)
                    }
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-foreground group-hover:text-primary">
                      {getCategoryName(category.slug)}
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      {tb.categoryDescriptions[
                        category.slug as keyof typeof tb.categoryDescriptions
                      ] || catTranslation.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {articlesInCategory}{" "}
                        {articlesInCategory === 1
                          ? tb.guide
                          : tb.guides}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-2" />
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
              <Compass className="h-8 w-8 text-accent" />
            </div>
          </div>

          <h2 className="mb-4 text-white">
            {tb.ctaTitle}
          </h2>
          <p className="mb-8 text-xl text-white/90">
            {tb.ctaSubtitle}
          </p>
          <Button
            size="lg"
            className="bg-white text-accent shadow-xl hover:bg-white/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            {tb.ctaButton}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
