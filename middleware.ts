/**
 * Vercel Edge Middleware — Social Media OG Tag Injector
 *
 * Problem: WhatsApp, Facebook, Twitter and similar scrapers do not execute
 * JavaScript. They read the raw HTML. For a React SPA, that means they always
 * see the generic index.html OG tags (wrong title, wrong image, wrong URL).
 *
 * Solution: When the incoming User-Agent looks like a social media bot and the
 * URL is a private tour or travel guide article, fetch the real data from the
 * Supabase API and return a tiny HTML page with the correct OG tags.
 * Regular visitors are completely unaffected — the middleware returns nothing
 * and Vercel continues its normal routing (serving the prerendered SPA page).
 */

const SITE_URL = 'https://www.hoponsintra.com';
const SUPABASE_API = 'https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8';

// Public anon key — safe to include (same key shipped in the browser bundle)
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6' +
  'ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.' +
  'cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop&q=80';

/** Social media crawler User-Agent patterns */
const SOCIAL_BOT_RE =
  /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Snapchat|vkShare|W3C_Validator/i;

export const config = {
  matcher: ['/private-tours/:path+', '/travel-guide/:path+'],
};

export default async function middleware(request: Request): Promise<Response | void> {
  const ua = request.headers.get('user-agent') ?? '';

  // Only intercept recognised social media bots
  if (!SOCIAL_BOT_RE.test(ua)) return;

  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\//, '').split('/');

  try {
    // ── Private tour detail page ────────────────────────────────────────────
    if (parts[0] === 'private-tours' && parts[1]) {
      const tourId = parts[1];

      const res = await fetch(`${SUPABASE_API}/private-tours`, {
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      });

      if (res.ok) {
        const data = await res.json();
        const tour = (data.tours ?? []).find(
          (t: any) => t.id === tourId && t.published !== false,
        );

        if (tour) {
          return ogResponse({
            title: `${tour.title} | Private Tours Sintra – Go Sintra`,
            description: tour.description ?? '',
            image: tour.heroImage || DEFAULT_IMAGE,
            url: `${SITE_URL}/private-tours/${tour.id}`,
          });
        }
      }
    }

    // ── Travel guide / blog article page ────────────────────────────────────
    if (parts[0] === 'travel-guide' && parts[1]) {
      const slug = parts[1];

      const res = await fetch(`${SUPABASE_API}/blog-articles`, {
        headers: { Authorization: `Bearer ${ANON_KEY}` },
      });

      if (res.ok) {
        const data = await res.json();
        const articles: any[] = Array.isArray(data) ? data : (data.articles ?? []);
        const article = articles.find(
          (a: any) => (a.slug === slug || a.id === slug) && a.isPublished !== false,
        );

        if (article) {
          const title =
            article.translations?.en?.title ||
            article.translations?.pt?.title ||
            article.title ||
            'Travel Guide';
          const description =
            article.translations?.en?.excerpt ||
            article.translations?.pt?.excerpt ||
            article.excerpt ||
            '';
          const image =
            article.featuredImage || article.heroImage || article.thumbnailImage || DEFAULT_IMAGE;

          return ogResponse({
            title: `${title} | Go Sintra Travel Guide`,
            description,
            image,
            url: `${SITE_URL}/travel-guide/${slug}`,
          });
        }
      }
    }
  } catch {
    // API call failed — fall through so Vercel serves the SPA normally.
    // The scraper will get generic tags, but at least the page loads.
  }

  // No match or API error — pass through to normal Vercel routing
  return;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ogResponse(data: OgData): Response {
  const t = esc(data.title);
  const d = esc(data.description);
  const u = esc(data.url);
  const img = data.image.replace(/&/g, '&amp;');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Go Sintra" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${u}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />
  <meta http-equiv="refresh" content="0;url=${u}" />
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <p><a href="${u}">View on Go Sintra</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
}
