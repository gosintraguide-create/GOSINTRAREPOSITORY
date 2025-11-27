// scripts/generate-sitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.hoponsintra.com';

// 1. Define your Static Routes
const staticRoutes = [
  '',
  '/attractions',
  '/buy-ticket',
  '/about',
  '/blog',
  '/private-tours',
  '/sunset-special',
  '/request-pickup',
  '/manage-booking',
  '/privacy-policy',
  '/terms-of-service',
];

// 2. Define your Attractions (from content)
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

// 3. Define Default Blog Articles (Manually copied from defaults since we can't access localStorage here)
const articles = [
  'getting-to-sintra-from-lisbon',
  'planning-perfect-day-sintra',
  'sintra-on-budget'
];

const generateSitemap = () => {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add Static Pages
  staticRoutes.forEach(route => {
    // Set priority based on page importance
    let priority = '0.7';
    let changefreq = 'weekly';
    
    if (route === '') {
      priority = '1.0';
      changefreq = 'daily';
    } else if (route === '/buy-ticket') {
      priority = '0.9';
      changefreq = 'daily';
    } else if (route === '/attractions' || route === '/blog' || route === '/private-tours') {
      priority = '0.9';
      changefreq = 'weekly';
    } else if (route === '/sunset-special') {
      priority = '0.8';
      changefreq = 'weekly';
    } else if (route === '/manage-booking') {
      priority = '0.6';
      changefreq = 'weekly';
    } else if (route === '/privacy-policy' || route === '/terms-of-service') {
      priority = '0.3';
      changefreq = 'yearly';
    } else if (route === '/about') {
      priority = '0.7';
      changefreq = 'monthly';
    }
    
    xml += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  // Add Attractions
  attractions.forEach(slug => {
    xml += `
  <url>
    <loc>${BASE_URL}/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // Add Blog Articles
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

  return xml;
};

// Write to public/sitemap.xml
const publicDir = path.resolve(__dirname, '../public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

// Ensure public dir exists
if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

fs.writeFileSync(sitemapPath, generateSitemap());
console.log(`✅ Sitemap generated at ${sitemapPath}`);
