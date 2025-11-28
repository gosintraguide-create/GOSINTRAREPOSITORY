# 🔍 Login Network Error - Troubleshooting Guide

## What's the Error?

You're seeing a "Network error" when trying to log in. This typically means the frontend cannot connect to the backend (Supabase Edge Function).

---

## Quick Test

Open browser console (F12) and go to the login page. Try to log in and you should now see detailed logs:

```
🔐 Verifying booking login...
📍 Login URL: https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login
📡 Response status: XXX
```

This will tell us exactly what's happening.

---

## Common Causes & Solutions

### 1️⃣ Edge Function Not Deployed

**Check if backend is running:**

Open this URL in your browser:
```
https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Hop On Sintra API is running"
}
```

**If you get 404 or error:**
- Edge function is not deployed
- Go to: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/functions
- Check if `server` function exists and is deployed

---

### 2️⃣ CORS Issue

**Symptom:** Console shows CORS error

**Fix:** The server already has CORS configured, but check:

```typescript
// In /supabase/functions/server/index.tsx
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

If CORS headers are missing, the edge function needs to be redeployed.

---

### 3️⃣ Environment Variables Missing

**Check these secrets exist in Supabase:**

Go to: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions

Required secrets:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`

These should be auto-provided by Supabase.

---

### 4️⃣ Frontend Connection Issue

**Test the endpoint manually:**

```bash
curl -X POST \
  https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/verify-booking-login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"bookingId":"TEST","lastName":"Test"}'
```

Replace `YOUR_ANON_KEY` with the actual anon key from `/utils/supabase/info.tsx`

**Expected Response:**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

This means the endpoint works, just no booking found (which is expected for test data).

---

## Testing with Enhanced Logging

I've added detailed console logging to both login flows:

### User Login (Booking ID + Last Name)
- File: `/lib/sessionManager.ts`
- Endpoint: `/verify-booking-login`

### Driver Login
- File: `/components/DriverLoginPage.tsx`
- Endpoint: `/drivers/login`

**To see logs:**
1. Open browser console (F12)
2. Go to login page
3. Try to log in
4. Check console for detailed error messages

---

## Step-by-Step Debugging

### Step 1: Check Health Endpoint
```
https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/health
```

- ✅ **Works?** → Backend is running, go to Step 2
- ❌ **404?** → Edge function not deployed, see "Deploy Edge Function" below

### Step 2: Check Console Logs
Open F12 console and try login:

- See `📍 Login URL`? → Good, request is being made
- See `📡 Response status: 200`? → Request succeeded
- See `❌ Login error: Failed to fetch`? → Network/CORS issue

### Step 3: Test with Valid Credentials
You need a real booking to test user login:

1. Go to: https://www.hoponsintra.com/admin (password: Sintra2025)
2. Check "Bookings" tab for a real booking
3. Note the Booking ID and Last Name
4. Try logging in with those

For driver login, you need a driver account created in the admin panel.

---

## Deploy Edge Function (If Not Running)

If the health check returns 404, deploy the edge function:

### Using Supabase CLI:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dwiznaefeqnduglmcivr

# Deploy the function
supabase functions deploy server
```

### Using Supabase Dashboard:

The edge function code is in `/supabase/functions/server/index.tsx`

Unfortunately, you can't deploy via the dashboard UI - you need the CLI.

---

## Quick Fixes

### Fix 1: Redeploy Everything

```bash
# Push latest code to GitHub
git add .
git commit -m "Add enhanced login error logging"
git push

# This won't deploy edge functions, only frontend
```

**Note:** Edge functions are separate from Vercel deployment. They need to be deployed via Supabase CLI.

### Fix 2: Check if Backend is Reachable

Open browser console and run:

```javascript
fetch('https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend is running:', d))
  .catch(e => console.error('❌ Backend unreachable:', e));
```

---

## What I Changed

✅ **Added detailed logging:**
- `/lib/sessionManager.ts` - User login with booking verification
- `/components/DriverLoginPage.tsx` - Driver login

✅ **Better error messages:**
- Shows specific network connectivity issues
- Distinguishes between server errors vs network errors
- Logs full request/response flow

✅ **Enhanced error handling:**
- Detects fetch failures separately from API errors
- Provides actionable error messages

---

## Next Steps

1. **Open the login page with console open (F12)**
2. **Try to log in and read the console logs**
3. **Share the console output** if error persists

The logs will show exactly where the request fails:
- Before fetch? → Frontend issue
- During fetch? → Network/CORS issue  
- After fetch with error response? → Backend issue
- Response 404? → Edge function not deployed

---

## Emergency: Test Without Backend

If you need to test the frontend without backend, you can temporarily mock the login:

```typescript
// In sessionManager.ts - TEMPORARY TEST ONLY
export async function verifyAndLogin(...) {
  // Mock successful login for testing
  const session: UserSession = {
    bookingId: "TEST-123",
    lastName: "Test",
    customerName: "Test User",
    customerEmail: "test@test.com",
    customerPhone: "",
    passes: 2,
    visitDate: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
  };
  
  saveSession(session);
  return { success: true, session };
}
```

**⚠️ Remove this after testing!**

---

## Contact Info

If you need help deploying the edge function or the issue persists:

1. Check Supabase dashboard for edge function status
2. Review Supabase edge function logs
3. Share the browser console output from login attempt

The enhanced logging will make it much easier to diagnose the exact issue!
