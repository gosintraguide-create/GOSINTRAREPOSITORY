# Analytics Quick Reference

## 🚀 Setup (5 minutes)

### Google Analytics 4
1. Get ID: https://analytics.google.com/ → Admin → Data Streams
2. Edit `/App.tsx` line 23: `const GA_MEASUREMENT_ID = "G-YOUR-ID-HERE";`
3. Deploy and verify in GA4 Realtime

### Microsoft Clarity (Optional)
1. Get ID: https://clarity.microsoft.com/ → New Project
2. Edit `/App.tsx` line 24: `const CLARITY_PROJECT_ID = "your-id-here";`
3. Deploy and check Clarity dashboard

---

## 📊 Your Analytics Stack

| Tool | Purpose | Cost | Status |
|------|---------|------|--------|
| **Vercel Analytics** | Performance & basic views | Free | ✅ Active |
| **Google Analytics 4** | Comprehensive tracking | Free | ⚠️ Setup required |
| **Microsoft Clarity** | Heatmaps & recordings | Free | ⚠️ Optional |

---

## 🎯 Most Important Metrics

### Track These Weekly:

1. **Conversion Rate** (GA4)
   - Bookings ÷ Visitors
   - Target: 2-5%

2. **Average Booking Value** (GA4)
   - Total revenue ÷ Number of bookings
   - Track trends over time

3. **Traffic Sources** (GA4)
   - Which channels bring most bookings?
   - Focus marketing on best performers

4. **Booking Funnel** (GA4)
   - Where do users drop off?
   - Fix the biggest drop-off points

5. **Session Recordings** (Clarity)
   - Watch 5-10 user sessions weekly
   - Identify UX issues

---

## 🔧 Common Event Tracking

Import analytics:
```typescript
import analytics from './lib/analytics';
```

Track events:
```typescript
// Booking started
analytics.bookingFlowStarted('homepage-hero');

// Purchase completed
analytics.purchaseCompleted(
  bookingId,
  totalValue,
  passengers,
  hasGuidedTour,
  attractionCount
);

// Attraction viewed
analytics.attractionViewed('pena-palace', 'Pena Palace');

// Error occurred
analytics.bookingError(errorMessage, 'payment');
```

---

## 📈 Where to Find Data

### Google Analytics 4 Dashboard
- **Home** → Overview of key metrics
- **Reports → Realtime** → Live visitors right now
- **Reports → Acquisition** → Where visitors come from
- **Reports → Engagement → Events** → All tracked events
- **Reports → Monetization → Ecommerce** → Revenue & conversions

### Microsoft Clarity Dashboard
- **Dashboard** → Overview & live sessions
- **Recordings** → Watch user sessions
- **Heatmaps** → See clicks & scrolls
- **Insights** → Rage clicks & dead clicks

### Vercel Analytics
- Vercel Dashboard → Your Project → Analytics
- Core Web Vitals & page performance

---

## ⚡ Pro Tips

1. **Set up GA4 Goals**
   - Mark "purchase" as key conversion
   - Set up funnel visualization

2. **Create Custom Dashboards**
   - GA4: Explore → Create custom report
   - Track your most important metrics

3. **Set Up Alerts**
   - GA4: Configure → Custom alerts
   - Get notified of traffic spikes or drops

4. **Weekly Review Routine**
   - Monday morning: Check last week's data
   - Review conversion rate trends
   - Watch 5 Clarity session recordings
   - Adjust marketing based on insights

5. **A/B Testing Ideas from Analytics**
   - High drop-off at date selection? Test different UI
   - Low attraction page views? Improve homepage promotion
   - High cart abandonment? Review payment flow

---

## 🔐 Privacy Compliance

✅ Cookie consent banner active  
✅ IP anonymization enabled  
✅ No PII collected  
✅ GDPR compliant  
✅ Users can opt out

---

## 📱 Mobile vs Desktop

Track performance separately:
- GA4: Reports → Tech → Overview → Device Category
- Clarity: Filter recordings by device type

Optimize the platform where you get most traffic!

---

## 💡 Quick Wins from Analytics

**Week 1-2:** Establish baseline metrics  
**Week 3-4:** Identify top traffic sources → Invest more  
**Week 5-6:** Fix biggest funnel drop-off point  
**Week 7-8:** Review Clarity recordings → Fix UX issues  
**Week 9-10:** A/B test homepage CTA based on heatmaps  
**Ongoing:** Monitor conversion rate weekly

---

## 🆘 Common Issues

**"No data showing"**
- Wait 24-48 hours for historical reports
- Realtime should work immediately
- Check measurement ID is correct

**"Events not tracking"**
- Check browser console for errors
- Verify analytics import is correct
- Test in incognito mode (ad blockers)

**"Different numbers in each tool"**
- Normal! Each tool counts differently
- Use GA4 as primary source of truth
- Clarity for qualitative insights

---

**Need help?** See full documentation in `/ANALYTICS_SETUP.md`
