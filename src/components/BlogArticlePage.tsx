import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Tag, Share2, Facebook, Twitter, Mail, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getArticleBySlug, loadCategories, getPublishedArticles, type BlogArticle } from "../lib/blogManager";
import ReactMarkdown from 'react-markdown';
import { BlogSEO } from "./BlogSEO";
import { Breadcrumbs } from "./Breadcrumbs";
import { TableOfContents } from "./TableOfContents";
import { ReadingProgress } from "./ReadingProgress";
import { ArticleFAQ } from "./ArticleFAQ";

import { loadContentWithLanguage } from "../lib/contentManager";

interface BlogArticlePageProps {
  onNavigate: (page: string, data?: any) => void;
  slug: string;
  language: string;
}

export function BlogArticlePage({ onNavigate, slug, language }: BlogArticlePageProps) {
  const content = loadContentWithLanguage(language);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticle[]>([]);
  const [otherArticles, setOtherArticles] = useState<BlogArticle[]>([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    const foundArticle = getArticleBySlug(slug);
    setArticle(foundArticle || null);

    if (foundArticle) {
      // Get category name
      const categories = loadCategories();
      const category = categories.find(cat => cat.slug === foundArticle.category);
      const translatedCategoryName = content.blog.categories[foundArticle.category as keyof typeof content.blog.categories];
      setCategoryName(category?.name || translatedCategoryName || foundArticle.category);

      // Find related articles (same category, excluding current)
      const allArticles = getPublishedArticles();
      const related = allArticles
        .filter(a => a.category === foundArticle.category && a.id !== foundArticle.id)
        .slice(0, 3);
      setRelatedArticles(related);

      // Get other articles for sidebar (excluding current article)
      const otherArts = allArticles
        .filter(a => a.id !== foundArticle.id)
        .slice(0, 5);
      setOtherArticles(otherArts);

      // Scroll to top when article loads
      window.scrollTo(0, 0);

      // Add IDs to headings for TOC navigation
      setTimeout(() => {
        const headings = document.querySelectorAll('.article-content h1, .article-content h2, .article-content h3');
        headings.forEach((heading) => {
          const id = heading.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || '';
          heading.id = id;
        });
      }, 100);
    }
  }, [slug]);

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-foreground">{content.blog.articleNotFound}</h2>
          <Button onClick={() => onNavigate("blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {content.blog.backToBlog}
          </Button>
        </div>
      </div>
    );
  }



  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isArticleUpdated = () => {
    if (!article) return false;
    const published = new Date(article.publishDate);
    const modified = new Date(article.lastModified);
    const diffDays = Math.floor((modified.getTime() - published.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 1; // Show if updated more than 1 day after publishing
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="flex-1">
      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* SEO Meta Tags and Structured Data */}
      {article && <BlogSEO article={article} categoryName={categoryName} />}

      {/* Back Button */}
      <div className="border-b border-border bg-white py-4">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate("blog")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {content.blog.backToBlog}
          </Button>
        </div>
      </div>

      {/* Article Header - Clean & Simple */}
      <section className="border-b border-border bg-white py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "Home", onClick: () => onNavigate("home") },
              { label: "Travel Guide", onClick: () => onNavigate("blog") },
              { label: categoryName, onClick: () => onNavigate("blog", { category: article.category }) },
              { label: article.title }
            ]}
          />

          {/* Category Badge */}
          <Badge className="mb-3 bg-primary text-white">
            {categoryName}
          </Badge>

          {/* Meta Info - Above Image */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={article.publishDate}>
                {formatDateForDisplay(article.publishDate)}
              </time>
            </div>
            {isArticleUpdated() && (
              <div className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                <time dateTime={article.lastModified}>{formatDateForDisplay(article.lastModified)}</time>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.readTimeMinutes} {content.blog.minRead}
            </div>
            {article.author && (
              <div className="flex items-center gap-1.5">
                By {article.author}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {article.featuredImage && (
        <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg shadow-lg">
            <ImageWithFallback
              src={article.featuredImage}
              alt={article.title}
              className="aspect-[21/9] w-full object-cover sm:aspect-video"
            />
          </div>
        </section>
      )}

      {/* Tags and Share - Below Image */}
      <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Share Button - Small & Subtle */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              {content.blog.share}
            </Button>

            {showShareMenu && (
              <Card className="absolute right-0 top-10 z-10 p-2 shadow-lg">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="justify-start gap-2 text-xs"
                  >
                    <Facebook className="h-3.5 w-3.5" />
                    Facebook
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="justify-start gap-2 text-xs"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                    Twitter
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare('email')}
                    className="justify-start gap-2 text-xs"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Article Content with TOC */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Main Content */}
          <article className="article-content">
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="mb-8 mt-2 text-foreground" {...props} />,
                  h2: ({node, ...props}) => <h2 className="mb-4 mt-8 text-foreground" {...props} />,
                  h3: ({node, ...props}) => <h3 className="mb-3 mt-6 text-foreground" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 text-muted-foreground leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc space-y-2 text-muted-foreground" {...props} />,
                  ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-muted-foreground" {...props} />,
                  li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-foreground" {...props} />,
                  a: ({node, ...props}) => <a className="text-primary underline hover:text-primary/80" {...props} />,
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />
                  ),
                }}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden space-y-6 lg:block">
            <div className="sticky top-24 space-y-6">
              <TableOfContents content={article.content} />
              
              {/* Other Articles Card - Desktop */}
              {otherArticles.length > 0 && (
                <Card className="overflow-hidden border-border">
                  <div className="border-b border-border bg-gradient-to-br from-primary/5 to-accent/5 p-4">
                    <h3 className="text-foreground">More from Travel Guide</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {otherArticles.slice(0, 3).map((otherArticle) => (
                      <div
                        key={otherArticle.id}
                        className="group cursor-pointer transition-all hover:bg-secondary/30"
                        onClick={() => onNavigate("blog-article", { slug: otherArticle.slug })}
                      >
                        {otherArticle.featuredImage ? (
                          <div className="relative">
                            <div className="relative aspect-video overflow-hidden">
                              <ImageWithFallback
                                src={otherArticle.featuredImage}
                                alt={otherArticle.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-4">
                              <h4 className="mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                                {otherArticle.title}
                              </h4>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {otherArticle.readTimeMinutes} {content.blog.minRead}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4">
                            <h4 className="mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                              {otherArticle.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {otherArticle.readTimeMinutes} {content.blog.minRead}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("blog")}
                      className="w-full"
                    >
                      View All Articles
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Table of Contents */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:hidden">
        <TableOfContents content={article.content} />
      </div>

      <Separator className="mx-auto max-w-6xl" />

      {/* Mobile - More from Travel Guide */}
      {otherArticles.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:hidden">
          <h2 className="mb-6 text-foreground">More from Travel Guide</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {otherArticles.slice(0, 4).map((otherArticle) => (
              <Card
                key={otherArticle.id}
                className="group cursor-pointer overflow-hidden border-border transition-all hover:shadow-lg"
                onClick={() => onNavigate("blog-article", { slug: otherArticle.slug })}
              >
                {otherArticle.featuredImage && (
                  <div className="relative aspect-video overflow-hidden">
                    <ImageWithFallback
                      src={otherArticle.featuredImage}
                      alt={otherArticle.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 transition-colors group-hover:text-primary">
                    {otherArticle.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {otherArticle.readTimeMinutes} min read
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => onNavigate("blog")}
            >
              View All Articles
            </Button>
          </div>
        </section>
      )}

      <Separator className="mx-auto max-w-6xl lg:hidden" />

      {/* FAQ Section */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <ArticleFAQ faqs={article.faqs} articleUrl={`https://gosintra.pt/blog/${article.slug}`} />
        </section>
      )}

      {article.faqs && article.faqs.length > 0 && <Separator className="mx-auto max-w-6xl" />}

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center">
          <h3 className="mb-3 text-foreground">Ready to Experience Sintra?</h3>
          <p className="mb-6 text-muted-foreground">
            Book your flexible day pass and start exploring Sintra's magnificent palaces and gardens
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate("buy-ticket")}
            className="gap-2"
          >
            Book Your Day Pass Now
          </Button>
        </Card>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-border bg-secondary/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center text-foreground">Related Articles</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {relatedArticles.map((relatedArticle) => (
                <Card
                  key={relatedArticle.id}
                  className="group cursor-pointer overflow-hidden border-border transition-all hover:shadow-xl"
                  onClick={() => onNavigate("blog-article", { slug: relatedArticle.slug })}
                >
                  {relatedArticle.featuredImage && (
                    <div className="relative aspect-video overflow-hidden">
                      <ImageWithFallback
                        src={relatedArticle.featuredImage}
                        alt={relatedArticle.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {relatedArticle.readTimeMinutes} min read
                    </div>
                    <h3 className="text-foreground transition-colors group-hover:text-primary">
                      {relatedArticle.title}
                    </h3>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
