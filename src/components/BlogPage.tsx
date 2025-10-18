import { useState, useEffect } from "react";
import { Search, Clock, Calendar, Tag, BookOpen, ArrowRight, Filter } from "lucide-react";
import { SEOHead } from "./SEOHead";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  loadArticles,
  loadCategories,
  getPublishedArticles,
  getArticlesByCategory,
  searchArticles,
  type BlogArticle,
  type BlogCategory,
} from "../lib/blogManager";

interface BlogPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export function BlogPage({ onNavigate }: BlogPageProps) {
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

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = getArticlesByCategory(selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = searchArticles(searchQuery);
    }

    // Sort by date (newest first)
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
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryName = (categorySlug: string) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.name || categorySlug;
  };

  return (
    <div className="flex-1">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Sintra Travel Guide & Blog - Expert Tips, Guides & Itineraries"
        description="Comprehensive travel guides for visiting Sintra, Portugal. Expert tips on transportation, attractions, planning your trip, and making the most of your Sintra adventure."
        keywords="Sintra travel guide, Sintra blog, visit Sintra, Sintra tips, Pena Palace guide, Sintra itinerary, how to visit Sintra, Sintra Portugal"
        canonicalPath="/blog"
        ogImage="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-accent blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
            </div>
            
            <h1 className="mb-4 text-white">
              Sintra Travel Guide
            </h1>
            
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90">
              Expert tips, comprehensive guides, and insider knowledge to help you make the most of your Sintra adventure
            </p>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 border-0 bg-white pl-12 pr-4 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="border-b border-border bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All Articles
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  {category.name}
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
              <h3 className="mb-2 text-foreground">No articles found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Try a different search term" : "No articles available in this category"}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="group cursor-pointer overflow-hidden border-border transition-all hover:shadow-xl"
                  onClick={() => handleArticleClick(article)}
                >
                  {/* Featured Image */}
                  {article.featuredImage && (
                    <div className="relative aspect-video overflow-hidden">
                      <ImageWithFallback
                        src={article.featuredImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      
                      {/* Category Badge */}
                      <Badge className="absolute left-4 top-4 bg-primary text-white">
                        {getCategoryName(article.category)}
                      </Badge>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Meta Info */}
                    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(article.publishDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {article.readTimeMinutes} min read
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 text-foreground transition-colors group-hover:text-primary">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="mb-4 line-clamp-3 text-muted-foreground">
                      {article.excerpt}
                    </p>

                    {/* Tags */}
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

                    {/* Read More */}
                    <div className="flex items-center gap-2 text-primary">
                      <span>Read Article</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Overview */}
      <section className="border-t border-border bg-secondary/30 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-foreground">Explore by Category</h2>
            <p className="text-muted-foreground">
              Browse our collection of guides and articles organized by topic
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const categoryArticleCount = articles.filter(
                (a) => a.category === category.slug
              ).length;

              return (
                <Card
                  key={category.id}
                  className="cursor-pointer border-border p-6 transition-all hover:shadow-lg"
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  <h3 className="mb-2 text-foreground">{category.name}</h3>
                  <p className="mb-4 text-muted-foreground">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {categoryArticleCount} {categoryArticleCount === 1 ? 'article' : 'articles'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-primary/90 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4">Ready to Explore Sintra?</h2>
          <p className="mb-8 text-lg text-white/90">
            Now that you're armed with expert knowledge, book your flexible day pass and start your adventure
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-white bg-white text-primary hover:bg-white/90"
            onClick={() => onNavigate("buy-ticket")}
          >
            Book Your Day Pass
          </Button>
        </div>
      </section>
    </div>
  );
}
