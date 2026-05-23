import { useParams, useNavigate, useOutletContext } from "react-router";
import { Breadcrumbs } from "./Breadcrumbs";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
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
          const sharedTags = article.tags.filter((tag) => a.tags.includes(tag)).length;
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

  // TOC eligibility: >= 1500 words AND >= 5 headings
  const wordCount = translation.content.trim().split(/\s+/).length;
  const headingCount = (translation.content.match(/^#{1,3}\s/gm) || []).length;
  const showTOC = wordCount >= 1500 && headingCount >= 5;

  const hasHero = !!(article.featuredImage || article.heroImage);

  // Shared column style: 680px centered, 20px side padding on all viewports
  const columnStyle: React.CSSProperties = {
    maxWidth: "680px",
    margin: "0 auto",
    padding: "0 20px",
    boxSizing: "border-box",
  };

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
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": translation.title,
          "description": translation.excerpt || translation.content.substring(0, 155),
          "datePublished": article.publishDate,
          "dateModified": article.publishDate,
          "author": { "@type": "Organization", "name": "Hop On Sintra" },
          "publisher": {
            "@type": "Organization",
            "name": "Hop On Sintra",
            "url": "https://www.hoponsintra.com",
            "logo": { "@type": "ImageObject", "url": "https://www.hoponsintra.com/logo.png" }
          },
          "image": article.featuredImage || article.heroImage || undefined,
          "url": `https://www.hoponsintra.com/travel-guide/${article.slug}`,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://www.hoponsintra.com/travel-guide/${article.slug}`
          }
        })}</script>
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

      {/* ── Hero — full-width image, no text overlay (Fix 2 / Option A) ── */}
      {hasHero && (
        <div className="overflow-hidden h-[220px] md:h-[45vh] md:max-h-[480px]">
          <ImageWithFallback
            src={article.featuredImage || article.heroImage || ""}
            alt={translation.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ── Article — single 680px centered column ── */}
      <article style={{ padding: "40px 0 64px" }}>
        <div style={columnStyle}>

          {/* Fix 7 — Category badge + Fix 2 Option A — title below hero */}
          <div style={{ marginBottom: "24px" }}>
            <span style={{
              display: "inline-block",
              background: "#f0ebe0",
              color: "#a08050",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase" as const,
              letterSpacing: "1px",
              padding: "4px 12px",
              borderRadius: "20px",
              marginBottom: "14px",
            }}>
              {categoryName}
            </span>
            <h1 style={{
              fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: 1.2,
              margin: 0,
            }}>
              {translation.title}
            </h1>
          </div>

          {/* Fix 3 — Simplified meta bar: author · date · read time only */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "#888",
            marginBottom: "32px",
            paddingBottom: "24px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}>
            <span>{article.author}</span>
            <span style={{ color: "#ccc" }}>·</span>
            <span>{formatDate(article.publishDate)}</span>
            <span style={{ color: "#ccc" }}>·</span>
            <span>{article.readTimeMinutes} {t.blog.minRead}</span>
          </div>

          {/* Fix 4 — Inline TOC for long articles only */}
          {showTOC && (
            <TableOfContents content={translation.content} language={lang} inline />
          )}

          {/* Excerpt */}
          {translation.excerpt && (
            <p style={{
              fontSize: "1.125rem",
              lineHeight: 1.75,
              color: "#555",
              marginBottom: "32px",
            }}>
              {translation.excerpt}
            </p>
          )}

          {/* Fix 1 + 6 — Article body, constrained by column width */}
          <div
            className="prose prose-article max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(translation.content) }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>
                {t.blog.tagged}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
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

        {/* Related articles — slightly wider container below the column */}
        {relatedArticles.length > 0 && (
          <div style={{
            maxWidth: "900px",
            margin: "48px auto 0",
            padding: "40px 20px 0",
            borderTop: "1px solid rgba(0,0,0,0.08)",
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a1a", marginBottom: "20px" }}>
              {t.blog.relatedGuides}
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
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
      </article>
    </div>
  );
}
