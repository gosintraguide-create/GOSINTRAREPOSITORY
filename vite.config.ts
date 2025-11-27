import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- FIX: Define __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- SITEMAP GENERATION LOGIC ---
const BASE_URL = 'https://www.hoponsintra.com';
const routes = [
  '', '/attractions', '/buy-ticket', '/about', '/blog', 
  '/private-tours', '/request-pickup', '/manage-booking', 
  '/privacy-policy', '/terms-of-service'
];
const attractions = [
  'pena-palace', 'quinta-regaleira', 'moorish-castle', 
  'monserrate-palace', 'sintra-palace', 'convento-capuchos', 
  'cabo-da-roca', 'villa-sassetti'
];
const articles = [
  'how-to-get-to-sintra', 'planning-your-perfect-day', 'pena-palace-complete-guide'
];

function generateSitemapXml() {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  routes.forEach(route => {
    xml += `\n  <url><loc>${BASE_URL}${route}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${route === '' ? '1.0' : '0.8'}</priority></url>`;
  });
  attractions.forEach(slug => {
    xml += `\n  <url><loc>${BASE_URL}/${slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`;
  });
  articles.forEach(slug => {
    xml += `\n  <url><loc>${BASE_URL}/blog/${slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
  });
  xml += `\n</urlset>`;
  return xml;
}

const sitemapPlugin = () => {
  return {
    name: 'sitemap-generator',
    buildStart() {
      try {
        // Ensure we are writing to the correct public directory
        const publicDir = path.resolve(__dirname, 'public');
        
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir);
        }
        
        const filePath = path.join(publicDir, 'sitemap.xml');
        fs.writeFileSync(filePath, generateSitemapXml());
        console.log(`✅ Sitemap generated at: ${filePath}`);
      } catch (error) {
        console.error('❌ Failed to generate sitemap:', error);
      }
    }
  }
};
// --------------------------------

export default defineConfig({
  plugins: [
    react(), 
    sitemapPlugin()
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'stripe@17.3.1': 'stripe',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'qrcode@1.5.4': 'qrcode',
      'pdf-lib@1.17.1': 'pdf-lib',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/e199cf49993f01cc569ec13ba6e57ba6c35fc3e2.png': path.resolve(__dirname, './src/assets/e199cf49993f01cc569ec13ba6e57ba6c35fc3e2.png'),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
      '@jsr/supabase__supabase-js@2': '@jsr/supabase__supabase-js',
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});