# ✅ Deployment Checklist - Go Sintra

## Pre-Deployment (Do This First)

### 1. Test Build Locally

```bash
# Option A: Use the test script
./test-build.sh        # Mac/Linux
test-build.bat         # Windows

# Option B: Manual test
npm install
npm run build
ls -la dist/
```

**Expected Result:**
- ✅ `dist/` folder created
- ✅ `dist/index.html` exists
- ✅ `dist/assets/` folder contains JS and CSS files

### 2. Validate Configuration Files

```bash
# Check package.json is valid
node -e "require('./package.json')"

# Check vercel.json is valid
node -e "require('./vercel.json')"

# Both should output nothing if valid
```

### 3. Commit All Changes

```bash
git status
git add .
git commit -m "Fix vercel.json and prepare for deployment"
git push origin main
```

---

## Deployment Methods

### Method 1: Automatic Deploy (Recommended)

**Steps:**
1. Push to GitHub (done above)
2. Vercel auto-detects the push
3. Build starts automatically
4. Wait 3-5 minutes

**Monitor:**
- Go to Vercel Dashboard → Deployments
- Watch the build progress
- Check build logs if it fails

### Method 2: Manual Redeploy

**Steps:**
1. Go to **Vercel Dashboard**
2. Click **Deployments**
3. Find latest deployment
4. Click **"..."** menu
5. Click **"Redeploy"**
6. **Uncheck** "Use existing Build Cache"
7. Click **"Redeploy"**

### Method 3: Vercel CLI

**Steps:**
```bash
# Install CLI (first time only)
npm install -g vercel

# Login (first time only)
vercel login

# Deploy
vercel --prod
```

---

## During Deployment

### What to Watch

1. **Installation Phase** (1-2 min)
   - Installing dependencies...
   - ✓ Dependencies installed

2. **Build Phase** (1-3 min)
   - Running build command: npm run build
   - vite building for production...
   - ✓ X modules transformed
   - ✓ built in Xs

3. **Deployment Phase** (30 sec)
   - Uploading build outputs...
   - ✓ Deployment ready

### Common Build Log Messages

**✅ Good Messages:**
```
Installing dependencies...
✓ Dependencies installed
Running build command: npm run build
vite v5.0.8 building for production...
✓ 234 modules transformed.
dist/index.html                  1.23 kB
dist/assets/index-abc123.css    45.67 kB
dist/assets/index-def456.js    234.56 kB
✓ built in 8.42s
Build Completed!
```

**❌ Bad Messages to Watch For:**
```
Error: Cannot find module 'X'
→ Fix: npm install X, commit, push

Failed to parse source for import analysis
→ Fix: Check for syntax errors in code

No Output Directory named "dist" found
→ Fix: Already fixed! (vercel.json syntax)

ENOENT: no such file or directory
→ Fix: Check import paths are correct
```

---

## Post-Deployment Verification

### 1. Basic Checks

- [ ] Deployment shows "Ready" status in Vercel
- [ ] Visit the Vercel URL - site loads
- [ ] Homepage displays correctly
- [ ] No console errors in browser DevTools

### 2. Navigation Tests

- [ ] Click "How It Works" - page loads
- [ ] Click "Attractions" - page loads
- [ ] Click "Buy Pass" - page loads
- [ ] Click each attraction - detail pages load
- [ ] Language selector works
- [ ] Footer links work

### 3. Functional Tests

