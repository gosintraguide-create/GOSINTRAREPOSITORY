/**
 * Go Sintra — build-time prerenderer
 *
 * Runs after `vite build`. Starts a local file server pointing at dist/,
 * then visits each known route with a headless Chrome browser (puppeteer),
 * waits for content to fully load, and saves the rendered HTML as a static
 * index.html file inside dist/. Vercel serves those static files directly to
 * Googlebot without needing JavaScript.
 *
 * Private tour routes are fetched live from Supabase so newly published
 * tours are included automatically on each deploy.
 */

import { createServer }                            from 'http';
import { readFileSync, writeFileSync, mkdirSync,
         existsSync }                              from 'fs';
import { join, extname }                           from 'path';
import { fileURLToPath }                           from 'url';
import { dirname }                                 from 'path';
import chromium                                    from '@sparticuz/chromium';
import puppeteer                                   from 'puppeteer-core';

// ─── paths ───────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR  = join(__dirname, '..', 'dist');
const PORT      = 3999;
const BASE_URL  = `http://localhost:${PORT}`;

// ─── Supabase (public anon key — already shipped in the browser bundle) ───────
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6' +
  'ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.' +
  'cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo';
const BASE_API =
  'https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8';
const TOURS_API    = `${BASE_API}/private-tours`;
const ARTICLES_API = `${BASE_API}/blog-articles`;

// ─── MIME map for the local file server ──────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
};

// ─── Static routes — always pre-render these ─────────────────────────────────
// Attraction pages use bundled JSON locale data so they render instantly.
const STATIC_ROUTES = [
  '/',
  '/hop-on-service',
  '/attractions',
  '/private-tours',
  '/blog',
  '/about',
  '/route-map',
  '/attractions/pena-palace',
  '/attractions/quinta-regaleira',
  '/attractions/moorish-castle',
  '/attractions/monserrate-palace',
  '/attractions/sintra-palace',
  '/attractions/convento-capuchos',
  '/attractions/cabo-da-roca',
  '/attractions/villa-sassetti',
];

// ─── Fetch published private tour IDs from Supabase ──────────────────────────
async function getPrivateTourRoutes() {
  try {
    console.log('  Fetching published private tours from Supabase…');
    const res = await fetch(TOURS_API, {
      headers: {
        Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { tours = [] } = await res.json();
    const routes = tours
      .filter((t) => t.published)
      .map((t) => `/private-tours/${t.id}`);
    console.log(`  → ${routes.length} private tour page(s) found`);
    return routes;
  } catch (err) {
    console.warn(`  ⚠  Could not fetch private tours: ${err.message}`);
    return [];
  }
}

// ─── Fetch published blog article slugs from Supabase ────────────────────────
async function getBlogArticleRoutes() {
  try {
    console.log('  Fetching published blog articles from Supabase…');
    const res = await fetch(ARTICLES_API, {
      headers: {
        Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // API may return { articles: [...] } or a plain array
    const articles = Array.isArray(data) ? data : (data.articles || []);
    const routes = articles
      .filter((a) => a.isPublished !== false && a.status !== 'draft' && (a.slug || a.id))
      .map((a) => `/blog/${a.slug || a.id}`);
    console.log(`  → ${routes.length} blog article(s) found`);
    return routes;
  } catch (err) {
    console.warn(`  ⚠  Could not fetch blog articles: ${err.message}`);
    return [];
  }
}

// ─── Local static file server for dist/ ──────────────────────────────────────
function startServer() {
  const server = createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    const ext     = extname(urlPath);

    // Try candidates in order: exact file → index.html in dir → SPA fallback
    const candidates = ext
      ? [join(DIST_DIR, urlPath)]
      : [
          join(DIST_DIR, urlPath, 'index.html'),
          join(DIST_DIR, urlPath + '.html'),
          join(DIST_DIR, 'index.html'),
        ];

    for (const candidate of candidates) {
      try {
        const content = readFileSync(candidate);
        const fileExt = extname(candidate) || '.html';
        res.writeHead(200, { 'Content-Type': MIME[fileExt] || 'application/octet-stream' });
        res.end(content);
        return;
      } catch { /* try next */ }
    }

    // Absolute fallback — should never reach here
    res.writeHead(404);
    res.end('Not found');
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => resolve(server));
  });
}

// ─── Save HTML to the right place in dist/ ───────────────────────────────────
function saveHtml(route, html) {
  const subPath = route === '/' ? '' : route;
  const dir     = join(DIST_DIR, subPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🕷  Go Sintra prerenderer starting…\n');

  const [tourRoutes, blogRoutes] = await Promise.all([
    getPrivateTourRoutes(),
    getBlogArticleRoutes(),
  ]);
  const allRoutes = [...STATIC_ROUTES, ...tourRoutes, ...blogRoutes];

  console.log(`\n📄 Rendering ${allRoutes.length} pages\n`);

  const server = await startServer();

  // @sparticuz/chromium provides a statically-linked Chromium binary that
  // works in restricted Linux environments (Vercel build, Lambda, etc.)
  // without needing system libraries like libgbm or libnss3.
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args:            chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless:        chromium.headless,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Suppress app console noise during rendering
  page.on('console', () => {});
  page.on('pageerror', () => {});

  let ok = 0;
  let failed = 0;

  for (const route of allRoutes) {
    try {
      // waitUntil: 'networkidle0' — waits until no network activity for 500 ms.
      // This covers both instant (bundled data) and async (Supabase fetch) pages.
      await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'networkidle0',
        timeout: 30_000,
      });

      // For Supabase-backed detail pages wait for the <h1> (title) to appear
      // before capturing — ensures the async fetch has completed.
      const isSupabasePage =
        (route.startsWith('/private-tours/') && route !== '/private-tours') ||
        (route.startsWith('/blog/')          && route !== '/blog');
      if (isSupabasePage) {
        await page.waitForSelector('h1', { timeout: 8_000 }).catch(() => {});
      }

      const html = await page.content();
      saveHtml(route, html);
      console.log(`  ✅  ${route}`);
      ok++;
    } catch (err) {
      console.warn(`  ⚠   ${route} — ${err.message}`);
      failed++;
    }
  }

  await browser.close();
  server.close();

  const summary = `\n✅  Prerender complete: ${ok} succeeded` +
                  (failed ? `, ${failed} failed` : '') + '\n';
  console.log(summary);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\n❌  Prerender crashed:', err);
  process.exit(1);
});
