# Edge Function Deployment Guide

## Error: "Failed to fetch"

If you're seeing `TypeError: Failed to fetch` when trying to check the database, this means the Supabase Edge Function is not accessible. This guide will help you fix it.

## Quick Diagnosis

### Step 1: Run the Health Check

1. Go to: **Admin → Diagnostics**
2. Find the **Edge Function Health Check** card (should be at the top)
3. Click **"Check Health"**

### What the Results Mean:

| Result | What It Means | Next Steps |
|--------|---------------|------------|
| ✅ Green "Edge Function is healthy!" | Working perfectly! | Continue to Database Diagnostics below |
| ❌ "Failed to fetch" | Edge Function not deployed | Follow deployment instructions below |
| ❌ Status 404 | Endpoint doesn't exist | Function not deployed or wrong path |
| ❌ Status 401 | Authentication failed | Check Supabase credentials |
| ❌ Status 500 | Server error | Check Edge Function logs |

## How to Deploy the Edge Function

### Option 1: Deploy from Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
   - Or use the "Open Supabase Edge Functions Dashboard" button in the Health Check

2. **Check Current Status:**
   - Look for a function named: `make-server-3bd0ade8`
   - If it doesn't exist → You need to deploy it
   - If it exists but shows "paused" → Resume it

3. **Deploy the Function:**
   
   Unfortunately, Supabase Edge Functions must be deployed from your local machine or CI/CD.
   The dashboard only shows deployment status, it can't deploy for you.
   
   Continue to Option 2 below.

### Option 2: Deploy from Local Machine (Recommended)

#### Prerequisites:

```bash
# Install Supabase CLI
npm install -g supabase

# Or with Homebrew (Mac)
brew install supabase/tap/supabase
```

#### Deployment Steps:

```bash
# 1. Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_ID

# 2. Deploy all Edge Functions
supabase functions deploy

# Or deploy just this function
supabase functions deploy make-server-3bd0ade8

# 3. Check deployment status
supabase functions list
```

#### Expected Output:

```
Deploying Function...
Version: 1.0.0
Created At: 2025-01-...
Verify Enabled: true
Deployment Status: DEPLOYED ✅
```

### Option 3: Deploy via GitHub Actions (CI/CD)

If you're using GitHub, you can set up automatic deployment:

1. **Create `.github/workflows/deploy-functions.yml`:**

```yaml
name: Deploy Edge Functions

on:
  push:
    branches:
      - main
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Deploy functions
        run: supabase functions deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

2. **Add Secrets to GitHub:**
   - Go to: Repository → Settings → Secrets
   - Add: `SUPABASE_ACCESS_TOKEN` (from Supabase dashboard)
   - Add: `SUPABASE_PROJECT_ID` (your project ref)

3. **Push to trigger deployment:**

```bash
git add .
git commit -m "Deploy Edge Functions"
git push
```

## Verify Deployment

### Method 1: Using the Health Check Tool

1. Admin → Diagnostics
2. Click "Check Health" 
3. Should show ✅ Green success

### Method 2: Using cURL

```bash
# Replace YOUR_PROJECT_ID with your actual project ID
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/health

# Expected response:
{"status":"ok","timestamp":"2025-01-18T..."}
```

### Method 3: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions
2. Find: `make-server-3bd0ade8`
3. Status should show: "Active" or "Deployed"
4. Click on it to see logs

## Common Issues

### Issue 1: "Command not found: supabase"

**Solution:** Install Supabase CLI

```bash
# NPM
npm install -g supabase

# Homebrew (Mac)
brew install supabase/tap/supabase

# Manual download
# https://github.com/supabase/cli/releases
```

### Issue 2: "Failed to link project"

**Solution:** Login to Supabase first

```bash
supabase login
# Follow the browser prompt to authenticate

supabase link --project-ref YOUR_PROJECT_ID
```

### Issue 3: "Permission denied"

**Solution:** Check your Supabase access token

```bash
# Get a new access token from Supabase dashboard
# Settings → API → Service Role Key

