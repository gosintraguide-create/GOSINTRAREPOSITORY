# Troubleshooting Flowchart

## Quick Diagnosis Tree

```
START: Having issues?
│
├─ Error: "Failed to fetch"?
│  │
│  ├─ YES → Go to: FIX_FAILED_TO_FETCH.md
│  │        Deploy Edge Function
│  │        ✅ SOLVED!
│  │
│  └─ NO → Continue below
│
├─ Admin → Diagnostics working?
│  │
│  ├─ NO → Check browser console
│  │        │
│  │        ├─ CORS error? → Deploy latest Edge Function
│  │        ├─ Network error? → Check internet connection
│  │        └─ Other error? → Check server logs
│  │
│  └─ YES → Continue below
│
├─ Edge Function Health Check green?
│  │
│  ├─ NO → See: EDGE_FUNCTION_DEPLOYMENT_GUIDE.md
│  │        Deploy the Edge Function
│  │        ✅ SOLVED!
│  │
│  └─ YES → Continue below
│
├─ Database Connection Test green?
│  │
│  ├─ NO → Check error message
│  │        │
│  │        ├─ "Table doesn't exist"
│  │        │   → Make a booking or save content
│  │        │   → Table will be created automatically
│  │        │   ✅ SOLVED!
│  │        │
│  │        ├─ "Permission denied"
│  │        │   → Check SUPABASE_SERVICE_ROLE_KEY
│  │        │   → Verify in Supabase Dashboard
│  │        │   ✅ SOLVED!
│  │        │
│  │        └─ Other error
│  │            → See: DIAGNOSTICS_TROUBLESHOOTING.md
│  │
│  └─ YES → Continue below
│
├─ Run Diagnostics shows duplicates?
│  │
│  ├─ YES → Click "Clean Up Duplicates"
│  │        → Re-run diagnostics
│  │        ✅ SOLVED!
│  │
│  └─ NO → Everything is working! 🎉
│
├─ Content won't save?
│  │
│  ├─ Check which system:
│  │   │
│  │   ├─ Simple Content Manager
│  │   │   → Saves to: website_content
│  │   │   → Check server logs
│  │   │
│  │   └─ Advanced Content Editor
│  │       → Saves to: comprehensive_content
│  │       → Check server logs
│  │
│  └─ See: DATABASE_SAVE_FIX.md
│
├─ "0 Storage Requests" in Supabase?
│  │
│  └─ This is NORMAL! ✅
│      → See: SUPABASE_STORAGE_EXPLAINED.md
│      → You use Database, not Storage
│
├─ "Duplicate" warnings in Supabase?
│  │
│  └─ This is NORMAL! ✅
│      → See: DATABASE_STATUS.md
│      → This is upsert behavior
│      → Only worry if diagnostics show duplicates
│
└─ Other issue?
    │
    ├─ Deployment issues → DEPLOY_CHECKLIST.md
    ├─ Vercel issues → VERCEL_TROUBLESHOOTING.md
    ├─ Build issues → BUILD_DIRECTORY_GUIDE.md
    └─ General help → DOCUMENTATION_INDEX.md
```

## Quick Decision Matrix

| Symptom              | Document to Read                                                         | Quick Fix                |
| -------------------- | ------------------------------------------------------------------------ | ------------------------ |
| "Failed to fetch"    | [FIX_FAILED_TO_FETCH.md](./FIX_FAILED_TO_FETCH.md)                       | Deploy Edge Function     |
| Health Check fails   | [EDGE_FUNCTION_DEPLOYMENT_GUIDE.md](./EDGE_FUNCTION_DEPLOYMENT_GUIDE.md) | Deploy Edge Function     |
| Database test fails  | [DIAGNOSTICS_TROUBLESHOOTING.md](./DIAGNOSTICS_TROUBLESHOOTING.md)       | Check table exists       |
| Shows duplicates     | [DATABASE_STATUS.md](./DATABASE_STATUS.md)                               | Click "Clean Up"         |
| 0 Storage requests   | [SUPABASE_STORAGE_EXPLAINED.md](./SUPABASE_STORAGE_EXPLAINED.md)         | Normal! No action needed |
| "Duplicate" warnings | [DATABASE_STATUS.md](./DATABASE_STATUS.md)                               | Normal! No action needed |
| Content won't save   | [DATABASE_SAVE_FIX.md](./DATABASE_SAVE_FIX.md)                           | Check server logs        |
| Vercel errors        | [VERCEL_TROUBLESHOOTING.md](./VERCEL_TROUBLESHOOTING.md)                 | Check build logs         |
| Build fails          | [BUILD_DIRECTORY_GUIDE.md](./BUILD_DIRECTORY_GUIDE.md)                   | Check vite.config.ts     |

## Step-by-Step Diagnostic Process

### Level 1: Basic Health

```bash
1. Open site → Admin → Diagnostics
2. Click "Check Health"
   ✅ Green? → Continue to Level 2
   ❌ Red? → See: FIX_FAILED_TO_FETCH.md
```

### Level 2: Database Connection

```bash
1. Click "Test Connection"
   ✅ Green? → Continue to Level 3
   ❌ Red? → Check error, see: DIAGNOSTICS_TROUBLESHOOTING.md
```

### Level 3: Database Integrity

```bash
1. Click "Run Diagnostics"
   ✅ No duplicates? → Everything works! 🎉
   ❌ Has duplicates? → Click "Clean Up Duplicates"
```

### Level 4: Full System Test

