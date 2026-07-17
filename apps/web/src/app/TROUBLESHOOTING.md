# 🔧 Troubleshooting "Unexpected token '<'" Error

## What This Error Means

The error `SyntaxError: Unexpected token '<'` occurs when JavaScript tries to parse HTML (which starts with `<`) as if it were JavaScript code. This typically happens when:

1. **A module file returns a 404 error** - The server returns an HTML 404 page instead of the JavaScript file
2. **Cached files are outdated** - Your browser is loading old/corrupted cached files
3. **Build artifacts are corrupted** - The build process created invalid files

## Quick Fixes (Try These First)

### Fix 1: Clear Browser Cache (Most Common Solution)

#### Chrome/Edge/Brave:
1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Select "All time"
3. Check "Cached images and files"
4. Click "Clear data"
5. **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

#### Firefox:
1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Select "Everything"
3. Check "Cache"
4. Click "Clear Now"
5. **Hard refresh**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

#### Safari:
1. Safari menu → Preferences → Advanced
2. Check "Show Develop menu"
3. Develop menu → Empty Caches
4. **Hard refresh**: `Cmd+Option+R`

### Fix 2: Use the Automatic Cache Clear Tool

Visit this URL to automatically clear all cache:
```
http://localhost:5173/fix-errors.html
```

Or in production:
```
https://your-site.com/fix-errors.html
```

Click "Clear & Reload" button.

### Fix 3: Clear Application Data (DevTools)

1. Open DevTools (`F12` or `Ctrl+Shift+I`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, find "Clear storage" or "Clear site data"
4. Click "Clear site data"
5. Close DevTools and refresh the page

### Fix 4: Rebuild the Project (Development)

If you're running the project locally:

```bash
# Stop the dev server (Ctrl+C)

# Clear node_modules cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Fix 5: Complete Clean Build (Development)

```bash
# Stop the dev server (Ctrl+C)

# Remove all build artifacts
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite

# Reinstall dependencies (optional, but thorough)
rm -rf node_modules
npm install

# Rebuild
npm run dev
```

## Advanced Troubleshooting

### Check Console for Exact Error

1. Open DevTools (`F12`)
2. Go to **Console** tab
3. Look for the full error message - it will show which file is causing the issue

Example:
```
Uncaught SyntaxError: Unexpected token '<' 
    at /src/components/SomeComponent.tsx:1
```

The file path tells you which module is failing to load.

### Check Network Tab

1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Refresh the page
4. Look for any files with:
   - **Status code 404** (Not Found)
   - **Type: document** instead of **Type: script**

If you see a `.tsx` or `.js` file returning HTML (document), that's your problem file.

### Common Problematic Files

Based on the error, check these files:

- `/src/main.tsx` - Entry point
- `/App.tsx` - Main app component
- `/components/BuyTicketPage.tsx` - Recently modified
- `/components/StripePaymentForm.tsx` - Payment component
- Any lazy-loaded components in `/App.tsx`

### Verify File Exports

Make sure all components have proper exports:

```typescript
// ✅ Correct - Named export
export function MyComponent() { ... }

// ✅ Correct - Default export
export default function MyComponent() { ... }

// ❌ Wrong - No export
function MyComponent() { ... }
```

### Check Import Statements

Make sure all imports match the exports:

```typescript
// If the component uses 'export function ComponentName'
import { ComponentName } from './path/to/file';

// If the component uses 'export default'
import ComponentName from './path/to/file';
```

## Production-Specific Fixes

### If Error Occurs on Deployed Site (Vercel)

1. **Redeploy from Vercel Dashboard**
   - Go to your Vercel dashboard
   - Click "Redeploy" on the latest deployment

2. **Clear Vercel Edge Cache**
   - Add `?nocache=${Date.now()}` to your URL
   - Example: `https://yoursite.com?nocache=1234567890`

3. **Force Clear User Cache**
   - Share this link with users: `https://yoursite.com/fix-errors.html`

4. **Check Build Logs**
   - Vercel Dashboard → Deployments → Click deployment → View build logs
   - Look for any build errors or warnings

## Nuclear Option (If Nothing Else Works)

### For Development:

```bash
# Complete reset
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm package-lock.json

# Fresh install
npm install
npm run dev
```

### For Users Having Issues:

Ask them to:
1. Clear all browser data for your site
2. Try in an incognito/private window
3. Try a different browser
4. Disable browser extensions

## Prevention

### For Developers:

- Always test builds locally before deploying: `npm run build && npm run preview`
- Don't modify files in the `dist` folder directly
- Keep dependencies up to date: `npm update`

### For Users:

The app has automatic cache clearing built-in. If issues persist:
- Visit: `/fix-errors.html?auto-clear=true`

## Still Having Issues?

If none of these fixes work, please provide:

1. **Full error message** from browser console
2. **Which file** is causing the error (from console or Network tab)
3. **Environment**: Development (localhost) or Production (live site)
4. **Browser and version**: Chrome 120, Firefox 121, etc.
5. **Steps to reproduce**: What you did before the error appeared

## Technical Explanation

The error occurs when:

```javascript
// JavaScript expects something like:
import { MyComponent } from './components/MyComponent';

// But the server returns:
<!DOCTYPE html>
<html>
  <head><title>404 Not Found</title></head>
  ...
</html>
```

JavaScript sees the `<` character at the start of the HTML and throws the error because `<` is not valid JavaScript syntax (outside of JSX, which is transpiled).

This happens when:
- The file doesn't exist (404)
- The build didn't include the file
- The cache is serving an old/corrupt version
- The path is wrong
