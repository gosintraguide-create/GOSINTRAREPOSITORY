import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { loadArticles, getArticleTranslation } from "../lib/blogManager";
import { loadCategories } from "../lib/blogManager";
import type { BlogArticle } from "../lib/blogManager";
import { marked } from "marked";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function BlogArticlePage() {
  const { slug, lang = 'en' } = useParams<{ slug: string; lang?: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const articles = loadArticles();
    const found = articles.find((a) => a.slug === slug);
    setArticle(found || null);
  }, [slug]);

  if (!article) {
    return null; // Will redirect
  }

  const translation = getArticleTranslation(article, lang);
  const categories = loadCategories();
  const category = categories.find((c) => c.id === article.categoryId);
  const categoryName = category
    ? category.translations[lang] || category.translations.en
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
    </div>
  );
}