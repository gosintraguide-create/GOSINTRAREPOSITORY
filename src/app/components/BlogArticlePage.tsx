import { useParams, useNavigate, useOutletContext } from "react-router";
import { Breadcrumbs } from "./Breadcrumbs";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Tag,
  Share2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import {
  loadArticlesFromServer,
  getArticleTranslation,
  loadCategoriesFromServer,
  getCategoryTranslation,
} from "../lib/blogManager";
import type { BlogArticle, BlogCategory } from "../lib/blogManager";
import { marked } from "marked";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ReadingProgress } from "./ReadingProgress";
import { TableOfContents } from "./TableOfContents";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getTranslation } from "../lib/translations";
import { toast } from "sonner";

interface OutletContext {
  language?: string;
  onNavigate?: (page: string, data?: unknown) => void;
}

// Module-level cache so navigating back to an article skips the API call
let articlesCache: { articles: BlogArticle[]; categories: BlogCategory[]; ts: number } | null = null;
const ARTICLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function renderMarkdown(content: string): string {
  const html = marked(content) as string;
  return html.replace(/<h([1-3])>([^<]+)<\/h[1-3]>/g, (_, level, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { language: lang = "en" } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const t = getTranslation(lang);
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [allArticles, setAllArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let arts: BlogArticle[];
        let cats: BlogCategory[];

        if (articlesCache && Date.now() - articlesCache.ts < ARTICLES_CACHE_TTL) {
          arts = articlesCache.articles;
          cats = articlesCache.categories;
        } else {
          [arts, cats] = await Promise.all([
            loadArticlesFromServer(projectId, publicAnonKey),
            loadCategoriesFromServer(projectId, publicAnonKey),
          ]);
          articlesCache = { articles: arts, categories: cats, ts: Date.now() };
        }

        const published = arts.filter((a) => a.isPublished);
        setAllArticles(published);
        setCategories(cats);
        const found = published.find((a) => a.slug === slug);
        setArticle(found || null);
      } catch {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [slug]);

  const translation = article ? getArticleTranslation(article, lang) : null;

  const category = article
    ? categories.find((c) => c.id === article.category || c.slug === article.category)
    : null;

  const categoryName = category
    ? getCategoryTranslation(category, lang).name
    : article?.category || "Guide";

  // Related: same category first, then shared tags, max 3
  const relatedArticles = article
    ? allArticles
        .filter((a) => a.slug !== article.slug)
        .map((a) => {
          const sameCategory = a.category === article.category ? 10 : 0;
          const sharedTags = article.tags.filter((t) => a.tags.includes(t)).length;
          return { article: a, score: sameCategory + sharedTags };
        })
        .filter((x) => x.score > 0 || allArticles.length <= 4)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.article)
    : [];

  // Prev / next in publish order
  const sortedArticles = [...allArticles].sort(
    (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  const currentIndex = article ? sortedArticles.findIndex((a) => a.slug === article.slug) : -1;
  const prevArticle = currentIndex < sortedArticles.length - 1 ? sortedArticles[currentIndex + 1] : null;
  const nextArticle = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `${translation?.title || "Check out this article"} — ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // --- loading ---
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t.blog.loadingArticle}</p>
        </div>
      </div>
    );
  }

  // --- not found ---
  if (!article || !translation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-2xl font-bold">{t.blog.articleNotFound}</h1>
        <p className="text-muted-foreground">{t.blog.articleNotFoundDesc}</p>
        <Button onClick={() => navigate("/travel-guide")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.blog.backToBlog}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <ReadingProgress />

      {/* SEO */}
      <Helmet>
        <title>{translation.title} — Hop On Sintra Blog</title>
        <meta name="description" content={translation.excerpt || translation.content.substring(0, 155)} />
        <meta name="keywords" content={article.seoKeywords || article.tags?.join(", ")} />
        <link rel="canonical" href={`https://www.hoponsintra.com/travel-guide/${article.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.hoponsintra.com/travel-guide/${article.slug}`} />
        <meta property="og:title" content={translation.title} />
        <meta property="og:description" content={translation.excerpt || translation.content.substring(0, 155)} />
        <meta property="og:image" content={article.featuredImage || article.heroImage || ""} />
        <meta property="article:published_time" content={article.publishDate} />
        <meta property="article:author" content={article.author} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={translation.title} />
        <meta name="twitter:description" content={translation.excerpt || translation.content.substring(0, 155)} />
        <meta name="twitter:image" content={article.featuredImage || article.heroImage || ""} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
      </Helmet>

      {/* Breadcrumb nav */}
      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Travel Guide", href: "/travel-guide" },
            { label: translation.title, href: `/travel-guide/${article.slug || article.id}` },
          ]} />
        </div>
      </div>

      {/* Hero */}
      {(article.featuredImage || article.heroImage) && (
        <section className="relative h-[45vh] min-h-[280px] overflow-hidden">
          <ImageWithFallback
            src={article.featuredImage || article.heroImage || ""}
            alt={translation.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <div className="mx-auto max-w-4xl">
              <Badge className="mb-3 bg-accent text-white">{categoryName}</Badge>
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                {translation.title}
              </h1>
            </div>
          </div>
        </section>
      )}

      {/* Article */}
      <article className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title (shown when no hero image) */}
          {!article.featuredImage && !article.heroImage && (
            <div className="mx-auto mb-8 max-w-4xl">
              <Badge className="mb-3">{categoryName}</Badge>
              <h1 className="text-3xl font-bold leading-tight md:text-4xl">{translation.title}</h1>
            </div>
          )}

          <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
            {/* Main content */}
            <div className="min-w-0 flex-1 lg:max-w-3xl">
              {/* Meta row */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {article.author}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(article.publishDate)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {article.readTimeMinutes} {t.blog.minRead}
                  </div>
                </div>
                {/* Share buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    {copied ? t.blog.copied : t.blog.copyLink}
                  </button>
                  <button
                    onClick={handleWhatsAppShare}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-4 py-2.5 text-sm text-green-700 hover:bg-green-100 transition-colors"
                    title="Share on WhatsApp"
                  >
                    <Share2 className="h-4 w-4" />
                    {t.blog.share}
                  </button>
                </div>
              </div>

              {/* Excerpt */}
              {translation.excerpt && (
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  {translation.excerpt}
                </p>
              )}

              {/* Body */}
              <div
                className="prose prose-article max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(translation.content) }}
              />

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-10 border-t border-border pt-6">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">{t.blog.tagged}</p>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => navigate(`/travel-guide?tag=${encodeURIComponent(tag)}`)}
                        className="flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prev / Next */}
              {(prevArticle || nextArticle) && (
                <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
                  {prevArticle ? (
                    <button
                      onClick={() => navigate(`/travel-guide/${prevArticle.slug}`)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-left transition-all hover:border-primary hover:shadow-md"
                    >
                      <ChevronLeft className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-muted-foreground">{t.blog.previousArticle}</p>
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {getArticleTranslation(prevArticle, lang).title}
                        </p>
                      </div>
                    </button>
                  ) : <div />}

                  {nextArticle ? (
                    <button
                      onClick={() => navigate(`/travel-guide/${nextArticle.slug}`)}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-right transition-all hover:border-primary hover:shadow-md sm:flex-row-reverse"
                    >
                      <ChevronRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-muted-foreground">{t.blog.nextArticle}</p>
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {getArticleTranslation(nextArticle, lang).title}
                        </p>
                      </div>
                    </button>
                  ) : <div />}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-72 lg:flex-shrink-0">
              <div className="space-y-6 lg:sticky lg:top-6">
                {/* Table of Contents */}
                <TableOfContents content={translation.content} language={lang} />

                {/* Related articles */}
                {relatedArticles.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-base font-semibold text-foreground">{t.blog.relatedGuides}</h2>
                    <div className="space-y-3">
                      {relatedArticles.map((rel) => {
                        const relT = getArticleTranslation(rel, lang);
                        const relCat = categories.find((c) => c.id === rel.category || c.slug === rel.category);
                        const relCatName = relCat ? getCategoryTranslation(relCat, lang).name : rel.category;
                        const relImage = rel.thumbnailImage || rel.featuredImage || rel.heroImage;
                        return (
                          <button
                            key={rel.slug}
                            onClick={() => navigate(`/travel-guide/${rel.slug}`)}
                            className="group flex w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-white text-left shadow-sm transition-shadow hover:shadow-md"
                          >
                            {relImage && (
                              <div className="w-28 shrink-0 overflow-hidden">
                                <ImageWithFallback
                                  src={relImage}
                                  alt={relT.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            )}
                            <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                              <div>
                                <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                                  {relT.title}
                                </p>
                                {relT.excerpt && (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                    {relT.excerpt}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2.5 flex items-center gap-2 text-sm">
                                {rel.readTimeMinutes && (
                                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                    {rel.readTimeMinutes} min
                                  </span>
                                )}
                                {relCatName && (
                                  <span className="truncate text-xs text-muted-foreground">· {relCatName}</span>
                                )}
                                <span className="ml-auto shrink-0 whitespace-nowrap inline-flex items-center gap-0.5 text-sm font-medium text-primary">
                                  {t.blog.readGuide} <ChevronRight className="h-3.5 w-3.5" />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}
