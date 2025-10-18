# 🇵🇹 Go Sintra - Hop-On/Hop-Off Day Pass Service

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Vercel](https://img.shields.io/badge/deploy-vercel-black)
![Build](https://img.shields.io/badge/build-passing-success)
![PWA](https://img.shields.io/badge/PWA-enabled-blue)
![Analytics](https://img.shields.io/badge/analytics-ready-blueviolet)

A complete, production-ready Progressive Web App for selling unlimited day passes to explore Sintra's UNESCO World Heritage sites.

## 🚀 Deploy in One Command

```bash
npm install && git add . && git commit -m "Add Vercel Analytics" && git push origin main
```

**That's it!** Your site with analytics tracking goes live in ~5 minutes. 📊

---

> **🎯 START HERE:** [`START_HERE_ANALYTICS.md`](./START_HERE_ANALYTICS.md) - Complete deploy guide  
> **⚡ 30 SECONDS:** [`TL;DR.md`](./TL;DR.md) - Ultra-quick summary  
> **📊 ANALYTICS:** [`ANALYTICS_SUMMARY.md`](./ANALYTICS_SUMMARY.md) - What you get  
> **✅ CHECKLIST:** [`FINAL_DEPLOYMENT_CHECKLIST.md`](./FINAL_DEPLOYMENT_CHECKLIST.md) - Step by step  
> **📚 ALL DOCS:** [`DOCUMENTATION_INDEX.md`](./DOCUMENTATION_INDEX.md) - Complete index

## 🎯 Overview

Go Sintra is a mobile-first PWA that enables tourists to purchase day passes for hop-on/hop-off service between Sintra's major attractions using tuk-tuks and UMM jeeps.

### Key Features

- 🎫 Online booking with Stripe payments
- 📧 Instant PDF tickets with QR codes
- 🌍 5 languages (EN, ES, FR, DE, PT) with auto-detection
- 📱 Installable PWA with offline support
- 🏛️ Optional attraction ticket bundles
- 💬 WhatsApp customer support integration
- 👨‍💼 Complete admin and operations portal

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel account (free)
- Supabase account (configured)
- Stripe account (live mode)

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel

#### Option 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Option 2: GitHub Integration

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (see below)
4. Deploy!

#### Option 3: Direct Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🏗️ Tech Stack

### Frontend

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **State:** React Hooks
- **Forms:** React Hook Form + Zod
- **Routing:** URL-based navigation

### Backend

- **Runtime:** Deno (Supabase Edge Functions)
- **Framework:** Hono
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth (for admin)
- **KV Store:** Custom key-value table

### Third-Party Services

- **Payments:** Stripe Checkout + Webhooks
- **Email:** Resend with custom templates
- **Hosting:** Vercel (frontend)
- **Backend:** Supabase Edge Functions
- **CDN:** Vercel Edge Network
- **Images:** Unsplash

---

## 📁 Project Structure

```
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── figma/          # Image components
│   └── *.tsx           # Page components
├── lib/                # Utilities and helpers
│   ├── translations/   # Language files
│   ├── api.ts         # API client
│   ├── contentManager.ts
│   ├── emailTemplates.ts
│   └── qrcode.ts
├── styles/             # Global styles
│   └── globals.css    # Tailwind + custom CSS
├── public/             # Static assets
│   ├── manifest.json  # PWA manifest
│   ├── sw.js          # Service worker
│   └── offline.html   # Offline fallback
├── supabase/
│   └── functions/
│       └── server/     # Edge function code
├── utils/
│   └── supabase/      # Supabase config
├── App.tsx            # Main application
├── index.html         # Entry point
└── vercel.json        # Vercel configuration
```

---

## 🎨 Design System

### Colors

- **Primary (Deep Teal):** `#0A4D5C`
- **Accent (Terracotta):** `#D97843`
- **Background:** `#FFFBF7` (warm white)
- **Foreground:** `#2D3436` (dark gray)

### Typography

- Clean, friendly hierarchy
- Mobile-optimized font sizes
- Accessible contrast ratios

### Components

- Rounded corners (20px default)
- Soft shadows
- Smooth animations
- Touch-optimized buttons (44x44px minimum)

---

## 🌍 Multilingual Support

Built-in translations for:

- 🇬🇧 English (EN)
- 🇪🇸 Spanish (ES)
- 🇫🇷 French (FR)
- 🇩🇪 German (DE)
- 🇵🇹 Portuguese (PT)

**Features:**

- Auto-detection of browser language
- Persistent language selection
- Complete translations for all pages
- SEO meta tags in each language

---

## 🔒 Security Features

- HTTPS enforcement
- CORS protection
- Input validation
- SQL injection prevention (via Supabase client)
- XSS protection
- Secure environment variables
- Protected admin routes
- Rate limiting (optional)
- Webhook signature verification

---

## 📱 PWA Features

- **Installable:** Add to home screen on mobile
- **Offline Support:** Service worker with caching
- **Push Notifications:** Ready for implementation
- **Background Sync:** Queue actions when offline
- **Responsive:** Mobile-first design
- **Fast:** Optimized assets and code splitting
- **App-like:** Full-screen mode on mobile

---

## 🎯 Operating Hours

**Daily:** 9:00 AM - 8:00 PM

This is configurable in the content management system.

---

## 🔑 Environment Variables

### Frontend (Vercel)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (Supabase)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=bookings@yourdomain.com
```

---

## 📊 Admin Features

Access admin at: `https://your-site.com?page=admin`

### Features:

- View all bookings
- Filter by date, status, type
- Search by booking ID, name, email
- Check-in customers via QR code
- Create manual bookings
- View analytics and reports
- Export booking data
- Today's operations view

---

## 🚗 Operations Portal

Access at: `https://your-site.com?page=operations`

### Features:

- Today's bookings at a glance
- Upcoming pickups timeline
- Checked-in customers list
- Capacity tracking
- Real-time statistics
- QR code scanner
- Quick check-in interface

---

## 🧪 Testing

### Test Payment

```
Card: 4242 4242 4242 4242
Expiry: 12/25 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

### Test URLs

- Homepage: `/?page=home`
- Buy Ticket: `/?page=buy-ticket`
- Admin: `/?page=admin`
- Analytics: `/?page=analytics`
- Operations: `/?page=operations`
- QR Scanner: `/?page=qr-scanner`
- Diagnostics: `/?page=diagnostics`
- PWA Icons: `/?page=pwa-icons`

---

## 📈 Analytics

Track key metrics:

- Total bookings
- Total revenue
- Conversion rate
- Popular attractions
- Language distribution
- Booking trends
- Customer demographics
- Peak booking times

---

## 🐛 Debugging

### Diagnostic Tools

- **Diagnostics Page:** `?page=diagnostics`
- **Debug Icons:** `?page=debug-icons`
- **Browser Console:** Check for errors
- **Network Tab:** Monitor API calls
- **Vercel Logs:** View deployment logs
- **Supabase Logs:** View function logs

---

## 🤝 Support

### User Support

- WhatsApp integration for live chat
- Email support system
- FAQ section (can be added)
- Booking management portal

### Developer Support

- Comprehensive documentation
- Inline code comments
- Error messages with context
- Detailed logging

---

## 📜 License

Private project for Go Sintra.

---

## 🎉 Credits

**Built with:**

- React + Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- Stripe
- Resend
- Lucide Icons
- Recharts
- Unsplash

---

## 🚀 Ready to Deploy?

**Start here:** [`START_HERE.md`](START_HERE.md) - Complete beginner's guide  
**Quick deploy:** [`VERCEL_QUICK_START.md`](VERCEL_QUICK_START.md) - 15-minute setup  
**Deployment status:** [`DEPLOYMENT_STATUS.md`](DEPLOYMENT_STATUS.md) - Current readiness  
**Need help?** Check the comprehensive guides in the root directory.

---

## 📞 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Resend Dashboard:** https://resend.com/emails

---

**Good luck with your launch! 🇵🇹🚀**

_For questions or issues, refer to the deployment guides or check the diagnostics page._