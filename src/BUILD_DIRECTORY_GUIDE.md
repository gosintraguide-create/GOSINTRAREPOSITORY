# 📁 Build Directory Guide - Quick Reference

## Before vs After

### Before
```
npm run build
    ↓
Creates: dist/
         ├── index.html
         └── assets/
```

### After (Now)
```
npm run build
    ↓
Creates: Build/
         ├── index.html
         └── assets/
```

## Configuration Files

### vercel.json
```json
{
  "outputDirectory": "Build"  ← Must match vite.config.ts
}
```

### vite.config.ts
```typescript
{
  build: {
    outDir: 'Build'  ← Must match vercel.json
  }
}
```

## Test It Works

```bash
# Clean old builds
rm -rf Build dist

# Build fresh
npm run build

# Check output
ls Build/
# Should show: index.html  assets/
```

## Deploy to Vercel

```bash
git add .
git commit -m "Update output directory to Build"
git push origin main
```

## Verify on Vercel

**Build logs should show:**
```
Running "npm run build"
vite building for production...
Build/index.html created ✓
Deployment ready ✓
```

## Common Issues

### ❌ "Build folder not found"
**Fix:** Check `vite.config.ts` has `outDir: 'Build'`

### ❌ "Vercel can't find output"
**Fix:** Check `vercel.json` has `"outputDirectory": "Build"`

### ❌ "Build folder empty"
**Fix:** Build failed - check error messages

## Quick Commands

```bash
# Test build locally
npm run build

# Clean everything
npm run clean

# Test with script (Mac/Linux)
./test-build.sh

# Test with script (Windows)
test-build.bat
```

## File Locations

| What | Where |
|------|-------|
| Build output | `./Build/` |
| Source files | `./src/`, `./components/`, `./lib/` |
| Config files | `./vercel.json`, `./vite.config.ts` |
| Entry point | `./index.html` |

## That's It!

✅ Output directory is now `Build`  
✅ All configs updated  
✅ Ready to deploy  

Push to deploy! 🚀
