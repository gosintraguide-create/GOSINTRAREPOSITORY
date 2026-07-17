# Fix "Failed to fetch" Error - Quick Guide

## 🚨 You're seeing this error:

```
Error checking database: TypeError: Failed to fetch
```

## ✅ Here's the fix:

### The Problem

Your **Supabase Edge Function** is not deployed. The database diagnostics tool can't connect to it.

### The Solution (3 Steps)

#### Step 1: Check if it's deployed

1. Open your site → **Admin → Diagnostics**
2. Look for **"Edge Function Health Check"** (top card)
3. Click **"Check Health"**

**Expected Results:**

| What You See | What It Means |
|--------------|---------------|
| ✅ Green "Edge Function is healthy!" | **SOLVED!** Function is working |
| ❌ Red "Failed to fetch" | Function not deployed → Continue to Step 2 |
| ❌ Red "Status 404" | Function not deployed → Continue to Step 2 |

#### Step 2: Deploy the Edge Function

The Edge Function needs to be deployed to Supabase. You have 3 options:

##### Option A: Deploy from Command Line (Fastest)

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login
supabase login

# 3. Link to your project
supabase link --project-ref dwiznaefeqnduglmcivr

# 4. Deploy the function
supabase functions deploy make-server-3bd0ade8
```

**Expected output:**
```
✅ Deployed Function make-server-3bd0ade8
```

##### Option B: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/dwiznaefeqnduglmcivr/functions
2. Look for: `make-server-3bd0ade8`
3. If it shows "Not deployed" or doesn't exist → Use Option A above

##### Option C: Auto-deploy with GitHub Actions

If you're using GitHub and want automatic deployment:

1. Commit and push your code
2. Set up GitHub Actions (see [EDGE_FUNCTION_DEPLOYMENT_GUIDE.md](./EDGE_FUNCTION_DEPLOYMENT_GUIDE.md))
3. Every push will auto-deploy

#### Step 3: Verify It Works

After deployment:

1. Go back to: **Admin → Diagnostics**
2. Click **"Check Health"** again
3. Should now show: ✅ Green "Edge Function is healthy!"
4. Now you can use **"Test Connection"** and **"Run Diagnostics"**

## 🎯 Quick Reference

### Commands to Deploy:

```bash
# Install CLI (once)
npm install -g supabase

# Login (once)
supabase login

# Link project (once)
supabase link --project-ref dwiznaefeqnduglmcivr

# Deploy (every time you update)
supabase functions deploy make-server-3bd0ade8
```

### How to Verify:

```bash
# Method 1: Use the Health Check tool
Admin → Diagnostics → "Check Health"

# Method 2: Use cURL
curl https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/health

# Should return:
{"status":"ok","timestamp":"..."}
```

## ❓ Common Questions

### Q: I don't have Supabase CLI installed

**A:** Install it:

```bash
# Using NPM
npm install -g supabase

# Using Homebrew (Mac)
brew install supabase/tap/supabase

# Manual download
# https://github.com/supabase/cli/releases
```

### Q: I get "command not found: supabase"

**A:** The CLI isn't in your PATH. Try:

```bash
# Check if it installed
which supabase

# If not found, reinstall with:
npm install -g supabase

# Or add to PATH manually
export PATH="$PATH:$(npm bin -g)"
```

### Q: I get "Failed to link project"

**A:** You need to login first:

```bash
supabase login
# Follow the browser prompt

# Then link again
supabase link --project-ref dwiznaefeqnduglmcivr
```

### Q: Can I deploy from Supabase Dashboard?

**A:** No, Edge Functions must be deployed from CLI or CI/CD. The dashboard only shows status.

### Q: Do I need to redeploy every time I update the code?

**A:** Yes! Any changes to `/supabase/functions/server/` require redeployment:

```bash
supabase functions deploy make-server-3bd0ade8
```

## 📚 More Help

- **Full deployment guide:** [EDGE_FUNCTION_DEPLOYMENT_GUIDE.md](./EDGE_FUNCTION_DEPLOYMENT_GUIDE.md)
- **Database diagnostics:** [DIAGNOSTICS_TROUBLESHOOTING.md](./DIAGNOSTICS_TROUBLESHOOTING.md)
- **All docs:** [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

## 🎉 Success Checklist

After deployment, you should be able to:

- [ ] ✅ Health Check shows green
- [ ] ✅ "Test Connection" works
- [ ] ✅ "Run Diagnostics" works
- [ ] ✅ Content saves successfully
- [ ] ✅ Bookings work
- [ ] ✅ No "Failed to fetch" errors

---

**TL;DR:**

1. Install: `npm install -g supabase`
2. Login: `supabase login`
3. Link: `supabase link --project-ref dwiznaefeqnduglmcivr`
4. Deploy: `supabase functions deploy make-server-3bd0ade8`
5. Test: Admin → Diagnostics → "Check Health"

Done! ✅
