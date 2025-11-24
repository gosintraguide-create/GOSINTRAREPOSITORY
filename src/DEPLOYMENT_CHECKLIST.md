# 🚀 Vercel Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] No console errors in development
- [ ] All components render correctly
- [ ] Navigation works between all pages

### 2. Build Test
```bash
# Run the build test script
npm run test:build

# If successful, preview locally
npm run preview

# Test these routes locally at http://localhost:4173:
# - / (home)
# - /attractions
# - /buy-ticket
# - /about
# - /contact
# - /faq
# - /route-map
# - /admin (password: Sintra2025)
```

### 3. Files Modified for Deployment

#### ✅ package.json
```json
"build": "tsc --noEmit && vite build --outDir dist"
```

#### ✅ vercel.json
- Comprehensive SPA routing configuration
- Service worker headers
- Security headers
- Cache optimization

#### ✅ vite.config.ts
- `base: "/"` added
- `outDir: "dist"` confirmed
- `publicDir: "public"` confirmed

#### ✅ public/404.html
- Fallback redirect for unmatched routes

## Vercel Dashboard Configuration

### Project Settings
1. **Framework Preset**: Other (or Vite)
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm install`
5. **Node.js Version**: 18.x

### Environment Variables
Ensure these are set in Vercel Project Settings → Environment Variables:

- [x] SUPABASE_URL
- [x] SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] SUPABASE_DB_URL
- [x] STRIPE_SECRET_KEY
- [x] STRIPE_PUBLISHABLE_KEY
- [x] OPENAI_API_KEY

## Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "Fix Vercel deployment with proper SPA routing configuration"
```

### Step 2: Push to Deploy
```bash
git push origin main
```

### Step 3: Monitor Deployment
1. Go to Vercel Dashboard
2. Watch the deployment logs
3. Look for these success indicators:
   - ✅ "Building..."
   - ✅ "Running build command: npm run build"
   - ✅ "TypeScript check passed"
   - ✅ "Build completed"
   - ✅ "Deployment ready"

### Step 4: Post-Deployment Testing
Test these URLs on your live Vercel domain:

#### Critical Routes
- [ ] https://your-domain.vercel.app/
- [ ] https://your-domain.vercel.app/attractions
- [ ] https://your-domain.vercel.app/buy-ticket
- [ ] https://your-domain.vercel.app/about
- [ ] https://your-domain.vercel.app/contact
- [ ] https://your-domain.vercel.app/faq
- [ ] https://your-domain.vercel.app/route-map

#### Attraction Pages
- [ ] https://your-domain.vercel.app/pena-palace
- [ ] https://your-domain.vercel.app/quinta-regaleira
- [ ] https://your-domain.vercel.app/moorish-castle
- [ ] https://your-domain.vercel.app/monserrate-palace

#### Admin/Special Pages
- [ ] https://your-domain.vercel.app/admin
- [ ] https://your-domain.vercel.app/analytics
- [ ] https://your-domain.vercel.app/operations

### Step 5: Functionality Testing
- [ ] Language selector works (all 7 languages)
- [ ] Book ticket flow works end-to-end
- [ ] Stripe payment integration functional
- [ ] WhatsApp live chat opens correctly
- [ ] Mobile responsive design works
- [ ] Service worker registers (check DevTools)
- [ ] PWA install prompt appears (mobile)

### Step 6: Performance Check
- [ ] Lighthouse score > 90 (Performance)
- [ ] All images load correctly
- [ ] No 404 errors in Network tab
- [ ] Page loads in < 3 seconds

## Common Issues & Solutions

### Issue: "404 Page Not Found" on routes
**Status**: ✅ FIXED
**Solution**: vercel.json now properly routes all requests to index.html

### Issue: Build fails with TypeScript errors
**Status**: ✅ PREVENTED
**Solution**: Build command runs `tsc --noEmit` first to catch errors

### Issue: Service worker not registering
**Status**: ✅ FIXED
**Solution**: Special headers configured in vercel.json for /sw.js

### Issue: Assets return 404
**Status**: ✅ FIXED
**Solution**: Route configuration properly serves static assets

## Emergency Rollback

If deployment fails:

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

Or use Vercel Dashboard:
1. Go to Deployments tab
2. Find last working deployment
3. Click "..." → "Promote to Production"

## Support

If issues persist:
1. Check Vercel deployment logs
2. Review DEPLOYMENT.md for detailed configuration
3. Check browser console for client-side errors
4. Verify all environment variables are set

## Success Criteria

Deployment is successful when:
- ✅ All routes load without 404 errors
- ✅ Navigation works between all pages
- ✅ Booking flow completes successfully
- ✅ Mobile experience is smooth
- ✅ No console errors
- ✅ Service worker registers
- ✅ PWA features work

---

**Last Updated**: November 24, 2025
**Deployment Configuration Version**: 2.0
