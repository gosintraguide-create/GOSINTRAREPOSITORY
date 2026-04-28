# Sitemap 404 Fix Guide

## Current Status
- ✅ `sitemap.xml` exists at `/public/sitemap.xml`
- ✅ Vercel config correctly excludes sitemap from rewrites
- ✅ Vite config properly copies public folder files
- ✅ Sitemap has proper XML structure with all pages

## Why You're Getting 404

The sitemap exists in your code but **hasn't been deployed to production yet**. You need to:

### Solution 1: Trigger a New Deployment

1. **Push any change to trigger rebuild:**
   ```bash
   git add .
   git commit -m "Update sitemap.xml with current date"
   git push
   ```

2. **Or trigger manual redeploy in Vercel:**
   - Go to your Vercel dashboard
   - Find your hoponsintra project
   - Click "Deployments"
   - Click "..." on latest deployment → "Redeploy"

### Solution 2: Update the Sitemap First

Before deploying, update the lastmod date in the sitemap:

The current sitemap has `2024-11-28` dates, but today is `2025-11-29`. 

Update `/public/sitemap.xml` to reflect current date for better SEO.

## Verification

After deployment, verify:

1. **Check sitemap is accessible:**
   - Visit: https://www.hoponsintra.com/sitemap.xml
   - Should display XML content

2. **Submit to Google:**
   - Go to Google Search Console
   - Submit sitemap URL: https://www.hoponsintra.com/sitemap.xml

3. **Check robots.txt references it:**
   - Visit: https://www.hoponsintra.com/robots.txt
   - Should contain: `Sitemap: https://www.hoponsintra.com/sitemap.xml`

## Build Verification (Local)

To verify locally before deploying:

```bash
# Build the project
npm run build

# Check dist folder contains sitemap
ls dist/sitemap.xml

# Should output: dist/sitemap.xml

# Serve the build locally
npm run preview

# Then visit: http://localhost:4173/sitemap.xml
```

## Common Issues

### If sitemap still shows 404 after deployment:

1. **Clear Vercel cache:**
   - Vercel Dashboard → Project Settings → Clear Cache
   - Redeploy

2. **Check build logs:**
   - Look for errors during "Copying public files"
   - Verify sitemap.xml is listed as copied

3. **Verify dist folder structure:**
   - After build, sitemap should be at `/dist/sitemap.xml` (root level)
   - NOT in `/dist/assets/sitemap.xml`

## Next Steps

1. ✅ Update sitemap dates to 2025-11-29
2. ✅ Commit and push changes
3. ✅ Wait for deployment to complete
4. ✅ Test https://www.hoponsintra.com/sitemap.xml
5. ✅ Submit to Google Search Console
