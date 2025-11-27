import { getPublishedArticles } from './blogManager';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

export function generateSitemap(): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://www.hoponsintra.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/attractions', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/buy-ticket', changefreq: 'daily', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/about', changefreq: 'monthly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/blog', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/private-tours', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/sunset-special', changefreq: 'weekly', priority: '0.8', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/request-pickup', changefreq: 'weekly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/manage-booking', changefreq: 'weekly', priority: '0.6', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3', lastmod: new Date().toISOString().split('T')[0] },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Attraction pages
  const attractions = [
    'pena-palace',
    'quinta-regaleira',
    'moorish-castle',
    'monserrate-palace',
    'sintra-palace',
    'convento-capuchos',
    'cabo-da-roca',
    'villa-sassetti',
  ];

  attractions.forEach(attraction => {
    urls.push({
      loc: `${baseUrl}/${attraction}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    });
  });

  // Blog articles
  const articles = getPublishedArticles();
  articles.forEach(article => {
    urls.push({
      loc: `${baseUrl}/blog/${article.slug}`,
      lastmod: article.lastModified,
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  // Generate XML
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(url => 
      '  <url>\n' +
      '    <loc>' + url.loc + '</loc>\n' +
      '    <lastmod>' + url.lastmod + '</lastmod>\n' +
      '    <changefreq>' + url.changefreq + '</changefreq>\n' +
      '    <priority>' + url.priority + '</priority>\n' +
      '  </url>'
    ).join('\n') + '\n' +
    '</urlset>';

  return xml;
}

export function downloadSitemap(): void {
  const xml = generateSitemap();
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate robots.txt content
export function generateRobotsTxt(): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://www.hoponsintra.com';
  
  return `User-agent: *
Allow: /
Disallow: /admin
Disallow: /analytics
Disallow: /operations
Disallow: /diagnostics

Sitemap: ${baseUrl}/sitemap.xml`;
}

export function downloadRobotsTxt(): void {
  const txt = generateRobotsTxt();
  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'robots.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}