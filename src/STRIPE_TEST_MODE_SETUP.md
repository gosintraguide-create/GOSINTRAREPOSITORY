# ✅ Stripe Test Mode Setup - Action Required

## 🎯 What You Need to Do

You've provided new Stripe **TEST mode** keys. To activate them:

### Step 1: Update Supabase Environment Variables

🔗 **Go here:** https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions

Update these two secrets:

| Secret Name | New Value |
|-------------|-----------|
| **STRIPE_PUBLISHABLE_KEY** | `pk_test_51SHXlZJVoVAJealRtS3M6i53Jz8uas7LUwsqs5lAdlLG64mxzYu8FCSwIjSdmY4GAc7XUyH6muXtVWdSSNg6l8LB00APHphxAH` |
| **STRIPE_SECRET_KEY** | `sk_test_51SHXlZJVoVAJealRFRyHKeVmiVxMwaqvQBNO4BesEz4K2OKVD2OBaQFrd46TLTGtDbVJ7jZmk7TeSAmFugurxDkV00zzUFKm8z` |

**How to Update:**
1. Click each secret name
2. Click "Edit" or pencil icon
3. Paste the new test key
4. Click "Save" or "Update"

### Step 2: Wait 30 Seconds
The edge function will automatically pick up the new values. No redeployment needed!

### Step 3: Test a Payment

1. Go to: https://www.hoponsintra.com/buy-ticket
2. Add a day pass
3. Proceed to checkout
4. Use this test card:
   - **Card:** 4242 4242 4242 4242
   - **Expiry:** 12/25 (any future date)
   - **CVC:** 123 (any 3 digits)
   - **ZIP:** 12345 (any 5 digits)

5. Complete the payment
6. You should see success! ✅

### Step 4: Verify in Stripe Dashboard

🔗 Go to: https://dashboard.stripe.com/test/payments

**Important:** Make sure the "Test mode" toggle is **ON** (top right corner)

You should see your test payment listed!

---

## 📋 Quick Command

Run this to see your keys and checklist:

```bash
npm run verify-stripe
```

---

## 🔄 What Changed?

### Before (Live Mode):
- Keys started with `pk_live_` and `sk_live_`
- Real credit card charges
- Live customer data

### After (Test Mode):
- Keys start with `pk_test_` and `sk_test_`
- ✅ **No real charges!** Safe to test
- Use test credit cards
- Separate test dashboard

---

## 📚 Documentation Created

I've created comprehensive guides for you:

1. **`/UPDATE_STRIPE_KEYS.md`** - Detailed instructions with troubleshooting
2. **`/QUICK_REFERENCE.md`** - Updated with test mode info
3. **`/scripts/verify-stripe.js`** - Helper script to display keys
4. **This file** - Quick action steps

---

## ⚠️ Important Notes

### About Test Mode:
- ✅ Perfect for development and testing
- ✅ No real money involved
- ✅ Can test payment flows safely
- ❌ Real customers can't make actual purchases
- ❌ Only test cards work

### About Security:
- ✅ Secret key is stored in Supabase (server-side) ← Secure!
- ✅ Publishable key is fetched from backend ← Good!
- ✅ No keys are hard-coded in frontend ← Perfect!
- ⚠️ Never commit secret keys to Git

### About Going Live:
When you're ready for real payments:
1. Get your live mode keys from Stripe
2. Update the same two secrets in Supabase
3. Replace `pk_test_` → `pk_live_`
4. Replace `sk_test_` → `sk_live_`

---

## 🧪 Test Cards Reference

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | ✅ Success |
| 4000 0000 0000 0002 | ❌ Card declined |
| 4000 0000 0000 9995 | ❌ Insufficient funds |
| 4000 0025 0000 3155 | 🔒 Requires 3D Secure |

**More test cards:** https://stripe.com/docs/testing#cards

---

## ✅ Success Checklist

- [ ] Updated `STRIPE_PUBLISHABLE_KEY` in Supabase
- [ ] Updated `STRIPE_SECRET_KEY` in Supabase
- [ ] Waited 30 seconds for changes to propagate
- [ ] Tested payment with 4242 4242 4242 4242
- [ ] Saw success confirmation page
- [ ] Verified payment in Stripe test dashboard
- [ ] Checked booking created in admin panel

---

## ❓ Need Help?

**If payment fails:**
1. Check `/UPDATE_STRIPE_KEYS.md` for troubleshooting
2. Verify keys were saved correctly in Supabase
3. Check browser console for errors
4. Check Supabase edge function logs

**Common Issues:**
- "Stripe not initialized" → Secret key not set
- "Payment configuration not available" → Publishable key not set
- "Invalid API key" → Keys still from live mode

---

**Ready? Go update those keys in Supabase!** 🚀

The application code is already set up to work with test mode - you just need to update the environment variables.
