import { getPublishedArticles } from './blogManager';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { loadComprehensiveContent } from './comprehensiveContent';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}

interface PrivateTour {
  id: string;
  title: string;
  published: boolean;
}

// Fetch published private tours
async function getPublishedPrivateTours(): Promise<PrivateTour[]> {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/private-tours`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return (data.tours || []).filter((tour: PrivateTour) => tour.published);
    }
  } catch (error) {
    console.error('Error fetching private tours for sitemap:', error);
  }
  return [];
}

export async function generateSitemap(): Promise<string> {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://www.hoponsintra.com';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { path: '/', changefreq: 'daily', priority: '1.0', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/hop-on-service', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/attractions', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/private-tours', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/blog', changefreq: 'weekly', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/about', changefreq: 'monthly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/route-map', changefreq: 'monthly', priority: '0.7', lastmod: new Date().toISOString().split('T')[0] },
    { path: '/live-chat', changefreq: 'monthly', priority: '0.6', lastmod: new Date().toISOString().split('T')[0] },
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: page.lastmod,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Dynamically load attraction detail pages from comprehensive content
  try {
    const content = await loadComprehensiveContent();
    const attractions = content?.attractions?.list || [];
    
    attractions.forEach((attraction: any) => {
      // Generate slug from attraction name
      const slug = attraction.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      urls.push({
        loc: `${baseUrl}/attractions/${slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.8',
      });
    });
  } catch (error) {
    console.error('Error loading attractions for sitemap:', error);
  }

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

  // Private tours
  const privateTours = await getPublishedPrivateTours();
  privateTours.forEach(tour => {
    urls.push({
      loc: `${baseUrl}/private-tours/${tour.id}`,
      lastmod: new Date().toISOString().split('T')[0],
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

export async function downloadSitemap(): Promise<void> {
  const xml = await generateSitemap();
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
Disallow: /driver
Disallow: /buy-ticket
Disallow: /404

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