# Set it as environment variable
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Then try deploying again
supabase functions deploy
```

### Issue 4: "Build failed"

**Solution:** Check for syntax errors

```bash
# Check the function code
cat supabase/functions/server/index.tsx

# Common issues:
# - Missing imports
# - Syntax errors
# - Missing dependencies in import statements
```

### Issue 5: "CORS errors in browser"

**Solution:** Already fixed in the latest code!

The CORS configuration has been updated to allow all origins during development.

If you still see CORS errors:

1. Make sure you deployed the latest version of the Edge Function
2. Check browser console for the exact error
3. Verify the function is actually deployed (use health check)

## Environment Variables

The Edge Function needs these environment variables in Supabase:

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `SUPABASE_URL` | Auto-provided by Supabase | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase | ✅ Yes |
| `SUPABASE_ANON_KEY` | Auto-provided by Supabase | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | ✅ Yes |
| `RESEND_API_KEY` | Resend Dashboard | ✅ Yes |

These are automatically provided by Supabase except for Stripe and Resend keys.

**To add missing keys:**

1. Supabase Dashboard → Project Settings → Edge Functions
2. Click "Manage Secrets"
3. Add your API keys

## Testing After Deployment

### Full Test Checklist:

```bash
# 1. Health Check
✅ Admin → Diagnostics → "Check Health"

# 2. Database Check  
✅ Admin → Diagnostics → "Test Connection"

# 3. Run Diagnostics
✅ Admin → Diagnostics → "Run Diagnostics"

# 4. Test Booking
✅ Make a test booking to verify full flow

# 5. Check Logs
✅ Supabase Dashboard → Functions → Logs
```

## Deployment Checklist

Use this checklist when deploying:

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Environment variables set in Supabase
- [ ] Function code has no syntax errors
- [ ] Deploy function (`supabase functions deploy`)
- [ ] Check deployment status (`supabase functions list`)
- [ ] Run health check (Admin → Diagnostics)
- [ ] Test database connection
- [ ] Verify in Supabase Dashboard
- [ ] Check function logs for errors

## Alternative: Local Development

If you can't deploy to Supabase yet, you can run locally:

```bash
# 1. Install Supabase CLI (see above)

# 2. Start Supabase locally
supabase start

# 3. Run the Edge Function locally
supabase functions serve make-server-3bd0ade8

# 4. Update your frontend to use localhost
# In /utils/supabase/info.tsx, temporarily change:
# projectId = "localhost:54321"  // Local Supabase
```

**Note:** Local development is for testing only. You'll need to deploy for production.

## Getting Help

### Check Logs:

```bash
# View live logs during deployment
supabase functions logs make-server-3bd0ade8 --tail

# View recent logs
supabase functions logs make-server-3bd0ade8
```

### In Supabase Dashboard:

1. Go to: Functions → make-server-3bd0ade8 → Logs
2. Look for errors in red
3. Common errors:
   - Missing environment variables
   - Import errors
   - Runtime errors

### Still Stuck?

1. Check browser console (F12) for detailed errors
2. Use the Health Check tool for diagnostic info
3. Review Edge Function logs in Supabase
4. Check that all environment variables are set
5. Verify your code matches the latest version

## Summary

The "Failed to fetch" error means:

1. ❌ The Edge Function is not deployed or not accessible
2. ✅ Solution: Deploy it using Supabase CLI
3. ✅ Verify: Use the Health Check tool

Once the Health Check shows green, all other features (Database Diagnostics, etc.) will work!

## Quick Commands Reference

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy
supabase functions deploy make-server-3bd0ade8

# Check status
supabase functions list

# View logs
supabase functions logs make-server-3bd0ade8

# Test with cURL
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/health
```

---

**Next:** After deployment succeeds, proceed to test Database Diagnostics!
