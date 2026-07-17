# Sitemap Generation Setup

## ⚠️ UPDATE: November 28, 2024

**This file has been superseded by newer documentation.**

For current sitemap information, see:
- **Quick Start:** `/SITEMAP_QUICK_START.md` 
- **Full Guide:** `/SITEMAP_VERIFICATION.md`
- **Deployment:** `/DEPLOYMENT_CHECKLIST.md`
- **Summary:** `/SITEMAP_FIX_SUMMARY.md`

---

## Overview (Historical)
This project includes automatic sitemap generation that runs before every build. The sitemap is generated as a static file at `/public/sitemap.xml` that search engines can access.

## Current Status (Updated)

### ✅ What's Working Now
- **Total URLs:** 23 pages
- **Auto-generation:** Runs on every build
- **Current date:** 2024-11-28 (updates automatically)
- **Format:** Valid XML with proper schema
- **Headers:** Optimized for Google crawling
- **Testing:** Built-in test page at `/sitemap-test.html`

### 📊 What's Included
1. **12 Main Pages** (including newly added route-map)
2. **8 Attraction Pages** (all Sintra attractions)
3. **3 Blog Articles** (default articles)

## Files Created/Modified

### 1. `/scripts/generate-sitemap.cjs` ✅ UPDATED
- **Purpose**: CommonJS Node.js script that generates complete sitemap.xml
- **Format**: .cjs extension for Vercel compatibility
- **When it runs**: Automatically before each build via `prebuild` script
- **Updates**: 
  - ✅ Added route-map page
  - ✅ Proper XML schema declarations
  - ✅ All 23 URLs included

### 2. `/public/sitemap.xml` ✅ REGENERATED
- **Status**: Completely rebuilt from scratch
- **Date**: 2024-11-28 (current)
- **URLs**: 23 total
- **Format**: Valid XML with schema validation
- **Quality**: Optimized for Google Search Console

### 3. `/vercel.json` ✅ OPTIMIZED
- **Updates**: 
  - Proper Content-Type headers (application/xml)
  - Cache-Control optimization
  - Static file serving configuration
  - X-Content-Type-Options security header

### 4. `/public/sitemap-test.html` ✅ NEW
- **Purpose**: Interactive testing tool
- **Features**:
  - Test sitemap accessibility
  - Verify URL count
  - Check XML validity
  - View HTTP headers
  - Preview content

### 5. `/package.json` ✅ UNCHANGED
- **Script**: `"prebuild": "node scripts/generate-sitemap.cjs"`
- **Build flow**: Build → prebuild → generate sitemap → compile → bundle

### 6. `/public/robots.txt` ✅ VERIFIED
- **Status**: Correctly references sitemap
- **URL**: `https://www.hoponsintra.com/sitemap.xml`

## How It Works

### During Development
```bash
# Manual generation (if needed)
node scripts/generate-sitemap.cjs
```

### During Build
```bash
npm run build
```
This will:
1. Run `prebuild` → generates fresh sitemap.xml with current date
2. Compile TypeScript
3. Build the app with Vite
4. Include sitemap.xml in dist folder

### On Deployment (Vercel)
1. Vercel runs `npm run build` automatically
2. Fresh sitemap generated with current date
3. Sitemap available at `/sitemap.xml`
4. Google can fetch and index

## Verification

### Quick Test
```bash
curl https://www.hoponsintra.com/sitemap.xml
```

### Interactive Test
Visit: https://www.hoponsintra.com/sitemap-test.html

### Google Search Console
1. Go to: https://search.google.com/search-console
2. Submit: `sitemap.xml`
3. Verify: Status shows "Success", 23 URLs discovered

## SEO Configuration

### Priorities
- **1.0**: Homepage (highest)
- **0.9**: Buy Ticket, Attractions, Blog, Private Tours
- **0.8**: Individual attraction pages, Sunset Special
- **0.7**: Route Map, Request Pickup, About, Blog articles
- **0.6**: Manage Booking
- **0.3**: Privacy Policy, Terms of Service (lowest)

### Change Frequencies
- **Daily**: Homepage, Buy Ticket
- **Weekly**: Main pages, Booking pages
- **Monthly**: Attractions, Blog articles, About
- **Yearly**: Legal pages

## Troubleshooting

### Issue: Sitemap shows 404
**Solution:** Rebuild and redeploy
```bash
npm run build
```

### Issue: Old date showing
**Solution:** Build automatically updates the date
```bash
npm run build
```

### Issue: Google can't fetch
**Solutions:**
1. Verify sitemap accessible in browser
2. Check Vercel deployment completed
3. Clear browser cache
4. Wait 10 minutes and retry

### Issue: Wrong URL count
**Check:** `/scripts/generate-sitemap.cjs`
- Should have 12 static routes
- Should have 8 attractions
- Should have 3 blog articles
- Total = 23 URLs

## Latest Documentation

For the most current and comprehensive information:

📖 **Quick Reference:** `/SITEMAP_QUICK_START.md`
📖 **Full Guide:** `/SITEMAP_VERIFICATION.md`
📖 **Deploy Guide:** `/DEPLOYMENT_CHECKLIST.md`
📖 **Summary:** `/SITEMAP_FIX_SUMMARY.md`

## Status

- **Last Updated:** November 28, 2024
- **Version:** 2.0 (Complete Rebuild)
- **Status:** ✅ Production Ready
- **Google Status:** Ready for submission

---

**Note:** This setup is now complete and optimized. The sitemap will automatically update on every build with the current date and all 23 URLs.
