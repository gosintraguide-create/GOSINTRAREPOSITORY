# Quick Backend Status Check

## The Problem

Your bookings aren't being created and emails aren't being sent because the **Supabase Edge Function is returning 404 errors**. This means the backend service that handles bookings is not accessible.

## Quick Test - Run This in Browser Console

Open your browser console (F12) and paste this code:

```javascript
// Quick backend status check
const projectId = "dwiznaefeqnduglmcivr";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpuYWVmZXFuZHVnbG1jaXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzc5NzYsImV4cCI6MjA3NTc1Mzk3Nn0.cTO16eeGusYnwjVwVVt1i4M8gQZ_MtDxyv9wYFHBVLo";

console.log("🔍 Checking backend status...");
console.log("📍 Project ID:", projectId);

// Test 1: Health endpoint
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/health`, {
  headers: { 'Authorization': `Bearer ${anonKey}` }
})
.then(r => {
  console.log("📡 Health Check Response Status:", r.status, r.statusText);
  if (r.ok) {
    return r.json().then(data => {
      console.log("✅ BACKEND IS RUNNING!");
      console.log("✅ Health data:", data);
    });
  } else {
    console.error("❌ BACKEND NOT ACCESSIBLE");
    console.error("❌ Status:", r.status);
    if (r.status === 404) {
      console.error("❌ 404 = Edge Function not deployed");
      console.error("❌ Solution: Deploy the Edge Function in Supabase");
    }
  }
})
.catch(e => {
  console.error("❌ CANNOT REACH BACKEND");
  console.error("❌ Error:", e.message);
  console.error("❌ This could mean:");
  console.error("   - Edge Function not deployed");
  console.error("   - Network/firewall blocking request");
  console.error("   - Supabase project paused");
});

// Test 2: Bookings endpoint
setTimeout(() => {
  console.log("\n🔍 Testing bookings endpoint...");
  fetch(`https://${projectId}.supabase.co/functions/v1/make-server-3bd0ade8/bookings`, {
    headers: { 'Authorization': `Bearer ${anonKey}` }
  })
  .then(r => {
    console.log("📡 Bookings Endpoint Status:", r.status, r.statusText);
    if (r.status === 404) {
      console.error("❌ BOOKINGS ENDPOINT NOT FOUND (404)");
      console.error("❌ This is why bookings fail!");
    } else if (r.ok) {
      console.log("✅ Bookings endpoint accessible!");
    } else {
      console.log("⚠️ Endpoint exists but returned:", r.status);
    }
  })
  .catch(e => console.error("❌ Cannot reach bookings endpoint:", e.message));
}, 1000);
```

## What the Results Mean

### ✅ SUCCESS - Backend is Running
```
✅ BACKEND IS RUNNING!
✅ Health data: {status: "ok", timestamp: "..."}
```
**Meaning**: Backend is working. If emails still don't send, it's an email configuration issue (not deployment).

### ❌ FAILURE - 404 Not Found
```
❌ BACKEND NOT ACCESSIBLE
❌ Status: 404
❌ 404 = Edge Function not deployed
```
**Meaning**: **The Supabase Edge Function is NOT deployed**. This is your issue.

### ❌ FAILURE - Network Error
```
❌ CANNOT REACH BACKEND
❌ Error: Failed to fetch
```
**Meaning**: Either Edge Function not deployed OR network/CORS issue.

## Solution: Deploy the Edge Function

The Edge Function code exists in your project at:
```
/supabase/functions/server/index.tsx
```

But it needs to be **deployed to Supabase** to be accessible. Here's how:

### Option 1: Check Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/functions
2. Look for function named: `make-server-3bd0ade8`
3. Check if it shows as "Deployed" or "Not Deployed"
4. If not deployed, you need to deploy it

### Option 2: Deploy via Supabase CLI
If you have Supabase CLI installed:
```bash
supabase functions deploy make-server-3bd0ade8
```

### Option 3: Figma Make Auto-Deployment
In Figma Make, the Edge Functions should auto-deploy. If they're not:
1. Try refreshing/reloading the Figma Make preview
2. Wait 2-3 minutes for deployment to complete
3. Re-run the status check above

## Why This Is Happening

When you make a booking:
1. Frontend collects form data ✅
2. Stripe processes payment ✅
3. Frontend calls `/bookings` endpoint to create booking ❌ **FAILS HERE (404)**
4. Backend creates booking in database ⏹️ Never reached
5. Backend generates QR codes ⏹️ Never reached
6. Backend sends email ⏹️ Never reached

The 404 error at step 3 prevents everything else from happening.

## Quick Fix Verification

After deploying, run the status check again. You should see:
```
✅ BACKEND IS RUNNING!
✅ Bookings endpoint accessible!
```

Then try the test email from `/diagnostics` page again.

## Still Not Working?

If backend shows as running but emails still don't work:

1. **Check Edge Function Logs** in Supabase Dashboard
2. **Check Email Service** - Resend API may need domain verification
3. **Run test booking** from `/diagnostics` page and check console for detailed errors

## Environment Variables Check

The Edge Function needs these environment variables in Supabase:
- `SUPABASE_URL` ✅ (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` ✅ (auto-provided)
- `SUPABASE_ANON_KEY` ✅ (auto-provided)
- `STRIPE_SECRET_KEY` (for payments)
- `RESEND_API_KEY` (for emails)

Check these at: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/settings/functions
