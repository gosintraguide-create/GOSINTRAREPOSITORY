# 🚀 Vercel Quick Start - Go Sintra

## ✅ Ready to Deploy!

All build configuration files have been added. Your project is now fully compatible with Vercel.

---

## 🎯 Deployment Steps (5 minutes)

### Step 1: Install Dependencies (Local Testing - Optional)

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to test locally.

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Go Sintra ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/go-sintra.git
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI (Fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? → No
# - Project name? → go-sintra
# - Directory? → ./
# - Override settings? → No
```

#### Option B: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Vercel auto-detects the configuration ✨
5. Click **"Deploy"**

---

## 🔑 Environment Variables

### Required Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

```env
# Supabase
VITE_SUPABASE_URL=https://dwiznaefeqnduglmcivr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_KEY
```

**Important:** Replace `pk_live_YOUR_STRIPE_KEY` with your actual Stripe publishable key.

### How to Add Variables

1. **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://dwiznaefeqnduglmcivr.supabase.co`
   - Environment: Select **Production**, **Preview**, **Development**
3. Click **"Save"**
4. Repeat for all variables

---

## 🔧 Build Configuration

Vercel will automatically use these settings from `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

**You don't need to configure anything!** ✨

---

## 🎉 Post-Deployment

### 1. Test Your Deployment

Visit your Vercel URL (e.g., `https://go-sintra.vercel.app`)

Check these pages:
- ✅ Homepage loads
- ✅ Buy ticket page works
- ✅ Attractions display correctly
- ✅ Blog loads
- ✅ Language switcher works
- ✅ PWA installs on mobile

### 2. Update Backend CORS

Edit `/supabase/functions/server/index.tsx`:

```typescript
app.use("*", cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://go-sintra.vercel.app',        // ← ADD THIS
    'https://go-sintra-*.vercel.app',      // ← ADD THIS (for preview deployments)
  ],
  credentials: true,
}));
```

Deploy backend:
```bash
npx supabase functions deploy make-server-3bd0ade8
```

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Endpoint URL:
   ```
   https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/webhook/stripe
   ```
4. Events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (`whsec_...`)
7. Add to Supabase secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
   ```

### 4. Add Custom Domain (Optional)

1. **Vercel Dashboard** → Your Project → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter: `gosintra.pt`
4. Follow DNS instructions
5. Wait for SSL certificate (automatic)

---

## 📊 Monitor Your Deployment

### Vercel Dashboard

- **Deployments:** View all deployments and logs
- **Analytics:** Track page views and performance
- **Logs:** Real-time function logs
- **Speed Insights:** Core Web Vitals monitoring

### Supabase Dashboard

- **Functions:** View edge function logs
- **Database:** Monitor queries and connections
- **Storage:** Track file uploads
- **Auth:** User authentication logs

---

## 🐛 Troubleshooting

### Build Fails

**Error:** Module not found
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
vercel --force
```

### Environment Variables Not Working

**Error:** API calls failing
**Solution:**
1. Check variables are added in Vercel Dashboard
2. Ensure variable names start with `VITE_`
3. Redeploy after adding variables

### CORS Errors

**Error:** Blocked by CORS policy
**Solution:**
1. Update CORS origins in `/supabase/functions/server/index.tsx`
2. Include your Vercel URL
3. Redeploy Supabase function

### Images Not Loading

**Error:** 404 on images
**Solution:**
1. Check images are in `/public` folder
2. Verify PWA icons exist:
   - `/public/icon-72x72.png`
   - `/public/icon-192x192.png`
   - `/public/icon-512x512.png`
3. Upload via PWA Icons page: `?page=pwa-icons`

---

## 📈 Performance Optimization

### After Deployment

1. **Run Lighthouse Audit**
   - Open Chrome DevTools
   - Go to "Lighthouse" tab
   - Run audit
   - Target: 90+ scores

2. **Enable Vercel Analytics**
   - Vercel Dashboard → Your Project → Analytics
   - Enable "Analytics" and "Speed Insights"

3. **Optimize Images**
   - Use WebP format
   - Compress before upload
   - Use responsive images

4. **Monitor Core Web Vitals**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

---

## 🎯 Next Steps

### Immediate
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Update backend CORS
- [ ] Configure Stripe webhook
- [ ] Test full booking flow

### Within 24 Hours
- [ ] Add custom domain
- [ ] Upload PWA icons
- [ ] Test on mobile devices
- [ ] Enable Vercel Analytics
- [ ] Submit sitemap to Google

### Within 1 Week
- [ ] Set up Google Analytics
- [ ] Configure email templates
- [ ] Train support team
- [ ] Create admin accounts
- [ ] Run marketing campaigns

---

## 📚 Additional Resources

- **Full Deployment Guide:** [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **SEO Guide:** [`SEO_OPTIMIZATION_GUIDE.md`](./SEO_OPTIMIZATION_GUIDE.md)
- **Blog System:** [`BLOG_SYSTEM_GUIDE.md`](./BLOG_SYSTEM_GUIDE.md)
- **Content Management:** [`CONTENT_MANAGEMENT_GUIDE.md`](./CONTENT_MANAGEMENT_GUIDE.md)

---

## 💡 Pro Tips

1. **Use Preview Deployments**
   - Every PR gets a preview URL
   - Test changes before merging
   - Share with team for feedback

2. **Enable Automatic Deployments**
   - Push to `main` = instant deployment
   - No manual steps needed
   - Roll back with one click

3. **Monitor Performance**
   - Check Vercel Analytics weekly
   - Optimize slow pages
   - Track user behavior

4. **Set Up Alerts**
   - Vercel can notify on deployment failures
   - Supabase can alert on errors
   - Stripe can email on payment issues

---

## ✅ Deployment Checklist

Before going live:

- [ ] All environment variables added
- [ ] Backend CORS updated with Vercel URL
- [ ] Stripe webhook configured
- [ ] Test booking flow (end-to-end)
- [ ] PWA icons uploaded
- [ ] Service worker registered
- [ ] Sitemap.xml accessible
- [ ] robots.txt accessible
- [ ] Mobile responsive tested
- [ ] All pages load correctly
- [ ] Language switcher works
- [ ] WhatsApp chat configured
- [ ] Admin access tested
- [ ] Operations portal tested
- [ ] QR scanner works
- [ ] Email notifications sending

---

## 🎉 You're Ready!

Your Go Sintra application is fully configured and ready to deploy to Vercel.

**Deploy now:**
```bash
vercel
```

**Questions?** Check the troubleshooting section or refer to the deployment guides.

**Good luck with your launch! 🚀🇵🇹**
