# Real-time Module Cache Clear Instructions

## Issue
After implementing real-time availability sync, you may see the error:
```
TypeError: Failed to fetch dynamically imported module
```

This is caused by browser cache holding old module versions with outdated timestamps.

## ⚡ QUICKEST SOLUTION: Automated Cache Clear Page

**Navigate to this URL to automatically clear all caches:**
```
https://your-site-url.com/clear-cache-redirect.html
```

This page will:
1. ✅ Clear all service worker caches
2. ✅ Unregister service workers
3. ✅ Clear localStorage (preserving your session)
4. ✅ Clear sessionStorage
5. ✅ Clear IndexedDB
6. ✅ Automatically redirect you back to the home page

**Just visit the URL and wait 3-5 seconds!**

## Alternative Solutions (Choose ONE method)

### ⚡ Method 1: Use Clear Cache Button (RECOMMENDED - Easiest)
1. Navigate to the Admin Console
2. Go to the "Settings" or "Tools" tab
3. Click the "Clear All Caches & Reload" button
4. Wait for automatic reload
5. ✅ Done! The page will reload with fresh modules

### 🔧 Method 2: Hard Refresh (Quick)
1. **Windows/Linux**: Press `Ctrl + Shift + R` or `Ctrl + F5`
2. **Mac**: Press `Cmd + Shift + R`
3. This forces the browser to bypass cache and reload all resources
4. If error persists, try 2-3 more times

### 🛠️ Method 3: Developer Tools Cache Clear (Most Thorough)
1. Open Developer Tools (`F12`)
2. Right-click on the refresh/reload button (while DevTools is open)
3. Select **"Empty Cache and Hard Reload"**
4. Wait for page to fully reload

### 🧹 Method 4: Manual Service Worker Clear (Nuclear Option)
1. Open Developer Tools (`F12`)
2. Go to **"Application"** tab (or "Storage" in Firefox)
3. In the left sidebar:
   - Click **"Service Workers"**
   - Click **"Unregister"** next to any service worker
   - Click **"Clear storage"** 
   - Check ALL boxes (Cache, Local Storage, etc.)
   - Click **"Clear site data"**
4. Close DevTools
5. Close the browser tab completely
6. Reopen in a new tab

### 🕵️ Method 5: Incognito/Private Window (For Testing Only)
1. Open a new incognito/private browser window
2. Navigate to your site URL
3. This loads without any cached data
4. Note: Changes won't persist after closing the window

## Verification - How to Know It's Working

After clearing cache successfully, you should see:

### Visual Indicators:
- ✅ **Green "Live" badge** near the time slot section with a pulsing radio icon
- ✅ **"Updated XX:XX" timestamp** showing last update time
- ✅ **Real-time updates** when admins change availability (with toast notification)

### Console Logs (Open DevTools F12 → Console):
```
🔴 Setting up real-time availability subscription for date: 2026-04-16
🔴 Subscription status: SUBSCRIBED
✅ Real-time subscription active for availability
✅ Supabase client created with realtime enabled
```

### When Admin Changes Availability:
```
🔴 Real-time availability update received: {new: {...}, old: {...}}
```

## What Changed

### Code Changes:
1. ✅ Added Supabase Realtime subscription to `/components/SellTicketsForm.tsx`
2. ✅ Import of `createClient` from `../utils/supabase/client`
3. ✅ Real-time WebSocket connection monitoring availability changes
4. ✅ Auto-update UI when seat counts change in database

### Configuration Changes:
1. ✅ Service worker cache version bumped: `go-sintra-v9` → `go-sintra-v10`
2. ✅ Added `@supabase/supabase-js` to Vite optimizeDeps
3. ✅ Database key format: `availability_YYYY-MM-DD` (e.g., `availability_2026-04-16`)

## Troubleshooting

### Error Still Appears After Cache Clear?
1. **Check Network Tab** (DevTools F12 → Network)
   - Look for failed requests with status 404 or CORS errors
   - Check if `App.tsx` loads successfully
   
2. **Check Console Errors** (DevTools F12 → Console)
   - Look for import errors or module resolution failures
   - Verify Supabase client initializes properly

3. **Try Different Browser**
   - Sometimes browser-specific caching is aggressive
   - Test in Chrome, Firefox, or Safari

### Real-time Updates Not Working?
1. **Check Console for Subscription Status**
   - Should see: `Subscription status: SUBSCRIBED`
   - If you see `CHANNEL_ERROR` or `TIMED_OUT`, check network connection

2. **Verify Database Configuration**
   - Realtime must be enabled for `kv_store_3bd0ade8` table in Supabase
   - Check Supabase Dashboard → Database → Replication

3. **Test with Manual Refresh**
   - Click the "Refresh" button to manually reload availability
   - This confirms the API is working even if real-time isn't

## For Developers

### Why This Happens:
- Vite dev server adds timestamp query params to modules for cache busting
- Service workers can aggressively cache these timestamped URLs
- When code changes, old cached modules with old timestamps become invalid
- New code tries to load modules with new timestamps that aren't cached

### The Fix:
- Bumping service worker cache version (`CACHE_NAME`) forces cache invalidation
- Adding `@supabase/supabase-js` to `optimizeDeps` ensures consistent bundling
- Hard refresh bypasses all caching layers

### Cache Invalidation Strategy:
- Service Worker: Network-first for navigation, stale-while-revalidate for assets
- New version `v10` automatically clears old `v1-v9` caches on activation
- However, service worker script itself may be cached, requiring manual intervention