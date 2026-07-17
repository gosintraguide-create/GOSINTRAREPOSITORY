# Analytics Setup Guide for Hop On Sintra

This guide will help you set up comprehensive visitor tracking for your Hop On Sintra website.

## 🎯 Overview

Your website now supports **three analytics platforms**:

1. **Vercel Analytics** ✅ (Already installed)
   - Basic page views and performance metrics
   - No setup needed - automatically works when deployed to Vercel

2. **Google Analytics 4 (GA4)** 📊 (Recommended - Setup required)
   - Comprehensive visitor tracking
   - E-commerce and conversion tracking
   - Traffic source attribution
   - Free forever

3. **Microsoft Clarity** 🎥 (Optional - Highly recommended)
   - Heatmaps showing where users click
   - Session recordings to watch user behavior
   - Free forever

---

## 🚀 Step 1: Set Up Google Analytics 4 (GA4)

### Why GA4?
- Track where bookings come from (Google, Facebook, direct, etc.)
- See booking funnel drop-off points
- Understand which attractions are most viewed
- Monitor conversion rates
- **100% FREE**

### Setup Instructions:

1. **Create a Google Analytics account**
   - Go to: https://analytics.google.com/
   - Click "Start measuring"
   - Follow the setup wizard

2. **Create a GA4 Property**
   - Property name: "Hop On Sintra"
   - Time zone: Europe/Lisbon
   - Currency: Euro (EUR)

3. **Get your Measurement ID**
   - In GA4, go to Admin → Data Streams
   - Click on your web data stream
   - Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

4. **Add to your website**
   - Open `/App.tsx`
   - Find line 23: `const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";`
   - Replace `G-XXXXXXXXXX` with your actual Measurement ID
   - **Example:** `const GA_MEASUREMENT_ID = "G-ABC1234567";`

5. **Verify it's working**
   - Save and deploy your changes
   - Visit your website
   - In GA4, go to Reports → Realtime
   - You should see your visit appear within 30 seconds

---

## 📹 Step 2: Set Up Microsoft Clarity (Optional but Recommended)

### Why Clarity?
- **See exactly what users do** on your site via session recordings
- **Heatmaps** show where people click, scroll, and spend time
- Find usability issues you didn't know existed
- **100% FREE with unlimited recordings**

### Setup Instructions:

1. **Create a Microsoft Clarity account**
   - Go to: https://clarity.microsoft.com/
   - Sign in with Microsoft, Google, or Facebook account

2. **Create a new project**
   - Project name: "Hop On Sintra"
   - Website URL: Your production URL

3. **Get your Project ID**
   - After creating the project, Clarity will show you a Project ID
   - It looks like: `abcdefghij`

4. **Add to your website**
   - Open `/App.tsx`
   - Find line 24: `const CLARITY_PROJECT_ID = "";`
   - Add your Project ID between the quotes
   - **Example:** `const CLARITY_PROJECT_ID = "abcdefghij";`

5. **Verify it's working**
   - Save and deploy your changes
   - Visit your website
   - In Clarity dashboard, you should see "Recording" status turn green

---

## 📊 What Gets Tracked Automatically

Once set up, the following events are automatically tracked:

### Booking Funnel
- ✅ Booking flow started
- ✅ Date selected
- ✅ Passengers added
- ✅ Optional items added (attractions, guided tour)
- ✅ Checkout started
- ✅ Purchase completed

### Engagement
- ✅ Page views
- ✅ Attraction page views
- ✅ Blog article views
- ✅ Live chat opened
- ✅ WhatsApp clicked
- ✅ Language changed

### Conversions
- ✅ Day pass purchased
- ✅ Attraction tickets purchased
- ✅ Sunset special purchased
- ✅ Private tour inquiry

### Service Usage
- ✅ Pickup requests
- ✅ Booking viewed
- ✅ Ticket downloaded

---

## 🎨 How to Track Custom Events

The analytics system is ready for you to track custom events. Here's how:

### Example: Track when someone clicks "Book Now"

```typescript
import analytics from './lib/analytics';

// In your component:
const handleBookNowClick = () => {
  analytics.bookingFlowStarted('homepage-cta');
  onNavigate('buy-ticket');
};
```

### Example: Track attraction ticket purchase

