# Database Diagnostics Troubleshooting Guide

## Quick Tests

### 1. Test Database Connection (Simplest Test)
1. Go to: **Admin → Diagnostics**
2. Find the **Database Diagnostics** card
3. Click **"Test Connection"**

**Expected Result:**
- ✅ Green alert: "Database Connected! Found X rows in kv_store_3bd0ade8"

**If it fails:**
- Check the error message
- Verify your Supabase credentials are set correctly
- Check the hints provided in the error

### 2. Run Full Diagnostics
1. After connection test succeeds
2. Click **"Run Diagnostics"**

**Expected Result:**
- ✅ Shows total keys and total rows
- ✅ "All good! No duplicate rows found"
- ✅ Explanation about upsert behavior

## Common Issues & Solutions

### Issue 1: "Failed to run diagnostics"

**Possible Causes:**
1. Edge Function not deployed
2. Supabase credentials incorrect
3. Network/CORS issue
4. Table doesn't exist

**Solutions:**

#### Check Edge Function Status
```bash
# In Supabase Dashboard
1. Go to Edge Functions
2. Look for "make-server-3bd0ade8"
3. Should show as deployed and healthy
```

#### Verify Table Exists
```sql
-- In Supabase SQL Editor
SELECT * FROM kv_store_3bd0ade8 LIMIT 5;
```

If table doesn't exist, it will be created on first booking or when you save content.

#### Check Browser Console
```javascript
// Open browser DevTools (F12)
// Look in Console tab for errors
// Should see:
🔍 Testing database connection...
Response status: 200
✅ Database check passed
```

### Issue 2: "Database query failed"

**Error Message:** `relation "kv_store_3bd0ade8" does not exist`

**Solution:**
The table hasn't been created yet. Create it by:

1. **Option A:** Make a test booking (will create table)
2. **Option B:** Save content in Admin Panel (will create table)
3. **Option C:** Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS kv_store_3bd0ade8 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);
```

### Issue 3: "0 Storage Requests" in Supabase Dashboard

**This is NORMAL!** ✅

Your site uses the **Database** (PostgreSQL table), not **Storage** (blob storage).

- Storage = For files (images, videos, PDFs)
- Database = For structured data (bookings, content, settings)

**What to check instead:**
1. Go to **Table Editor** in Supabase
2. Find table `kv_store_3bd0ade8`
3. You should see rows with keys like:
   - `website_content`
   - `comprehensive_content`
   - `pricing_config`
   - Booking IDs (`AA-0001`, etc.)

See [SUPABASE_STORAGE_EXPLAINED.md](./SUPABASE_STORAGE_EXPLAINED.md) for more details.

### Issue 4: "Duplicate" Warnings in Supabase

**This is NORMAL!** ✅

Supabase shows "duplicate" when it **updates** existing keys (upsert operation).

**What Upsert Does:**
```
If key exists → UPDATE the value (Supabase logs this as "duplicate")
If key doesn't exist → INSERT new row
```

**When to Worry:**
- ❌ If diagnostics show: `totalRows > totalKeys` (actual duplicates)
- ✅ If diagnostics show: `totalRows = totalKeys` (no duplicates, just upsert warnings)

**Example:**
```
Total Keys: 15
Total Rows: 15
Has Duplicates: false

✅ This is perfect! The warnings are just informational.
```

### Issue 5: Network Error / Fetch Failed

**Possible Causes:**
1. CORS issue
2. Wrong Supabase URL
3. Edge function not running
4. Browser blocking requests

**Solutions:**

#### Check CORS Configuration
In `/supabase/functions/server/index.tsx`:
```typescript
app.use("*", cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://go-sintra.vercel.app',  // Your actual domain
  ],
  credentials: true,
}));
```

Make sure your domain is in the `origin` array!

#### Verify Supabase URL
In browser console:
```javascript
// Should show your project ID
console.log(projectId);

