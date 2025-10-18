# 🚀 Go Sintra Deployment Guide

> **Note:** This application was built in Figma Make. For Vercel-specific deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## Quick Deploy Checklist

### 1. Push to GitHub (2 minutes)

```bash
git init
git add .
git commit -m "Production ready deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/go-sintra.git
git push -u origin main
```

### 2. Deploy Frontend to Vercel (5 minutes)

1. **Go to:** https://vercel.com/new
2. **Import** your GitHub repository
3. **Add environment variables:**
   ```
   VITE_SUPABASE_URL=https://dwiznaefeqnduglmcivr.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
   ```
4. **Click Deploy**

### 3. Update Backend CORS (2 minutes)

Edit `/supabase/functions/server/index.tsx`:

```typescript
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://YOUR-VERCEL-URL.vercel.app", // ← ADD YOUR URL
    ],
    credentials: true,
  }),
);
```

Deploy backend:

```bash
npx supabase functions deploy make-server-3bd0ade8
```

### 4. Configure Stripe Webhook (3 minutes)

1. **Go to:** https://dashboard.stripe.com/webhooks
2. **Add endpoint:** `https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/webhook/stripe`
3. **Select events:**
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy webhook secret** and add to Supabase environment variables

---

## Environment Variables

### Vercel (Frontend)

```bash
VITE_SUPABASE_URL=https://dwiznaefeqnduglmcivr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Supabase Edge Functions (Backend)

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@gosintra.pt
```

---

## Post-Deployment Testing

### Test Checklist

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Language selector works
- [ ] Booking flow completes successfully
- [ ] Payment processes (use test card: 4242 4242 4242 4242)
- [ ] Email confirmation received
- [ ] PDF ticket downloads
- [ ] QR code visible on ticket
- [ ] Admin panel accessible
- [ ] Mobile responsive design
- [ ] PWA installable

---

## SEO & Performance

### Included Optimizations

- ✅ Structured data (JSON-LD)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Canonical URLs
- ✅ Meta descriptions
- ✅ Image optimization
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Service worker caching
- ✅ Compression headers

### Performance Scores (Expected)

- **Performance:** 90+
- **Accessibility:** 95+
- **Best Practices:** 95+
- **SEO:** 100

---

## Monitoring

### Check Logs

**Vercel:**

```bash
vercel logs
```

**Supabase:**

```bash
npx supabase functions logs make-server-3bd0ade8 --tail
```

### Analytics

- Access: `https://your-url.vercel.app?page=analytics`
- Monitor: Bookings, Revenue, Conversions

---

## Support URLs

- **Live Site:** https://your-url.vercel.app
- **Admin:** https://your-url.vercel.app?page=admin
- **Analytics:** https://your-url.vercel.app?page=analytics
- **Operations:** https://your-url.vercel.app?page=operations
- **QR Scanner:** https://your-url.vercel.app?page=qr-scanner

---

## Troubleshooting

### CORS Error

Update backend CORS configuration with your Vercel URL and redeploy.

### Payment Not Working

Check Stripe webhook is configured and webhook secret is set in Supabase.

### Email Not Sending

Verify RESEND_API_KEY and RESEND_FROM_EMAIL are set in Supabase environment variables.

---

## Next Steps

1. ✅ Test all functionality
2. ✅ Add Google Analytics (optional)
3. ✅ Configure custom domain
4. ✅ Set up error monitoring (Sentry)
5. ✅ Upload PWA icons
6. ✅ Test on real devices

---

**Total deployment time: ~15 minutes**

Good luck! 🚀