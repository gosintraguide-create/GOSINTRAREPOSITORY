# Sitemap Generation Setup

## Overview
This project now includes automatic sitemap generation that runs before every build. The sitemap is generated as a static file at `/public/sitemap.xml` that search engines can access.

## Files Created/Modified

### 1. `/scripts/generate-sitemap.cjs`
- **Purpose**: CommonJS Node.js script that generates a complete sitemap.xml file
- **Format**: .cjs extension for compatibility with Vercel build environment
- **When it runs**: Automatically before each build via the `prebuild` script
- **What it includes**:
  - All static pages (home, attractions, buy-ticket, about, blog, etc.)
  - All 8 attraction detail pages
  - Default blog articles (3 articles)
  - Proper priorities and change frequencies for SEO

### 2. `/package.json`
- **Modified**: Added `prebuild` script that runs the sitemap generator
- **Script**: `"prebuild": "node scripts/generate-sitemap.cjs"`
- **Build flow**: `npm run build` → runs `prebuild` → generates sitemap → compiles TypeScript → builds with Vite

### 3. `/public/robots.txt`
- **Already exists**: Points search engines to the sitemap location
- **URL**: `https://www.hoponsintra.com/sitemap.xml`

### 4. `/public/sitemap.xml`
- **Generated file**: Created automatically by the build script
- **Will be updated**: Every time you run `npm run build`

## How It Works

1. **During Development**: 
   - The sitemap is not regenerated automatically
   - You can manually run `node scripts/generate-sitemap.cjs` if needed

2. **During Build**:
   ```bash
   npm run build
   ```
   This will:
   - Run `prebuild` → generates fresh sitemap.xml
   - Compile TypeScript
   - Build the app with Vite
   - Include the sitemap.xml in the dist folder

3. **On Deployment**:
   - Vercel runs `npm run build` automatically
   - Fresh sitemap is generated with current date
   - Sitemap is available at `/sitemap.xml`

## Updating the Sitemap

### Adding New Pages
Edit `/scripts/generate-sitemap.cjs` and add the route to the `staticRoutes` array:

```javascript
const staticRoutes = [
  '',
  '/attractions',
  '/buy-ticket',
  '/new-page',  // Add here
  // ...
];
```

### Adding New Attractions
Add to the `attractions` array:

```javascript
const attractions = [
  'pena-palace',
  'new-attraction',  // Add here
  // ...
];
```

### Adding Blog Articles
Add to the `articles` array:

```javascript
const articles = [
  'getting-to-sintra-from-lisbon',
  'new-blog-article',  // Add here
  // ...
];
```

## SEO Benefits

✅ **Static File**: Search engines can access `/sitemap.xml` directly  
✅ **Always Fresh**: Regenerated on every build with current date  
✅ **Complete**: Includes all pages, attractions, and blog posts  
✅ **Proper Priorities**: Pages ranked by importance (1.0 for home, 0.9 for buy-ticket, etc.)  
✅ **Change Frequencies**: Tells search engines how often to check pages  
✅ **Google Console Ready**: Can be submitted directly to Google Search Console  

## Verification

After deployment, verify the sitemap is accessible:
- Visit: `https://www.hoponsintra.com/sitemap.xml`
- Should see XML with all your pages listed
- Submit to Google Search Console: https://search.google.com/search-console

## Manual Generation

To generate the sitemap manually without building:
```bash
node scripts/generate-sitemap.cjs
```

This creates/updates `/public/sitemap.xml` immediately.

## Why .cjs Extension?

The script uses `.cjs` (CommonJS) extension instead of `.js` to ensure compatibility with Vercel's build environment. Even though the project uses `"type": "module"` in package.json, the build script needs to run reliably across different Node.js versions and environments.
