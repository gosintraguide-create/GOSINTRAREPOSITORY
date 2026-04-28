# Sitemap 404 Fix - Deploy Instructions

## What Was Fixed

1. ✅ **Updated Vercel config** (`/vercel.json`):
   - Added explicit routes for sitemap.xml and robots.txt
   - Added cleanUrls and trailingSlash settings
   - Ensures static files are served correctly

2. ✅ **Updated Vite config** (`/vite.config.ts`):
   - Added custom plugin to explicitly copy sitemap.xml to dist folder
   - Guarantees sitemap is in the build output

3. ✅ **Sitemap generation**:
   - Already configured to run before every build (prebuild script)
   - Generates fresh sitemap with current date

## Deploy Now

### Option 1: Git Push (Recommended)
```bash
git add .
git commit -m "Fix sitemap.xml 404 - update Vercel and Vite configs"
git push
```

### Option 2: Vercel CLI
```bash
vercel --prod
```

### Option 3: Vercel Dashboard
1. Go to your Vercel dashboard
2. Find the hoponsintra project
3. Go to "Deployments"
4. Click on the latest deployment
5. Click "..." → "Redeploy"
6. ✅ Check "Use existing Build Cache" is **UNCHECKED** (important!)

## After Deployment

### Test the Sitemap:
```bash
# Should return XML content (not 404)
curl -I https://www.hoponsintra.com/sitemap.xml

# Should show Content-Type: application/xml
# Should show Status: 200 OK
```

Or simply visit in browser:
- https://www.hoponsintra.com/sitemap.xml

### Verify Build Logs:
Look for these messages in Vercel build logs:
1. ✅ `Sitemap generated successfully!` (from prebuild script)
2. ✅ `Sitemap copied to dist/sitemap.xml` (from Vite plugin)

### Submit to Search Engines:
Once working, submit to:
- **Google Search Console**: https://search.google.com/search-console
- **Bing Webmaster Tools**: https://www.bing.com/webmasters

## Troubleshooting

### If Still 404 After Deploy:

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Project → Logs
   - Look for any errors during build

2. **Verify dist folder structure:**
   In Vercel deployment logs, look for:
   ```
   dist/
   ├── index.html
   ├── sitemap.xml  ← Should be here
   ├── robots.txt
   ├── manifest.json
   └── assets/
   ```

3. **Clear Vercel Cache:**
   - Project Settings → General
   - Scroll to "Build & Development Settings"
   - Clear cache and redeploy

4. **Check build output:**
   Look for "Copying files from public directory" in build logs

## Why This Fixes It

**The Problem:**
- Vercel was not properly serving static files from the build output
- The sitemap was in /public but not being copied to /dist correctly

**The Solution:**
- Explicit routes in vercel.json tell Vercel to serve sitemap.xml as-is
- Custom Vite plugin ensures sitemap.xml is definitely in dist folder
- Prebuild script generates fresh sitemap every time

**Result:**
- Sitemap is generated → copied to dist → served by Vercel ✅
