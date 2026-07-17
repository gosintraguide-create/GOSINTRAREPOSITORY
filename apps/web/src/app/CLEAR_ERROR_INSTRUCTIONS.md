# How to Fix "Unexpected token '<'" Error

This error occurs when JavaScript tries to parse HTML instead of a JS module. This is typically a **cache/build issue**, not a syntax error.

## Quick Fix (Try these in order):

### 1. Hard Refresh Browser
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + Shift + Delete` then clear cache
- **Safari**: `Cmd + Option + E`

### 2. Clear Vite Cache & Restart Dev Server
```bash
# Stop the dev server (Ctrl+C)

# Clear node modules cache
rm -rf node_modules/.vite

# Clear dist folder
rm -rf dist

# Restart dev server
npm run dev
```

### 3. Full Cache Clear (if above doesn't work)
```bash
# Stop dev server

# Clear all caches
rm -rf node_modules/.vite
rm -rf dist
rm -rf .parcel-cache

# Clear browser storage
# Open DevTools > Application > Clear Storage > Clear All

# Restart
npm run dev
```

### 4. Browser-Specific Fix
1. Open DevTools (F12)
2. Go to **Network** tab
3. Check "Disable cache" checkbox
4. Refresh page (F5)

### 5. Incognito/Private Mode Test
Open your app in an incognito window to test without cache:
- **Chrome**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`
- **Safari**: `Cmd + Shift + N`

## Why This Happens

The error means a JavaScript import tried to load a module but received HTML instead. Common causes:

1. **Stale cache**: Old build artifacts cached by browser or Vite
2. **Module not found**: Vite returns 404 HTML page, browser tries to parse as JS  
3. **Build mismatch**: Source changed but browser loaded old bundle

## Prevention

- Always use hard refresh when developing
- Clear Vite cache periodically
- Use browser DevTools with cache disabled during development

## Still Not Working?

If the error persists after trying all above:

1. Check browser console for the specific file causing the error
2. Look for 404 errors in Network tab
3. Verify all imports in that file exist
4. Try `npm clean-install` to rebuild node_modules

---

**The good news**: All your code is syntactically correct! This is just a caching issue.
