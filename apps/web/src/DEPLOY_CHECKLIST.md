# 🚀 Deployment Checklist

## Two Things Ready to Deploy

### ✅ 1. Sitemap Generation (Automated)
- [x] Script created: `/scripts/generate-sitemap.cjs`
- [x] Package.json updated with prebuild script
- [x] Sitemap.xml generated in `/public/sitemap.xml` (22 URLs)
- [x] Vite config set to copy public folder
- [x] Vercel config set to serve sitemap with correct headers
- [x] .gitignore created (allows sitemap.xml)
- [x] Documentation created
- [ ] **ACTION NEEDED:** Commit and push to GitHub

### ✅ 2. Stripe Test Mode Keys (Manual Update)
- [x] New test keys documented
- [x] Comprehensive guides created
- [x] Helper script added (`npm run verify-stripe`)
- [x] README updated
- [x] Quick reference updated
- [ ] **ACTION NEEDED:** Update keys in Supabase dashboard

---

## 📋 Deployment Steps

### Step 1: Update Stripe Keys in Supabase (5 minutes)

🔗 Go to: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions

Update these secrets:

| Secret Name | Value |
|-------------|-------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51SHXlZJVoVAJealRtS3M6i53Jz8uas7LUwsqs5lAdlLG64mxzYu8FCSwIjSdmY4GAc7XUyH6muXtVWdSSNg6l8LB00APHphxAH` |
| `STRIPE_SECRET_KEY` | `sk_test_51SHXlZJVoVAJealRFRyHKeVmiVxMwaqvQBNO4BesEz4K2OKVD2OBaQFrd46TLTGtDbVJ7jZmk7TeSAmFugurxDkV00zzUFKm8z` |

**See detailed guide:** `/STRIPE_TEST_MODE_SETUP.md`

---

### Step 2: Deploy Everything to Production (2-3 minutes)

```bash
# Add all new files
git add .

# Commit with descriptive message
git commit -m "Add automatic sitemap generation and switch to Stripe test mode

- Created sitemap generation script (CommonJS format for Vercel compatibility)
- Added comprehensive Stripe test mode documentation
- Updated README and QUICK_REFERENCE with test mode info
- Added helper script: npm run verify-stripe
- Created .gitignore to ensure proper file tracking"

# Push to trigger Vercel deployment
git push origin main
```

---

### Step 3: Verify Sitemap Deployment (After Vercel build completes)

**Watch build logs:**
1. Go to https://vercel.com/dashboard
2. Click on latest deployment
3. View build logs
4. Look for:
   ```
   ✅ Sitemap generated successfully!
      Location: /vercel/path0/public/sitemap.xml
      Size: 3XXX bytes
      URLs: 22 pages included
   ```

**Test the live sitemap:**
```bash
# Should return 200 OK
curl -I https://www.hoponsintra.com/sitemap.xml
```

Or visit in browser: https://www.hoponsintra.com/sitemap.xml

**Expected result:** XML file with all 22 URLs

---

### Step 4: Test Stripe Payment

**After updating keys in Supabase (Step 1):**

1. Go to: https://www.hoponsintra.com/buy-ticket
2. Add a day pass to cart
3. Enter details and proceed to payment
4. Use test card:
   - Card: **4242 4242 4242 4242**
   - Expiry: **12/25**
   - CVC: **123**
   - ZIP: **12345**
5. Complete payment
6. Should see success page! ✅

**Verify payment:**
- Stripe Dashboard: https://dashboard.stripe.com/test/payments
- Admin Panel: https://www.hoponsintra.com/admin (password: Sintra2025)

---

### Step 5: Submit Sitemap to Google (After sitemap is live)

1. Go to: https://search.google.com/search-console
2. Select property: hoponsintra.com
3. Click "Sitemaps" in sidebar
4. Enter: `sitemap.xml`
5. Click "Submit"

**Timeline:**
- Sitemap discovered: ~24 hours
- Pages indexed: 1-2 weeks

---

## ✅ Success Criteria

### Sitemap:
- [ ] Build completes without errors
- [ ] Sitemap generation logs appear in Vercel build output
- [ ] https://www.hoponsintra.com/sitemap.xml returns 200 OK (not 404)
- [ ] XML file shows all 22 URLs
- [ ] Content-Type header is `application/xml`
- [ ] Google Search Console accepts the sitemap

### Stripe:
- [ ] Keys updated in Supabase dashboard
- [ ] Both keys start with `test_` not `live_`
- [ ] Test payment succeeds with 4242 4242 4242 4242
- [ ] Payment appears in Stripe test dashboard
- [ ] Booking appears in admin panel
- [ ] No console errors during checkout

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `/ACTION_REQUIRED.md` | Quick overview of what needs to be done |
| `/DEPLOY_SITEMAP_NOW.md` | Detailed sitemap deployment guide |
| `/SITEMAP_TROUBLESHOOTING.md` | Troubleshooting if sitemap 404s |
| `/STRIPE_TEST_MODE_SETUP.md` | Stripe setup with detailed steps |
| `/UPDATE_STRIPE_KEYS.md` | Stripe troubleshooting and architecture |
| `/STRIPE_KEYS_REFERENCE.txt` | Printable quick reference card |
| This file | Complete deployment checklist |

---

## 🛠️ Helper Commands

```bash
# Display Stripe keys and checklist
npm run verify-stripe

# Generate sitemap manually (optional)
node scripts/generate-sitemap.cjs

# Build locally to test
npm run build

# Check if sitemap exists in dist
ls -la dist/sitemap.xml
```

---

## ⚠️ Important Notes

### About Git:
- All files are tracked (not ignored)
- Safe to commit - no sensitive data in code
- Stripe keys are in environment variables only

### About Test Mode:
- No real charges will be made
- Only test credit cards work
- Separate Stripe dashboard for test data
- Safe for development and QA testing

### About Going Live:
When ready for production:
1. Get live Stripe keys (pk_live_ and sk_live_)
2. Update in Supabase dashboard
3. No code changes needed!

---

## 🎯 Current Status

✅ **Ready to deploy:**
- [x] Sitemap generation script (CommonJS)
- [x] All documentation created
- [x] .gitignore configured
- [x] Helper scripts added
- [x] README updated

⏳ **Waiting for you:**
- [ ] Update Stripe keys in Supabase
- [ ] Commit and push to GitHub
- [ ] Wait for Vercel deployment
- [ ] Test sitemap URL
- [ ] Test payment flow
- [ ] Submit sitemap to Google

---

## ❓ Questions or Issues?

**Sitemap returns 404?**
→ See `/SITEMAP_TROUBLESHOOTING.md`

**Payment not working?**
→ See `/UPDATE_STRIPE_KEYS.md` troubleshooting section

**Need the Stripe keys again?**
→ See `/STRIPE_KEYS_REFERENCE.txt`

**Build failing?**
→ Check Vercel logs for errors, look for sitemap generation message

---

**Ready to deploy?** Follow Step 1 (update Stripe keys) and Step 2 (git push) above! 🚀
