# 🔄 Update Stripe Keys to Test Mode

## New Stripe Test Keys

**Publishable Key (Frontend):**
```
pk_test_51SHXlZJVoVAJealRtS3M6i53Jz8uas7LUwsqs5lAdlLG64mxzYu8FCSwIjSdmY4GAc7XUyH6muXtVWdSSNg6l8LB00APHphxAH
```

**Secret Key (Backend):**
```
sk_test_51SHXlZJVoVAJealRFRyHKeVmiVxMwaqvQBNO4BesEz4K2OKVD2OBaQFrd46TLTGtDbVJ7jZmk7TeSAmFugurxDkV00zzUFKm8z
```

---

## Where to Update

### 1. Supabase Dashboard (Backend Keys)

🔗 **Go to:** https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions

**Update these environment variables:**

| Variable Name | New Value |
|---------------|-----------|
| `STRIPE_SECRET_KEY` | `sk_test_51SHXlZJVoVAJealRFRyHKeVmiVxMwaqvQBNO4BesEz4K2OKVD2OBaQFrd46TLTGtDbVJ7jZmk7TeSAmFugurxDkV00zzUFKm8z` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51SHXlZJVoVAJealRtS3M6i53Jz8uas7LUwsqs5lAdlLG64mxzYu8FCSwIjSdmY4GAc7XUyH6muXtVWdSSNg6l8LB00APHphxAH` |

**Steps:**
1. Click "Edge Functions" in left sidebar
2. Click "Functions Settings" or "Secrets" tab
3. Find `STRIPE_SECRET_KEY` → Click "Edit" → Paste new test key → Save
4. Find `STRIPE_PUBLISHABLE_KEY` → Click "Edit" → Paste new test key → Save

**⚠️ Important:** After updating, you may need to redeploy the edge functions:
- Go to Edge Functions page
- Click on `server` function
- Click "Redeploy" button (or it will redeploy automatically on next change)

---

## How the Keys Are Used

### Architecture Flow:

```
Frontend (Stripe Payment Form)
    ↓
  GET /make-server-3bd0ade8/stripe-config
    ↓
Backend (Supabase Edge Function)
    ↓
Returns STRIPE_PUBLISHABLE_KEY from env
    ↓
Frontend loads Stripe.js with publishable key
    ↓
Backend uses STRIPE_SECRET_KEY for API calls
```

### Frontend Code:
- **File:** `/components/StripePaymentForm.tsx`
- **Fetches publishable key** from backend endpoint
- **Does NOT** store key in frontend code or env variables
- **Caches** key in window object for performance

### Backend Code:
- **File:** `/supabase/functions/server/index.tsx`
- **Line 112:** Reads `STRIPE_SECRET_KEY` from Deno environment
- **Line 1546:** Returns `STRIPE_PUBLISHABLE_KEY` to frontend
- **Used for:** Creating payment intents, confirming payments, refunds

---

## Test Mode vs Live Mode

### Current Status: **Switching to TEST MODE** ✅

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| **Real charges** | ❌ No | ✅ Yes |
| **Test cards** | ✅ Works | ❌ Won't work |
| **Stripe dashboard** | Test data | Live data |
| **Webhooks** | Use test webhook signing secret | Use live webhook signing secret |
| **Key prefix** | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |

### Test Credit Cards (for testing payments):

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**More test cards:** https://stripe.com/docs/testing#cards

---

## Verification Steps

### After Updating Keys:

1. **Check Supabase Logs:**
   ```
   Supabase Dashboard → Edge Functions → server → Logs
   ```
   Look for any Stripe-related errors

2. **Test Payment Flow:**
   - Go to: https://www.hoponsintra.com/buy-ticket
   - Add a day pass to cart
   - Proceed to checkout
   - Enter test card: `4242 4242 4242 4242`
   - Complete payment

3. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/payments
   - **Make sure "Test mode" toggle is ON** (top right)
   - You should see the test payment appear

4. **Verify Booking Created:**
   - Go to: https://www.hoponsintra.com/admin (password: Sintra2025)
   - Check "Bookings" tab
   - Test booking should appear

---

## Troubleshooting

### ❌ "Stripe not initialized" Error

**Cause:** Secret key not set or edge function not redeployed

**Fix:**
1. Verify keys are saved in Supabase dashboard
2. Redeploy edge function
3. Wait 30 seconds and try again

### ❌ "Payment configuration not available" Error

**Cause:** Publishable key not set

**Fix:**
1. Set `STRIPE_PUBLISHABLE_KEY` in Supabase dashboard
2. Clear browser cache
3. Refresh page

### ❌ Payments Still Going to Live Mode

**Cause:** Using old live mode keys

**Fix:**
1. Double-check both keys start with `test_`
2. Clear Stripe key from browser cache:
   ```javascript
   // In browser console:
   delete window.STRIPE_PUBLISHABLE_KEY;
   location.reload();
   ```

### ❌ Webhook Errors

**Cause:** Webhook signing secret might be for live mode

**Note:** If you're using webhooks, you also need to update:
- `STRIPE_WEBHOOK_SECRET` in Supabase
- Get test webhook secret from Stripe Dashboard → Developers → Webhooks

---

## Important Notes

✅ **No code changes needed** - Keys are managed via environment variables
✅ **Frontend automatically uses** publishable key from backend
✅ **Secure** - Secret key never exposed to frontend
⚠️ **Remember:** Test mode payments won't create real charges
⚠️ **Before going live:** Switch back to live mode keys

---

## Quick Reference

**Test Mode Keys:**
- Publishable: `pk_test_51SHXlZJVoVAJealR...`
- Secret: `sk_test_51SHXlZJVoVAJealR...`

**Where to Update:**
- https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions

**Test Card:**
- 4242 4242 4242 4242

**Verify:**
- https://dashboard.stripe.com/test/payments
