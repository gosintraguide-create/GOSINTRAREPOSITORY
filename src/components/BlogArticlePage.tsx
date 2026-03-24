import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Calendar, Clock, User, Tag, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { loadArticles, getArticleTranslation } from "../lib/blogManager";
import { loadCategories } from "../lib/blogManager";
import type { BlogArticle } from "../lib/blogManager";
import { marked } from "marked";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function BlogArticlePage() {
  const { slug, lang = 'en' } = useParams<{ slug: string; lang?: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticle[]>([]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const articles = loadArticles();
    const found = articles.find((a) => a.slug === slug);
    setArticle(found || null);

    // Get other articles (excluding the current one)
    if (found) {
      const others = articles
        .filter((a) => a.slug !== slug && a.isPublished)
        .slice(0, 3); // Get up to 3 related articles
      setRelatedArticles(others);
    }
  }, [slug]);

  if (!article) {
    return null; // Will redirect
  }

  const translation = getArticleTranslation(article, lang);
  const categories = loadCategories();
  const category = categories.find((c) => c.id === article.category);
  const categoryName = category
    ? (category.translations[lang]?.name || category.translations.en?.name)
    : "Uncategorized";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex-1">
      {/* SEO Meta Tags */}
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{translation.title} - Hop On Sintra Blog</title>
        <meta name="title" content={`${translation.title} - Hop On Sintra Blog`} />
        <meta name="description" content={article.excerpt || translation.content.substring(0, 155)} />
        <meta name="keywords" content={article.seoKeywords || article.tags?.join(', ') || `Sintra, ${translation.title}, travel guide`} />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.hoponsintra.com/blog/${article.slug}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.hoponsintra.com/blog/${article.slug}`} />
        <meta property="og:title" content={translation.title} />
        <meta property="og:description" content={article.excerpt || translation.content.substring(0, 155)} />
        <meta property="og:image" content={article.featuredImage || article.heroImage || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={article.publishDate} />
        <meta property="article:author" content={article.author} />
        <meta property="article:section" content={categoryName} />
        {article.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://www.hoponsintra.com/blog/${article.slug}`} />
        <meta name="twitter:title" content={translation.title} />
        <meta name="twitter:description" content={article.excerpt || translation.content.substring(0, 155)} />
        <meta name="twitter:image" content={article.featuredImage || article.heroImage || "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630"} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content={article.author} />
      </Helmet>

      {/* Back Button */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/blog")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <ImageWithFallback
          src={article.featuredImage || article.heroImage || ""}
          alt={translation.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </section>

      {/* Article Content */}
      <article className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4">{categoryName}</Badge>
          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
            {translation.title}
          </h1>

          {/* Meta Information */}
          <div className="mb-6 flex flex-wrap gap-4 border-b border-border pb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.publishDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{article.readTimeMinutes} min read</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose prose-article max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(translation.content) }}
          />
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-border bg-gray-50 py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Related guides
            </h2>
            <div className="space-y-4">
              {relatedArticles.map((relatedArticle) => {
                const relatedTranslation = getArticleTranslation(relatedArticle, lang);
                const relatedCategory = categories.find((c) => c.id === relatedArticle.category);
                const relatedCategoryName = relatedCategory
                  ? (relatedCategory.translations[lang]?.name || relatedCategory.translations.en?.name)
                  : "Uncategorized";
                
                return (
                  <div
                    key={relatedArticle.slug}
                    onClick={() => navigate(`/blog/${relatedArticle.slug}`)}
                    className="flex cursor-pointer gap-4 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <ImageWithFallback
                      src={relatedArticle.featuredImage || relatedArticle.heroImage || ""}
                      alt={relatedTranslation.title}
                      className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <h3 className="mb-1 text-base font-semibold leading-tight text-gray-900">
                        {relatedTranslation.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{relatedArticle.readTimeMinutes} min read</span>
                        <span className="text-gray-400">•</span>
                        <span>{relatedCategoryName}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}