- [ ] Booking flow works
  - [ ] Select pass type
  - [ ] Choose date
  - [ ] Add optional attractions
  - [ ] Enter details
  - [ ] Payment form loads (don't need to pay)
  
- [ ] Admin access
  - [ ] Admin button visible (bottom-right)
  - [ ] Login page loads
  
- [ ] PWA Features
  - [ ] Service worker registers (check console)
  - [ ] Install prompt shows (on mobile/compatible browsers)

### 4. Performance Tests

- [ ] Images load properly
- [ ] Styles apply correctly
- [ ] No layout shifts
- [ ] Page transitions are smooth
- [ ] Forms are responsive

### 5. Mobile Tests

- [ ] Site is mobile-responsive
- [ ] Touch targets are adequate
- [ ] Text is readable
- [ ] PWA install prompt appears

---

## Environment Variables Setup

After successful deployment, add these in **Vercel Dashboard**:

### Required Variables

Go to **Settings** → **Environment Variables**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

### How to Add

1. Click **"Add New"**
2. Enter **Name:** `VITE_SUPABASE_URL`
3. Enter **Value:** (paste your Supabase URL)
4. Select environments: **Production, Preview, Development**
5. Click **"Save"**
6. Repeat for each variable

### After Adding Variables

**Redeploy** to apply the new environment variables:
- Click **Deployments** → **Redeploy**

---

## Backend Configuration

### Update Supabase Edge Function

Update the CORS configuration with your Vercel URL:

```typescript
// In /supabase/functions/server/index.tsx
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-project.vercel.app',
  // ... rest of headers
}
```

Then deploy the updated function to Supabase.

### Stripe Webhook

Add your Vercel URL to Stripe webhook endpoints:

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-project.vercel.app/api/stripe-webhook`
4. Events: Select relevant events
5. Copy the signing secret
6. Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET`

---

## Custom Domain (Optional)

### Add Domain in Vercel

1. **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `gosintra.com`
4. Follow DNS instructions

### Update DNS Records

Add these records at your domain registrar:

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Update CORS

After adding domain, update Supabase CORS to include:
- `https://gosintra.com`
- `https://www.gosintra.com`

---

## Performance Optimization

### Enable Vercel Features

1. **Analytics**
   - Settings → Analytics → Enable
   - Monitor real user performance

2. **Speed Insights**
   - Settings → Speed Insights → Enable
   - Get Core Web Vitals data

3. **Security Headers**
   - Already configured in vercel.json ✅

### Cache Configuration

Already configured in vercel.json:
- ✅ Static assets: 1 year cache
- ✅ Service worker: no cache
- ✅ HTML: no cache
- ✅ Images: 1 year cache

---

## Monitoring & Maintenance

### Regular Checks

**Daily:**
- [ ] Check Vercel deployment status
- [ ] Monitor error logs

**Weekly:**
- [ ] Review analytics
- [ ] Check performance metrics
- [ ] Test booking flow

**Monthly:**
- [ ] Update dependencies
- [ ] Review and optimize images
- [ ] Check SEO rankings

### Where to Monitor

**Vercel Dashboard:**
- Deployments: Build history
- Analytics: Traffic data
- Logs: Error messages

**Supabase Dashboard:**
- Database: Booking data
- Edge Functions: API logs
- Storage: File uploads

**Stripe Dashboard:**
- Payments: Transaction history
- Webhooks: Event delivery

---

## Troubleshooting Deployment Issues

### Build Fails

**1. Check the error message in build logs**
   - Go to Deployments → Click failed deployment
   - Read the error carefully

**2. Test locally first**
   ```bash
   npm run build
   ```
   - If it fails locally, fix the issue before pushing

**3. Clear Vercel cache**
   - Settings → Clear Build Cache
   - Redeploy

### Build Succeeds But Site Doesn't Work

**1. Check environment variables**
   - Verify all required vars are set
   - Check for typos

**2. Check browser console**
   - Look for error messages
   - Fix API endpoint issues

**3. Check CORS**
   - Verify Supabase allows your Vercel URL

### Deployment is Slow

**1. Check build logs**
   - Look for slow dependencies
   - Consider optimizing imports

**2. Split code better**
   - Already configured in vite.config.ts ✅

**3. Reduce bundle size**
   - Remove unused dependencies
   - Lazy load heavy components

---

## Success Criteria

Your deployment is successful when:

### Technical Checks
- [x] Build completes without errors
- [x] `dist/` folder is created and deployed
- [x] Site is accessible at Vercel URL
- [x] No 404 errors
- [x] No console errors

### Functional Checks
- [ ] All pages load
- [ ] Navigation works
- [ ] Forms submit
- [ ] Payments process
- [ ] Admin panel accessible
- [ ] PWA installs

### Performance Checks
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] Images optimized
- [ ] No layout shift

---

## Quick Reference

### One-Line Deploy

```bash
git add . && git commit -m "Deploy" && git push origin main
```

### Check Build Logs

```bash
# Via CLI
vercel logs

# Or visit:
# https://vercel.com/your-team/your-project/deployments
```

### Rollback Deployment

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"..."** → **"Promote to Production"**

---

## Getting Help

### Before Asking for Help

Gather this information:
1. **Full build log** from Vercel
2. **Output of** `npm run build` locally
3. **Node version:** `node -v`
4. **What you've tried** from this checklist

### Where to Get Help

- **Vercel Support:** https://vercel.com/support
- **Vercel Docs:** https://vercel.com/docs
- **This Project Docs:**
  - [`WHAT_I_FIXED.md`](./WHAT_I_FIXED.md)
  - [`VERCEL_TROUBLESHOOTING.md`](./VERCEL_TROUBLESHOOTING.md)
  - [`FIX_NOW.md`](./FIX_NOW.md)

---

## Final Pre-Flight Check

Before you push to deploy, verify:

- [ ] `npm run build` works locally
- [ ] `vercel.json` is valid JSON
- [ ] All changes are committed
- [ ] Environment variables documented
- [ ] Backend URLs updated
- [ ] You have Vercel access
- [ ] GitHub repo is connected to Vercel

## Ready to Deploy?

```bash
git push origin main
```

Then watch your Vercel dashboard! 🚀

---

**Last Updated:** January 17, 2025  
**Status:** ✅ Ready for deployment  
**Estimated Time:** 5-10 minutes for first deployment
