# 📊 Vercel Analytics Setup Guide

## ✅ Installation Complete!

Vercel Analytics has been successfully added to your Go Sintra application.

## What Was Added

### 1. Package Dependency
**File:** `/package.json`
```json
"@vercel/analytics": "^1.1.1"
```

### 2. Analytics Component
**File:** `/App.tsx`
- Imported `Analytics` from `@vercel/analytics/react`
- Added `<Analytics />` component at the root level

## How It Works

### Automatic Tracking

Vercel Analytics automatically tracks:
- ✅ **Page views** - Every route navigation
- ✅ **Web Vitals** - Core performance metrics
- ✅ **User sessions** - Unique visitors
- ✅ **Geographic data** - Where users are from
- ✅ **Device types** - Desktop, mobile, tablet
- ✅ **Referrers** - Where traffic comes from

### No Configuration Required

The `<Analytics />` component works out of the box when deployed to Vercel. No additional setup needed!

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install `@vercel/analytics` along with all other dependencies.

### 2. Deploy to Vercel

```bash
git add .
git commit -m "Add Vercel Analytics"
git push origin main
```

### 3. View Analytics

After deployment:
1. Go to your Vercel Dashboard
2. Select your Go Sintra project
3. Click on the **"Analytics"** tab
4. View real-time and historical data

## What Gets Tracked

### Page Views
Every page navigation is automatically tracked:
- Home page visits
- Attraction detail pages
- Blog article views
- Booking flow steps
- Checkout completions

### Performance Metrics (Web Vitals)
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Perceived load speed
- **TTFB** (Time to First Byte) - Server response time

### User Insights
- Unique visitors per day/week/month
- Session duration
- Bounce rate
- Top pages
- Geographic distribution
- Device breakdown

## Accessing Analytics

### In Vercel Dashboard

1. **Real-time:** View current active users
2. **Overview:** Traffic trends and top pages
3. **Audience:** Geographic and device data
4. **Web Vitals:** Performance scores

### Analytics API (Optional)

You can also access analytics data programmatically:
```typescript
// For advanced use cases
import { track } from '@vercel/analytics';

// Track custom events
track('ticket_purchased', {
  attraction: 'Pena Palace',
  amount: 25
});
```

## Privacy Compliant

Vercel Analytics is:
- ✅ **GDPR compliant**
- ✅ **No cookies required**
- ✅ **No personal data collected**
- ✅ **Privacy-first tracking**

Perfect for your Go Sintra guest-only site!

## What You'll See After Deployment

### Day 1
- Initial page views appear
- Real-time visitor count
- Basic traffic sources

### Week 1
- Traffic trends emerge
- Top pages identified
- Geographic patterns visible

### Month 1
- Full analytics insights
- Performance trends
- User behavior patterns

## Verifying It Works

### 1. Check Build Logs

After deployment, Vercel build logs should show:
```
Installing dependencies...
✓ @vercel/analytics installed
```

### 2. Check Browser Console

In production, open DevTools:
```
Network tab → Filter by "vitals"
Should see requests to Vercel analytics
```

### 3. Check Dashboard

Visit your Vercel Dashboard → Analytics:
- Should show "Analytics Active"
- Real-time data appears within minutes

## Cost

### Free Tier
- ✅ 2,500 events per month
- ✅ 30-day data retention
- ✅ All core features

### Pro Tier (if needed)
- 100,000 events per month
- 90-day data retention
- Custom events
- Data export

Your Go Sintra site will likely stay within the free tier for prototyping and initial launch.

## Troubleshooting

### "Analytics not showing data"

**Wait 5-10 minutes** after deployment. Data isn't instant.

### "Analytics tab not visible"

**Enable in Vercel Dashboard:**
1. Project Settings
2. Analytics
3. Enable Analytics

### "Events not tracking"

**Check:**
1. Is site deployed to Vercel? (Analytics only works in production)
2. Is `<Analytics />` component rendered?
3. Check browser console for errors

### "Want to test locally?"

Analytics **only works in production** on Vercel. To test:
```bash
npm run build
npm run preview
```

But real data only appears when deployed to Vercel.

## Advanced: Custom Event Tracking

If you want to track specific user actions beyond page views:

```typescript
import { track } from '@vercel/analytics';

// Track ticket purchases
track('TicketPurchased', {
  passType: 'full-day',
  quantity: 2,
  attraction: 'Pena Palace'
});

// Track booking started
track('BookingStarted', {
  step: 'ticket-selection'
});

// Track language changes
track('LanguageChanged', {
  from: 'en',
  to: 'pt'
});
```

Add this to your components where these actions occur.

## Integration with Your App

The Analytics component is already integrated at the root level of your app (`App.tsx`), so it will track:

- ✅ All page navigations (home, attractions, blog, etc.)
- ✅ All user interactions that change routes
- ✅ Web Vitals for every page load
- ✅ Session data for all visitors

**No additional code needed!**

## Documentation

For more details, visit:
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Custom Events](https://vercel.com/docs/analytics/custom-events)

## Summary

✅ **Package installed:** `@vercel/analytics`  
✅ **Component added:** `<Analytics />` in `App.tsx`  
✅ **Privacy compliant:** No cookies, GDPR-friendly  
✅ **Auto-tracking:** Page views and Web Vitals  
✅ **Ready to deploy!**

### Next Steps

```bash
# Install dependencies
npm install

# Deploy to Vercel
git add .
git commit -m "Add Vercel Analytics"
git push origin main
```

**Analytics will be live within 10 minutes of deployment!** 📊

---

**Date:** January 17, 2025  
**Status:** ✅ Ready to deploy  
**Free tier:** Included with all Vercel deployments
