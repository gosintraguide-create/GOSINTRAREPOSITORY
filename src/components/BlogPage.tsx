import { useState, useEffect } from "react";
import { Search, Clock, Calendar, Tag, BookOpen, ArrowRight, Filter, Compass } from "lucide-react";
import { SEOHead } from "./SEOHead";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  loadArticles,
  loadCategories,
  getPublishedArticles,
  getArticlesByCategory,
  searchArticles,
  type BlogArticle,
  type BlogCategory,
} from "../lib/blogManager";
import { loadContentWithLanguage } from "../lib/contentManager";
import { motion } from "motion/react";

interface BlogPageProps {
  onNavigate: (page: string, data?: any) => void;
  language: string;
}

export function BlogPage({ onNavigate, language }: BlogPageProps) {
  const content = loadContentWithLanguage(language);
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadedArticles = getPublishedArticles();
    const loadedCategories = loadCategories();
    setArticles(loadedArticles);
    setCategories(loadedCategories);
    setFilteredArticles(loadedArticles);
  }, []);

  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== "all") {
      filtered = getArticlesByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = searchArticles(searchQuery);
    }

    filtered = [...filtered].sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );

    setFilteredArticles(filtered);
  }, [selectedCategory, searchQuery, articles]);

  const handleArticleClick = (article: BlogArticle) => {
    onNavigate("blog-article", { slug: article.slug });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Map language codes to locale strings
    const localeMap: Record<string, string> = {
      en: 'en-US',
      pt: 'pt-PT',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      nl: 'nl-NL',
      it: 'it-IT',
    };
    const locale = localeMap[language] || 'en-US';
    return date.toLocaleDateString(locale, { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    if (category?.name) return category.name;
    // Fallback to translated category name
    return content.blog.categories[categorySlug as keyof typeof content.blog.categories] || categorySlug;
  };

  return (
    <div className="flex-1">
      <SEOHead
        title={content.seo?.blog?.title || "Sintra Travel Guide & Blog - Expert Tips, Guides & Itineraries"}
        description={content.seo?.blog?.description || "Comprehensive travel guides for visiting Sintra, Portugal. Expert tips on transportation, attractions, planning your trip, and making the most of your Sintra adventure."}
        keywords={content.seo?.blog?.keywords || "Sintra travel guide, Sintra blog, visit Sintra, Sintra tips, Pena Palace guide, Sintra itinerary, how to visit Sintra, Sintra Portugal"}
        canonicalPath="/blog"
        language={language}
        structuredDataType="article"
        ogImage="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop"
      />

      {/* Hero Section */}
      <section className="border-b border-border bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h1 className="mb-3 text-foreground">
              {content.blog.pageTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {content.blog.pageSubtitle}
            </p>
          </div>

          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={content.blog.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 rounded-xl bg-secondary/30 pl-12 pr-4"
            />
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{content.blog.filterBy}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                {content.blog.allArticles}
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  {getCategoryName(category.slug)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {filteredArticles.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-foreground">{content.blog.noArticlesFound}</h3>
              <p className="text-muted-foreground">
                {searchQuery ? content.blog.tryDifferentSearch : content.blog.noArticlesInCategory}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <Badge>
                  {filteredArticles.length} {filteredArticles.length === 1 ? content.blog.article : content.blog.articles} {content.blog.articlesFound}
                </Badge>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                      onClick={() => handleArticleClick(article)}
                    >
                      {(article.thumbnailImage || article.featuredImage) && (
                        <div className="relative aspect-video overflow-hidden">
                          <ImageWithFallback
                            src={article.thumbnailImage || article.featuredImage || ""}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          
                          <Badge className="absolute left-4 top-4 bg-primary text-white">
                            {getCategoryName(article.category)}
                          </Badge>
                        </div>
                      )}

                      <div className="flex h-full flex-col p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(article.publishDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {article.readTimeMinutes} {content.blog.minRead}
                          </div>
                        </div>

                        <h3 className="mb-3 text-foreground group-hover:text-primary">
                          {article.title}
                        </h3>

                        <p className="mb-4 flex-1 line-clamp-3 text-muted-foreground">
                          {article.excerpt}
                        </p>

                        {article.tags.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="gap-1">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-primary">
                          <span>{content.blog.readGuide}</span>
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Categories Overview */}
      <section className="border-t border-border bg-secondary/30 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge className="mb-4">{content.blog.browseTopics}</Badge>
            <h2 className="mb-4 text-foreground">{content.blog.exploreByCategory}</h2>
            <p className="text-muted-foreground">
              {content.blog.exploreCategoryDescription}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const categoryArticleCount = articles.filter(
                (a) => a.category === category.slug
              ).length;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="group h-full cursor-pointer p-6 transition-all hover:shadow-lg"
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-foreground group-hover:text-primary">{getCategoryName(category.slug)}</h3>
                    <p className="mb-4 text-muted-foreground">
                      {content.blog.categoryDescriptions[category.slug as keyof typeof content.blog.categoryDescriptions] || category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {categoryArticleCount} {categoryArticleCount === 1 ? content.blog.guide : content.blog.guides}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-2" />
                    </div>
                  </Card>
                </motion.div>
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

          <h2 className="mb-4 text-white">{content.blog.ctaTitle}</h2>
          <p className="mb-8 text-xl text-white/90">
            {content.blog.ctaSubtitle}
          </p>
          <Button
            size="lg"
            className="bg-white text-accent shadow-xl hover:bg-white/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            {content.blog.ctaButton}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}