```bash
1. Admin → Content Manager → Make a change → Save
   ✅ Success? → Content system works!
   ❌ Failed? → Check server logs

2. Make a test booking
   ✅ Success? → Booking system works!
   ❌ Failed? → Check Stripe/payment logs

3. Try QR scanner
   ✅ Works? → Complete system operational!
   ❌ Failed? → Check camera permissions
```

## Common Error Messages & Solutions

| Error Message                                 | What It Means              | How to Fix                                         |
| --------------------------------------------- | -------------------------- | -------------------------------------------------- |
| `TypeError: Failed to fetch`                  | Edge Function not deployed | [FIX_FAILED_TO_FETCH.md](./FIX_FAILED_TO_FETCH.md) |
| `Status 404`                                  | Endpoint doesn't exist     | Deploy Edge Function                               |
| `Status 401`                                  | Auth failed                | Check API keys                                     |
| `Status 500`                                  | Server error               | Check function logs                                |
| `relation "kv_store_3bd0ade8" does not exist` | Table not created yet      | Make a booking or save content                     |
| `Permission denied`                           | Wrong API key              | Use SERVICE_ROLE_KEY                               |
| `CORS error`                                  | Origin not allowed         | Redeploy with latest code                          |
| `Network error`                               | Can't reach server         | Check internet connection                          |

## Priority Order for Fixing Issues

### 🔥 Critical (Fix First)

1. Edge Function not deployed → Blocks everything
2. Database connection fails → Blocks data operations
3. Build fails → Can't deploy

### ⚠️ Important (Fix Soon)

1. Content saves fail → Blocks content updates
2. Bookings fail → Blocks revenue
3. Emails not sending → Poor user experience

### ℹ️ Informational (Not Actually Problems)

1. "0 Storage requests" → Normal, ignore
2. "Duplicate" warnings → Normal, ignore
3. Rows = Keys in diagnostics → Perfect, ignore

## When to Use Each Tool

### Health Check

**When:** First thing to check when anything doesn't work  
**Purpose:** Verify Edge Function is deployed and accessible  
**Action:** Admin → Diagnostics → "Check Health"

### Database Test

**When:** Health Check passes but data operations fail  
**Purpose:** Verify database connection and table exists  
**Action:** Admin → Diagnostics → "Test Connection"

### Run Diagnostics

**When:** Everything seems to work but data might be corrupted  
**Purpose:** Check for duplicate rows in database  
**Action:** Admin → Diagnostics → "Run Diagnostics"

### Clean Up Duplicates

**When:** Diagnostics shows duplicate rows  
**Purpose:** Remove duplicate data  
**Action:** Admin → Diagnostics → "Clean Up Duplicates"

### Server Logs

**When:** Any backend operation fails  
**Purpose:** See detailed error messages  
**Action:** Supabase Dashboard → Functions → make-server-3bd0ade8 → Logs

### Browser Console

**When:** Frontend errors or network issues  
**Purpose:** See client-side errors and network requests  
**Action:** Press F12 → Console tab

## Success Indicators

### ✅ Everything Working:

- Health Check: Green ✅
- Database Test: Green ✅
- Run Diagnostics: No duplicates ✅
- Content saves: Success ✅
- Bookings work: Success ✅
- No console errors: Clean ✅

### ⚠️ Partial Issues:

- Health Check: Green ✅
- Database Test: Red ❌ → Table doesn't exist yet (normal for new installs)
- Run Diagnostics: Works but shows warning → Check what warning says

### ❌ Major Issues:

- Health Check: Red ❌ → Edge Function not deployed
- Database Test: Can't run → Health Check must pass first
- Multiple console errors → Check server logs

## Quick Command Reference

```bash
# Check if Edge Function is deployed
supabase functions list

# View logs
supabase functions logs make-server-3bd0ade8

# Redeploy
supabase functions deploy make-server-3bd0ade8

# Test with cURL
curl https://dwiznaefeqnduglmcivr.supabase.co/functions/v1/make-server-3bd0ade8/health

# Check database
# Supabase Dashboard → SQL Editor:
SELECT COUNT(*) FROM kv_store_3bd0ade8;
```

## Final Troubleshooting Checklist

When you have an issue, go through this checklist:

- [ ] 1. Check browser console (F12) for errors
- [ ] 2. Run Health Check (Admin → Diagnostics)
- [ ] 3. Check if Edge Function is deployed (`supabase functions list`)
- [ ] 4. View server logs (Supabase Dashboard)
- [ ] 5. Test database connection
- [ ] 6. Verify environment variables are set
- [ ] 7. Check internet connection
- [ ] 8. Try in incognito mode (rules out cache issues)
- [ ] 9. Check Supabase project is active (not paused)
- [ ] 10. Review recent code changes

## Getting Unstuck

If you're stuck after trying everything:

1. **Start fresh with Health Check**
   - Ignore other errors for now
   - Focus on getting Health Check green
   - Everything else depends on this

2. **Read the error message carefully**
   - What exactly does it say?
   - Look up that specific error in this doc

3. **Check the logs**
   - Browser console (F12)
   - Server logs (Supabase Dashboard)
   - Look for red error messages

4. **Compare with working state**
   - Did this ever work?
   - What changed since it worked?
   - Can you rollback that change?

5. **Use the diagnostic tools**
   - Health Check
   - Database Test
   - Run Diagnostics
   - They're designed to help you!

---

**Remember:** Most issues are actually normal behavior (like "0 storage requests" or "duplicate warnings"). Use the diagnostic tools to verify what's actually a problem vs what's expected!