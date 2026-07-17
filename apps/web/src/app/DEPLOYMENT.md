# Vercel Deployment Configuration

## Build Configuration

### package.json
```json
"build": "tsc --noEmit && vite build --outDir dist"
```

This build command:
1. ✅ Runs TypeScript type-checking first (`tsc --noEmit`)
2. ✅ If types are valid, runs `vite build --outDir dist`
3. ✅ Outputs everything to the `dist/` folder

### vercel.json
The `vercel.json` configuration handles:
- ✅ SPA routing (all routes → `/index.html`)
- ✅ Static asset serving (images, fonts, CSS, JS)
- ✅ Service worker configuration
- ✅ Security headers
- ✅ Cache optimization

### vite.config.ts
- ✅ `outDir: "dist"` - Explicit output directory
- ✅ `base: "/"` - Correct base path for deployment
- ✅ `publicDir: "public"` - Copies public folder to build
- ✅ Code splitting and optimization configured

## How Routing Works

1. **User visits `/attractions` on Vercel**
2. **Vercel's routes in `vercel.json` catch the request**
3. **Non-static files are served `/index.html`**
4. **React app loads and reads `window.location.pathname`**
5. **App.tsx's `useEffect` extracts the page from URL**
6. **Correct component renders client-side**

## Files Created/Updated

### New Files
- `/public/404.html` - Fallback redirect for missed routes
- `/.vercelignore` - Exclude unnecessary files from deployment
- `/DEPLOYMENT.md` - This documentation

### Updated Files
- `/package.json` - Build command with TypeScript checking
- `/vercel.json` - Comprehensive routing and headers
- `/vite.config.ts` - Added `base: "/"` for proper deployment

## Deployment Steps

```bash
# Commit all changes
git add .
git commit -m "Fix Vercel deployment with proper SPA routing"

# Push to trigger Vercel deployment
git push
```

## Vercel Dashboard Settings

**Framework Preset**: Other (or Vite)
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`
**Node Version**: 18.x or higher

## Testing Locally

```bash
# Build the production version
npm run build

# Preview the production build
npm run preview

# Test different routes
# - http://localhost:4173/
# - http://localhost:4173/attractions
# - http://localhost:4173/buy-ticket
# - http://localhost:4173/about
```

## Common Issues & Solutions

### Issue: Pages other than home show 404
**Solution**: The `vercel.json` routes configuration now handles this by serving `index.html` for all non-static routes.

### Issue: Service worker not registering
**Solution**: Special headers for `/sw.js` are configured in `vercel.json`.

### Issue: TypeScript errors break build
**Solution**: Build command now runs `tsc --noEmit` first to catch type errors early.

### Issue: Assets not loading
**Solution**: Routes in `vercel.json` properly serve static assets from `/assets/` directory.

## Monitoring

After deployment:
1. ✅ Check Vercel deployment logs for any errors
2. ✅ Test all major routes (home, attractions, buy-ticket, about, etc.)
3. ✅ Verify service worker registration in DevTools
4. ✅ Check Network tab for proper asset loading
5. ✅ Test on mobile devices

## Environment Variables

The following environment variables are already configured:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- OPENAI_API_KEY

Make sure these are set in Vercel Project Settings → Environment Variables.