// Should show your anon key  
console.log(publicAnonKey);
```

#### Test Edge Function Directly
```bash
# Replace with your project ID
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/health

# Should return:
{"status":"ok","timestamp":"2025-01-..."}
```

### Issue 6: "Permission Denied" or Auth Errors

**Cause:** Using wrong API key

**Solution:**
The diagnostics use the SERVICE_ROLE_KEY (server-side), not the ANON_KEY.

Make sure in `/supabase/functions/server/index.tsx`:
```typescript
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""  // ← Must be SERVICE_ROLE
);
```

## Testing Checklist

Use this checklist to verify everything is working:

### ✅ Step 1: Health Check
```bash
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### ✅ Step 2: Database Connection Test
1. Admin → Diagnostics
2. Click "Test Connection"
3. Should show green "Database Connected!" message

### ✅ Step 3: Run Diagnostics
1. Click "Run Diagnostics"
2. Should show keys and rows count
3. Should show "All good! No duplicate rows found"

### ✅ Step 4: Verify in Supabase Dashboard
1. Go to Table Editor
2. Find `kv_store_3bd0ade8`
3. Should see rows with various keys

### ✅ Step 5: Test Content Save
1. Admin → Content Manager
2. Make any change
3. Click "Save Content Settings"
4. Should see success message
5. Refresh page - changes should persist

### ✅ Step 6: Check Server Logs
1. Supabase → Edge Functions → make-server-3bd0ade8 → Logs
2. Look for:
   - `✅ Database initialized successfully`
   - `✅ Database diagnostics complete: X unique keys, Y total rows`
   - No error messages

## Still Having Issues?

### Get Diagnostic Information

Run these in your browser console (F12):

```javascript
// 1. Test health endpoint
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/health')
  .then(r => r.json())
  .then(console.log);

// 2. Test db-check endpoint
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-3bd0ade8/db-check', {
  headers: { 'Authorization': 'Bearer YOUR_ANON_KEY' }
})
  .then(r => r.json())
  .then(console.log);

// 3. Check current config
console.log({
  projectId: projectId,
  hasAnonKey: !!publicAnonKey,
  currentUrl: window.location.href
});
```

### Check Supabase SQL Editor

Run this query:
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kv_store_3bd0ade8'
);

-- If true, check row count
SELECT COUNT(*) FROM kv_store_3bd0ade8;

-- List all keys
SELECT key FROM kv_store_3bd0ade8 ORDER BY key;

-- Check for duplicates
SELECT key, COUNT(*) as count 
FROM kv_store_3bd0ade8 
GROUP BY key 
HAVING COUNT(*) > 1;
```

## Quick Reference

| Test | Expected Result | If Failed |
|------|----------------|-----------|
| Test Connection | Green "Database Connected!" | Check Supabase credentials |
| Run Diagnostics | Shows keys & rows, no duplicates | Check table exists |
| Storage Requests | 0 (we don't use Storage) | Normal! Not an issue |
| "Duplicate" warnings | Some (from upsert) | Normal! Not an issue |
| Content saves | Success message | Check server logs |

## Understanding the Architecture

```
Your Site (Frontend)
  ↓ fetch()
Supabase Edge Function
  ↓ kv.get/set
Database Utility (kv_store.tsx)
  ↓ SQL upsert
PostgreSQL Database
  ↓
kv_store_3bd0ade8 table
```

**NOT USED:**
- Supabase Storage (blob storage)
- Supabase Auth (guest-only site)

## Summary

Most "issues" are actually normal behavior:

1. ✅ **0 Storage Requests** = Normal (using Database, not Storage)
2. ✅ **"Duplicate" warnings** = Normal (upsert updating keys)
3. ✅ **Diagnostics showing equal keys/rows** = Perfect!

Real issues to worry about:
- ❌ Diagnostics fails with error
- ❌ Content saves fail
- ❌ More rows than keys (actual duplicates)
- ❌ Table doesn't exist

Use the "Test Connection" button first - if that works, everything else should work too!
