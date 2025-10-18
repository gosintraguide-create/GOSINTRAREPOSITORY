#!/bin/bash

# Test Build Script for Go Sintra
# This script validates that the build works locally before deploying to Vercel

echo "🧪 Go Sintra - Build Test Script"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node version
echo "📋 Step 1: Checking Node version..."
NODE_VERSION=$(node -v)
echo "   Node version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18" ]]; then
  echo -e "${RED}❌ Error: Node version must be 18 or higher${NC}"
  echo "   Please upgrade Node.js"
  exit 1
else
  echo -e "${GREEN}✅ Node version is compatible${NC}"
fi
echo ""

# Step 2: Validate package.json
echo "📋 Step 2: Validating package.json..."
if node -e "require('./package.json')" 2>/dev/null; then
  echo -e "${GREEN}✅ package.json is valid JSON${NC}"
else
  echo -e "${RED}❌ package.json has syntax errors${NC}"
  exit 1
fi
echo ""

# Step 3: Validate vercel.json
echo "📋 Step 3: Validating vercel.json..."
if node -e "require('./vercel.json')" 2>/dev/null; then
  echo -e "${GREEN}✅ vercel.json is valid JSON${NC}"
else
  echo -e "${RED}❌ vercel.json has syntax errors${NC}"
  exit 1
fi
echo ""

# Step 4: Check if node_modules exists
echo "📋 Step 4: Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
  npm install
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✅ Dependencies installed${NC}"
fi
echo ""

# Step 5: Clean previous build
echo "📋 Step 5: Cleaning previous build..."
if [ -d "Build" ]; then
  rm -rf Build
  echo -e "${GREEN}✅ Previous build cleaned${NC}"
elif [ -d "dist" ]; then
  rm -rf dist
  echo -e "${GREEN}✅ Previous build cleaned (old dist folder)${NC}"
else
  echo "   No previous build found (this is fine)"
fi
echo ""

# Step 6: Run the build
echo "📋 Step 6: Running build command..."
echo "   Command: npm run build"
echo ""
npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ BUILD FAILED${NC}"
  echo "   Check the error messages above"
  echo "   Common issues:"
  echo "   - TypeScript errors"
  echo "   - Missing dependencies"
  echo "   - Import path errors"
  exit 1
fi
echo ""

# Step 7: Verify Build folder was created
echo "📋 Step 7: Verifying build output..."
if [ ! -d "Build" ]; then
  echo -e "${RED}❌ Build folder was not created${NC}"
  echo "   The build command completed but didn't create output"
  exit 1
fi

# Check for index.html
if [ ! -f "Build/index.html" ]; then
  echo -e "${RED}❌ Build/index.html not found${NC}"
  exit 1
fi

# Check for assets folder
if [ ! -d "Build/assets" ]; then
  echo -e "${YELLOW}⚠️  Build/assets folder not found${NC}"
  echo "   This might be okay if assets are inlined"
fi

echo -e "${GREEN}✅ Build output verified${NC}"
echo ""

# Step 8: Show build statistics
echo "📋 Step 8: Build statistics..."
echo "   Build folder size:"
du -sh Build
echo ""
echo "   Files in Build:"
ls -lh Build/
echo ""

if [ -d "Build/assets" ]; then
  echo "   Files in Build/assets:"
  ls -lh Build/assets/ | head -10
  ASSET_COUNT=$(ls -1 Build/assets/ | wc -l)
  if [ $ASSET_COUNT -gt 10 ]; then
    echo "   ... and $(($ASSET_COUNT - 10)) more files"
  fi
  echo ""
fi

# Success!
echo "================================="
echo -e "${GREEN}✅ BUILD TEST PASSED!${NC}"
echo ""
echo "Your build is ready for Vercel deployment!"
echo ""
echo "Next steps:"
echo "1. Commit and push to GitHub:"
echo "   git add ."
echo "   git commit -m \"Fix vercel.json syntax error\""
echo "   git push origin main"
echo ""
echo "2. Vercel will automatically deploy, OR"
echo "   Deploy manually via CLI:"
echo "   npm install -g vercel"
echo "   vercel --prod"
echo ""
echo "🚀 Good luck!"
