# Deploy Sitemap Fix

## Current Status
✅ Sitemap generation script created at `/scripts/generate-sitemap.js`  
✅ Package.json updated with `prebuild` script  
✅ Fresh sitemap.xml generated in `/public/sitemap.xml`  
✅ Vite config already set to preserve sitemap.xml filename  
✅ Vercel config already set to serve sitemap.xml with proper headers  

## Why the 404 is happening
The sitemap.xml file exists locally but hasn't been deployed to Vercel yet. You need to commit and push these changes to trigger a new Vercel deployment.

## How to Fix (Deploy the Sitemap)

### Option 1: Automatic (Recommended)
If your repository is connected to Vercel and auto-deploys on push:

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Add automatic sitemap generation"
   git push
   ```

2. **Wait for Vercel to deploy** (usually 1-2 minutes)

3. **Verify it works:**
   - Visit: https://www.hoponsintra.com/sitemap.xml
   - Should show XML with all pages

### Option 2: Manual Build (Local Testing)
To test the sitemap generation locally before deploying:

```bash
npm run build
```

This will:
1. Run the prebuild script
2. Generate a fresh sitemap.xml in /public/
3. Build the app
4. Copy sitemap.xml to /dist/

Then check `/dist/sitemap.xml` to verify it was created correctly.

### Option 3: Vercel CLI
If you use the Vercel CLI:

```bash
vercel --prod
```

## What Happens on Each Build

Every time Vercel builds your site:
1. Runs `npm run build`
2. Which runs `npm run prebuild` first
3. Which executes `node scripts/generate-sitemap.js`
4. Sitemap is generated with today's date
5. Vite copies it from `/public/` to `/dist/`
6. Vercel deploys `/dist/` to production

## Verification Checklist

After deployment, verify:
- [ ] https://www.hoponsintra.com/sitemap.xml returns XML (not 404)
- [ ] https://www.hoponsintra.com/robots.txt points to the sitemap
- [ ] All 22 URLs are present in the sitemap
- [ ] Date is current (2024-11-27 or later)

## Submit to Google

Once the sitemap is live:
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property (hoponsintra.com)
3. Go to Sitemaps (in the left sidebar)
4. Enter: `sitemap.xml`
5. Click Submit

Google will start crawling your pages within a few days.

## Troubleshooting

**If sitemap.xml still shows 404 after deployment:**
1. Check Vercel deployment logs for errors
2. Look for "✅ Sitemap generated" message in build logs
3. Verify `/dist/sitemap.xml` exists in the deployed files
4. Check that Vercel isn't filtering XML files

**If you need to regenerate manually:**
```bash
node scripts/generate-sitemap.js
```

Then commit and push the updated file.
