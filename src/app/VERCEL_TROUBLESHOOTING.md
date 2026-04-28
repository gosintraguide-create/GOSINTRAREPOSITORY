# Vercel Routing Troubleshooting Guide

## Problem: Pages Only Accessible from Home Page

When you visit routes like `/attractions` directly, you see a 404 or blank page, but clicking links from the home page works fine.

## Root Cause

This is a Single Page Application (SPA) routing issue. Vercel needs to serve `index.html` for ALL routes, but currently it's only serving it for `/`.

## Solution Steps

### Step 1: Verify vercel.json Configuration

Your `vercel.json` should have this exact configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Key points:**
- ✅ `"framework": null` - Important! Don't let Vercel auto-detect
- ✅ `"outputDirectory": "dist"` - Must match Vite output
- ✅ Simple `rewrites` - Catches ALL routes and serves index.html

### Step 2: Check Build Output

After running `npm run build` locally, verify:

```bash
ls -la dist/
```

You should see:
- ✅ `index.html` - Main HTML file
- ✅ `assets/` - Folder with JS/CSS bundles
- ✅ `manifest.json` - PWA manifest
- ✅ `sw.js` - Service worker
- ✅ `404.html` - Fallback page
- ✅ Other public files

### Step 3: Test Locally

```bash
# Build production version
npm run build

# Serve locally (this simulates Vercel)
npm run preview

# Test these URLs directly in browser:
http://localhost:4173/
http://localhost:4173/attractions
http://localhost:4173/buy-ticket
http://localhost:4173/about
```

**If local preview works but Vercel doesn't:**
- The issue is with Vercel configuration
- Check Vercel Dashboard settings

### Step 4: Vercel Dashboard Settings

Go to your Vercel project settings:

1. **Settings → General → Build & Development Settings**
   - Framework Preset: `Other` or `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Settings → Domains**
   - Ensure your domain is properly connected
   - Clear any redirects that might interfere

3. **Redeploy**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - ✅ Check "Use existing Build Cache" OFF
   - ✅ Click "Redeploy"

### Step 5: Clear Vercel Cache

Sometimes Vercel caches the old configuration:

```bash
# In your terminal
vercel --prod --force

# Or via dashboard: Redeploy without cache
```

### Step 6: Check Deployment Logs

After deploying, check the logs:

1. Go to Deployments tab
2. Click on the latest deployment
3. Click "Building" or "Deployment" to see logs

**Look for:**
- ✅ "Running build command: npm run build"
- ✅ "Build completed"
- ✅ "dist directory created"
- ❌ Any errors about missing files
- ❌ 404 errors for routes

### Step 7: Test with Console Logs

Open browser DevTools Console when visiting `/attractions` directly:

You should see:
```
[App] Initial URL load: {
  href: "https://your-domain.vercel.app/attractions",
  pathname: "/attractions",
  ...
}
[App] Parsed URL: {
  page: "attractions",
  slug: null,
  cleanPath: "/attractions"
}
[App] Setting page to: attractions
```

**If you see:**
- ❌ Page not found / 404
- ❌ No console logs
- ❌ Blank page

**Then:**
- Vercel is NOT serving index.html for that route
- Check vercel.json is in the root directory
- Check vercel.json is valid JSON (no syntax errors)

### Step 8: Alternative Configuration (If Above Fails)

Try this more explicit configuration in `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/sw.js",
      "dest": "/sw.js",
      "headers": {
        "cache-control": "public, max-age=0, must-revalidate",
        "service-worker-allowed": "/"
      }
    },
    {
      "src": "/assets/(.*)",
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*\\.(png|jpg|jpeg|gif|svg|ico|webp|json|txt|xml))",
      "dest": "/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## Debugging Checklist

- [ ] `vercel.json` exists in project root
- [ ] `vercel.json` has `rewrites` configuration
- [ ] `package.json` has correct build script
- [ ] Local `npm run build` completes without errors
- [ ] Local `npm run preview` works for all routes
- [ ] Vercel Dashboard shows `dist` as output directory
- [ ] Redeployed without cache
- [ ] Checked deployment logs for errors
- [ ] Tested in incognito/private browser window
- [ ] Tested with browser DevTools console open

## Common Issues

### Issue 1: vercel.json Not Being Read

**Symptoms:**
- Routes work locally but not on Vercel
- Vercel seems to ignore configuration

**Solution:**
1. Ensure `vercel.json` is in the root directory (same level as `package.json`)
2. Check for JSON syntax errors: https://jsonlint.com/
3. Commit and push the file: `git add vercel.json && git commit -m "Add vercel config" && git push`

### Issue 2: Build Command Issues

**Symptoms:**
- Build fails on Vercel
- TypeScript errors

**Solution:**
Check `package.json`:
```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build --outDir dist"
  }
}
```

### Issue 3: Framework Auto-Detection Conflict

**Symptoms:**
- Vercel detects wrong framework
- Routes don't work despite correct config

**Solution:**
Set `"framework": null` in `vercel.json` to disable auto-detection

### Issue 4: Caching Issues

**Symptoms:**
- Old version still loads
- Changes don't appear

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Clear Vercel cache and redeploy
4. Try incognito/private window

## Still Not Working?

### Last Resort Options:

1. **Delete and recreate Vercel project:**
   - Export environment variables
   - Delete project from Vercel
   - Import again from GitHub
   - Set environment variables
   - Deploy

2. **Use Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

3. **Check Vercel Status:**
   - Visit: https://www.vercel-status.com/
   - Ensure no ongoing issues

4. **Contact Vercel Support:**
   - Include deployment URL
   - Include vercel.json content
   - Include deployment logs

## Success Indicators

When working correctly:

✅ Direct URL visits load the correct page
✅ Browser console shows URL parsing logs
✅ All routes accessible via direct link
✅ No 404 errors in Network tab
✅ Service worker registers
✅ PWA features work

## Test URLs After Fix

After deploying, test all these URLs directly in browser:

```
https://your-domain.vercel.app/
https://your-domain.vercel.app/attractions
https://your-domain.vercel.app/buy-ticket
https://your-domain.vercel.app/about
https://your-domain.vercel.app/contact
https://your-domain.vercel.app/faq
https://your-domain.vercel.app/route-map
https://your-domain.vercel.app/pena-palace
https://your-domain.vercel.app/quinta-regaleira
```

All should load correctly, not 404.

---

**Last Updated:** November 24, 2025
**Configuration Version:** 3.0 (Simplified Rewrites)
