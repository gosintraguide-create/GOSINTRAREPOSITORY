# Sitemap 404 Troubleshooting Guide

## Current Situation
- ✅ `/public/sitemap.xml` exists locally (verified)
- ✅ `/scripts/generate-sitemap.cjs` script exists
- ✅ `package.json` has `prebuild` script configured
- ✅ `vercel.json` has proper rewrite rules to NOT rewrite sitemap.xml
- ✅ `vite.config.ts` has `publicDir: "public"` configured
- ✅ `.gitignore` created (does NOT ignore sitemap.xml)
- ❌ `https://www.hoponsintra.com/sitemap.xml` returns 404

## Why is this happening?

The most likely causes:

### 1. **Changes Not Deployed Yet** (Most Common)
The sitemap.xml exists locally but hasn't been pushed to GitHub and deployed to Vercel.

**Solution:**
```bash
git add .
git commit -m "Add sitemap generation with enhanced logging"
git push origin main
```

Wait 2-3 minutes for Vercel to rebuild, then check the build logs.

### 2. **Build Script Not Running**
The prebuild script might not be executing during Vercel's build.

**How to verify:**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "View Build Logs"
4. Look for these lines:
   ```
   > prebuild
   > node scripts/generate-sitemap.cjs
   
   📁 Public directory path: /vercel/path0/public
   📄 Sitemap file path: /vercel/path0/public/sitemap.xml
   ✅ Sitemap generated successfully!
   ```

**If you DON'T see these lines**, the script isn't running. This could mean:
- The package.json wasn't deployed
- Vercel is caching an old build configuration
- Node.js version mismatch

### 3. **Vercel Caching Issue**
Vercel might be serving a cached version without the sitemap.

**Solution:**
1. Go to Vercel Dashboard
2. Settings → General
3. Scroll to "Deployment Protection" or find "Clear Cache" button
4. Or trigger a fresh deployment with:
   ```bash
   git commit --allow-empty -m "Force rebuild for sitemap"
   git push
   ```

### 4. **File Not Copied to dist/**
The script generates the file in `/public/` but Vite doesn't copy it to `/dist/` during build.

**How to verify locally:**
```bash
npm run build
ls -la dist/sitemap.xml
```

If the file doesn't exist in `dist/`, there's a Vite configuration issue.

**Solution:**
The `publicDir: "public"` in vite.config.ts should handle this, but you can add explicit copy plugin if needed.

### 5. **Vercel Rewrite Issue**
The rewrite pattern might be catching sitemap.xml incorrectly.

**Current pattern in vercel.json:**
```regex
/((?!api|assets|sw\.js|manifest\.json|offline\.html|robots\.txt|sitemap\.xml|.*\.(?:png|jpg|jpeg|svg|ico|webp|woff|woff2|ttf|eot|otf|js|css)).*)
```

This negative lookahead SHOULD exclude sitemap.xml. But test by temporarily adding a direct rewrite:

```json
{
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/sitemap.xml"
    },
    // ... existing rewrite
  ]
}
```

## Step-by-Step Debugging

### Step 1: Verify Local Build
```bash
npm run build
```

Check console output for:
- ✅ Sitemap generation logs
- ✅ No errors during build
- ✅ File exists at `dist/sitemap.xml`

### Step 2: Commit and Push
```bash
git add .
git commit -m "Fix sitemap generation"
git push
```

### Step 3: Check Vercel Build Logs
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click latest deployment
4. Review build logs for:
   - `> prebuild` execution
   - Sitemap generation success message
   - No errors during copy to dist/

### Step 4: Check Deployed Files
In Vercel dashboard:
1. Click on deployment
2. Click "Source" or "Files" tab (if available)
3. Look for `sitemap.xml` in root of deployed files

### Step 5: Test Direct Access
After deployment completes:
```bash
curl -I https://www.hoponsintra.com/sitemap.xml
```

Should return:
```
HTTP/2 200
content-type: application/xml; charset=utf-8
```

NOT:
```
HTTP/2 404
```

## Emergency Solution

If nothing works, you can manually add sitemap to the build output:

### Create `/public/sitemap-static.xml` (backup)
Keep a static version that's always deployed even if script fails.

### Or use Vercel Edge Config
Upload sitemap as an edge function response:

```typescript
// /supabase/functions/server/index.tsx
app.get('/sitemap.xml', (c) => {
  return c.text(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- all URLs here -->
</urlset>`, 200, {
    'Content-Type': 'application/xml'
  });
});
```

But this is NOT recommended - static file is better for SEO.

## What Should Happen

✅ **Correct Flow:**
1. `npm run build` executes
2. `prebuild` script runs FIRST
3. `generate-sitemap.cjs` creates `/public/sitemap.xml`
4. Vite copies everything from `/public/` to `/dist/`
5. `/dist/sitemap.xml` gets deployed to Vercel
6. `https://www.hoponsintra.com/sitemap.xml` works!

## Contact Support

If all else fails, contact Vercel support with:
- Build logs
- Link to GitHub repo
- This troubleshooting checklist showing what you tried
