# 🚀 Hop On Sintra - Quick Reference

**Website:** https://www.hoponsintra.com  
**Admin Panel:** https://www.hoponsintra.com/admin  
**Admin Password:** `Sintra2025`

---

## 🎨 Branding

**Company Name:** Hop On Sintra  
**Primary Color:** Deep Teal `#0A4D5C`  
**Accent Color:** Warm Terracotta `#D97843`  

**Terminology:**
- ✅ "Day Pass" / "Full Day Pass" 
- ✅ "Hop-on/Hop-off Service"
- ❌ NOT "Tour" (unless "Insight Tour")

---

## 🌍 Languages

7 Languages Supported:
- 🇬🇧 English (en)
- 🇵🇹 Portuguese (pt)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇳🇱 Dutch (nl)
- 🇮🇹 Italian (it)

---

## 🔧 Admin Panel Quick Access

| Section | What It Does |
|---------|-------------|
| **Pickups** | Manage customer pickup requests |
| **Bookings** | View all day pass bookings |
| **Messages** | Live chat conversations |
| **Analytics** | Revenue, bookings, trends |
| **More → Drivers** | Manage driver accounts |
| **More → Settings** | Pricing & availability |
| **More → Content** | Edit website text |
| **More → Blog** | Manage blog articles |
| **More → SEO** | SEO tools & analytics |
| **More → Database Cleanup** | Remove old data ✨ NEW |

---

## 🗑️ Database Cleanup (New!)

**Location:** Admin → More → Database Cleanup

**3 Cleanup Options:**

1. **Full Database Cleanup**
   - Removes: Old check-ins, destination tracking, deprecated data
   - When: Run monthly
   - Safe: Yes, protects all bookings

2. **Remove Legacy Branding**
   - Removes: Old "Go Sintra" references
   - When: Run once, or if branding issues appear
   - Safe: Yes, only removes old branding

3. **Clean Old Availability**
   - Removes: Availability records 30+ days old
   - When: Run weekly/monthly
   - Safe: Yes, keeps recent data

---

## 📊 What's Protected

Database cleanup will **NEVER** remove:
- ✅ All bookings (HOP-* records)
- ✅ Website content
- ✅ Pricing configuration
- ✅ Recent availability (last 30 days)
- ✅ Stripe payment data
- ✅ System settings

---

## 🎯 Common Tasks

### Change Pricing
1. Admin → More → Settings
2. Update prices
3. Click Save

### Edit Website Content
1. Admin → More → Content
2. Select language
3. Edit content
4. Click Save

### Add Blog Post
1. Admin → More → Blog
2. Click "Create New Article"
3. Fill in details
4. Publish

### Clean Database
1. Admin → More → Database Cleanup
2. Choose cleanup type
3. Click button
4. View results

---

## 📧 Email Configuration

**Service:** Resend  
**From:** `noreply@hoponsintra.com`  
**Secret:** `RESEND_API_KEY` (already configured)

**Emails Sent:**
- Booking confirmations
- QR codes for day passes
- Payment receipts

---

## 💳 Payment Configuration

**Service:** Stripe  
**Mode:** TEST MODE (Test keys configured)  
**Secrets:** Update in Supabase Dashboard
- `STRIPE_SECRET_KEY` = `sk_test_51SHXlZ...` 
- `STRIPE_PUBLISHABLE_KEY` = `pk_test_51SHXlZ...`

**Test Card:** 4242 4242 4242 4242  
**Stripe Dashboard:** https://dashboard.stripe.com/test/payments  
**Update Keys:** See `/UPDATE_STRIPE_KEYS.md`

**To Switch to Live Mode:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Update both keys with `pk_live_` and `sk_live_` versions
3. Redeploy edge function

---

## 📈 Analytics

**Google Analytics 4:** Configured ✅  
**Tracking ID:** Set in environment  

**What's Tracked:**
- Page views
- Bookings
- Revenue
- User behavior

---

## ⚠️ Important Notes

1. **No Time Estimates** - Don't promise specific durations
2. **Day Pass, Not Tour** - Use correct terminology
3. **7 Languages** - All pages fully translated
4. **Clean URLs** - Using modern routing (no .html)
5. **Mobile-First** - Optimized for mobile devices

---

## 🆘 Troubleshooting

### Console Shows Warnings
- ✅ Fixed! Should show no warnings now
- If new ones appear, check browser console

### Old Branding Appears
1. Go to Admin → More → Database Cleanup
2. Click "Remove Legacy Branding"
3. Refresh website

### Database Too Large
1. Go to Admin → More → Database Cleanup
2. Run "Full Database Cleanup"
3. Run "Clean Old Availability"

### Payment Not Working
1. Check Stripe configuration in Supabase
2. Verify keys are correct
3. Check test vs live mode

---

## 📱 PWA (Progressive Web App)

**Status:** Enabled ✅  
**Features:**
- Add to Home Screen
- Offline support
- Custom app icon
- Fast loading

---

## 🔒 Security

**Admin Access:** Password protected  
**Password:** `Sintra2025`  
**API Keys:** Stored securely in Supabase  
**SSL/HTTPS:** Enabled via Vercel  

---

## 📦 Backups

**Database:** Supabase automatic backups  
**Code:** Git repository  
**Deployment:** Vercel automatic  

---

## 🎉 Recent Updates

**November 21, 2025:**
- ✅ Fixed all console warnings
- ✅ Removed 13 unnecessary files
- ✅ Added database cleanup tools
- ✅ Optimized code and performance
- ✅ Verified "Hop On Sintra" branding throughout

---

## 📞 Support

**For Technical Issues:**
- Check console for errors
- Review error logs in Supabase
- Use database cleanup tools
- Check this Quick Reference

**For Content Updates:**
- Use Admin Panel → Content
- All changes are instant
- Changes sync across languages

---

**Everything is working perfectly! Your site is clean, fast, and ready for customers. 🚀**
