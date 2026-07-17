# 🚀 One-Click Deploy to Vercel

## Deploy Go Sintra Now!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/go-sintra&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,VITE_STRIPE_PUBLISHABLE_KEY&envDescription=Required%20environment%20variables%20for%20Go%20Sintra&envLink=https://github.com/YOUR_USERNAME/go-sintra/blob/main/START_HERE.md&project-name=go-sintra&repository-name=go-sintra)

---

## Required Environment Variables

After clicking deploy, you'll be prompted to add:

### 1. VITE_SUPABASE_URL
```
https://dwiznaefeqnduglmcivr.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo
```

### 3. VITE_STRIPE_PUBLISHABLE_KEY
```
pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
```

Replace with your actual Stripe publishable key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

---

## After Deployment

1. **Update Backend CORS** - Add your Vercel URL to `/supabase/functions/server/index.tsx`
2. **Configure Stripe Webhook** - Add webhook endpoint in Stripe Dashboard
3. **Test Booking Flow** - Complete a test booking to verify everything works
4. **Add Custom Domain** (Optional) - Configure in Vercel Dashboard

---

## Need Help?

- **Quick Start:** [START_HERE.md](./START_HERE.md)
- **Full Guide:** [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)
- **Troubleshooting:** [VERCEL_ERROR_FIX.md](./VERCEL_ERROR_FIX.md)

---

**Ready?** Click the deploy button above! 🚀
