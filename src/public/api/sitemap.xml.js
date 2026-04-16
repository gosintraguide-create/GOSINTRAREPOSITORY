// Vercel Serverless Function to serve sitemap.xml
export default function handler(req, res) {
  const BASE_URL = 'https://www.hoponsintra.com';
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/attractions', priority: '0.9', changefreq: 'weekly' },
    { path: '/buy-ticket', priority: '0.9', changefreq: 'daily' },
    { path: '/blog', priority: '0.9', changefreq: 'weekly' },
    { path: '/private-tours', priority: '0.9', changefreq: 'weekly' },
    { path: '/sunset-special', priority: '0.8', changefreq: 'weekly' },
    { path: '/route-map', priority: '0.7', changefreq: 'monthly' },
    { path: '/request-pickup', priority: '0.7', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/manage-booking', priority: '0.6', changefreq: 'weekly' },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
  ];

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

  const articles = [
    'getting-to-sintra-from-lisbon',
    'planning-perfect-day-sintra',
    'sintra-on-budget'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static routes
  staticRoutes.forEach(({ path, priority, changefreq }) => {
    xml += `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  // Add attractions
  attractions.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // Add blog articles
  articles.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
