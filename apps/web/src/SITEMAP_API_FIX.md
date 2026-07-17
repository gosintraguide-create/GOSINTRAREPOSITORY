# Sitemap Fix - Using Vercel Serverless Function

## The Problem
Static file serving wasn't working properly for sitemap.xml on Vercel.

## The Solution
Instead of serving sitemap.xml as a static file, we're now using a **Vercel Serverless Function** that dynamically generates and serves the sitemap.

## What Was Changed

### 1. Created `/api/sitemap.xml.js`
- Vercel serverless function that generates XML sitemap
- Runs on-demand when /sitemap.xml is requested
- Always returns fresh sitemap with current date
- Sets proper Content-Type and caching headers

### 2. Updated `/vercel.json`
- Added rewrite rule: `/sitemap.xml` → `/api/sitemap.xml.js`
- Ensures sitemap requests are handled by the serverless function
- Removed conflicting static file routes

## Benefits of This Approach

✅ **Always works** - No dependency on build output or static file copying
✅ **Always fresh** - Generates sitemap with current date on every request
✅ **Reliable** - Vercel serverless functions are battle-tested
✅ **Fast** - Cached for 1 hour (3600 seconds)
✅ **SEO-friendly** - Proper XML headers and structure

## Deploy Now

```bash
git add .
git commit -m "Fix sitemap using Vercel serverless function"
git push
```

## Test After Deployment

### 1. Check the sitemap is accessible:
```bash
curl https://www.hoponsintra.com/sitemap.xml
```

Should return XML content starting with:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
```

### 2. Check in browser:
Visit: https://www.hoponsintra.com/sitemap.xml

Should display formatted XML with all your pages.

### 3. Verify headers:
```bash
curl -I https://www.hoponsintra.com/sitemap.xml
```

Should show:
- `HTTP/2 200`
- `content-type: application/xml; charset=utf-8`
- `cache-control: public, max-age=3600, s-maxage=3600`

## What's Included in the Sitemap

The serverless function includes:

**Main Pages (12):**
- Home page (priority 1.0)
- Buy ticket, attractions, blog (priority 0.9)
- Private tours, sunset special, route map, etc.

**Attraction Pages (8):**
- Pena Palace
- Quinta da Regaleira
- Moorish Castle
- Monserrate Palace
- Sintra Palace
- Convento dos Capuchos
- Cabo da Roca
- Villa Sassetti

**Blog Articles (3):**
- Getting to Sintra from Lisbon
- Planning Perfect Day in Sintra
- Sintra on a Budget

**Total: 23 URLs**

## Next Steps After It Works

1. ✅ Test sitemap is accessible
2. ✅ Submit to Google Search Console
3. ✅ Submit to Bing Webmaster Tools
4. ✅ Monitor crawl stats in search console

## Why This Works Better

**Previous approach (static file):**
- ❌ Relies on build pipeline
- ❌ Requires Vite to copy file correctly
- ❌ Requires Vercel to serve static file
- ❌ Multiple points of failure

**New approach (serverless function):**
- ✅ Self-contained API endpoint
- ✅ Guaranteed to work on Vercel
- ✅ Dynamic generation
- ✅ Single point of control

## Troubleshooting

### If you still get 404:

1. **Check Vercel deployment logs:**
   - Look for `/api/sitemap.xml.js` in Functions section
   - Should show as deployed

2. **Check function logs:**
   - Vercel Dashboard → Functions → Logs
   - Look for any errors when accessing /sitemap.xml

3. **Verify rewrite is working:**
   ```bash
   curl -v https://www.hoponsintra.com/sitemap.xml 2>&1 | grep -i "x-vercel"
   ```
   Should show Vercel headers indicating it's hitting the function

4. **Test the API directly:**
   ```bash
   curl https://www.hoponsintra.com/api/sitemap.xml.js
   ```
   This should also return the sitemap XML

## Bonus: Updating the Sitemap

To add new pages to the sitemap, just edit `/api/sitemap.xml.js`:

- Add to `staticRoutes` array for new static pages
- Add to `attractions` array for new attraction pages
- Add to `articles` array for new blog posts

Changes take effect immediately after deployment!