```typescript
import analytics from './lib/analytics';

const handleTicketPurchase = (attractionName: string, price: number) => {
  analytics.attractionTicketPurchased(attractionName, price);
};
```

### Available Tracking Functions

All available tracking functions are in `/lib/analytics.ts`:

- `analytics.bookingFlowStarted(source?)`
- `analytics.dateSelected(date)`
- `analytics.passengersAdded(count)`
- `analytics.optionalItemAdded(itemType, itemName, price)`
- `analytics.checkoutStarted(totalValue, passengers)`
- `analytics.purchaseCompleted(...)`
- `analytics.attractionViewed(id, name)`
- `analytics.attractionTicketPurchased(name, price)`
- `analytics.chatOpened()`
- `analytics.whatsappClicked()`
- `analytics.pickupRequested(location, bookingId?)`
- `analytics.languageChanged(fromLang, toLang)`
- `analytics.blogArticleViewed(slug, title)`
- `analytics.privateToursViewed()`
- `analytics.privateTourInquiry()`
- `analytics.sunsetSpecialViewed()`
- `analytics.sunsetSpecialPurchased(...)`
- `analytics.bookingError(errorMessage, step)`
- `analytics.paymentError(errorMessage)`
- `analytics.bookingViewed(bookingId)`
- `analytics.ticketDownloaded(bookingId, format)`
- And many more...

---

## 📈 Key Metrics to Monitor

### In Google Analytics:

1. **Acquisition Overview**
   - Where are your visitors coming from?
   - Which marketing channels work best?

2. **Booking Funnel**
   - How many people complete bookings?
   - Where do they drop off?

3. **E-commerce**
   - Total revenue
   - Average booking value
   - Conversion rate

4. **Content Performance**
   - Most viewed attractions
   - Most read blog articles
   - Time spent on pages

### In Microsoft Clarity:

1. **Heatmaps**
   - Are users finding the "Book Now" button?
   - Which attractions get the most clicks?

2. **Session Recordings**
   - Watch users complete bookings
   - Identify confusing UI elements
   - See mobile vs desktop behavior

3. **Rage Clicks**
   - Find broken or unresponsive elements
   - Improve user experience

---

## 🔒 Privacy & GDPR Compliance

Both GA4 and Clarity are configured to respect user privacy:

- ✅ Cookie consent is already implemented on your site
- ✅ IP anonymization enabled
- ✅ No personally identifiable information (PII) tracked
- ✅ Users can opt out via cookie settings

**Note:** Your Privacy Policy should mention the use of analytics. Update `/components/PrivacyPolicyPage.tsx` if needed.

---

## 🎯 Quick Start Checklist

- [ ] Get GA4 Measurement ID from https://analytics.google.com/
- [ ] Add GA4 ID to `/App.tsx` line 23
- [ ] Get Clarity Project ID from https://clarity.microsoft.com/
- [ ] Add Clarity ID to `/App.tsx` line 24
- [ ] Deploy changes to production
- [ ] Verify both tools show live data
- [ ] Set up GA4 e-commerce reports
- [ ] Review first week of data
- [ ] Adjust marketing based on insights

---

## 🆘 Troubleshooting

### GA4 not showing data?
1. Make sure you replaced `G-XXXXXXXXXX` with your actual ID
2. Check browser console for errors
3. Verify you're using GA4 (not Universal Analytics)
4. Wait up to 24 hours for data to appear in reports (Realtime works immediately)

### Clarity not recording?
1. Verify your Project ID is correct
2. Check if ad blockers are preventing the script
3. Make sure you're on the production URL (not localhost)
4. Try visiting in an incognito window

### Events not appearing?
1. Check the browser console for JavaScript errors
2. Verify you imported `analytics` correctly
3. Make sure the event function is being called
4. Test in GA4 DebugView (enable via browser extension)

---

## 📞 Support

For analytics questions:
- Google Analytics: https://support.google.com/analytics
- Microsoft Clarity: https://learn.microsoft.com/en-us/clarity/

For implementation questions, check:
- `/components/GoogleAnalytics.tsx`
- `/components/MicrosoftClarity.tsx`
- `/lib/analytics.ts`

---

**Ready to get started?** Follow Step 1 above to set up Google Analytics 4 first!
