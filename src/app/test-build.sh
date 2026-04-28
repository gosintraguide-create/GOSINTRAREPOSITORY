#!/bin/bash

echo "🔍 Testing Vercel Build Configuration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ npm install failed${NC}"
        exit 1
    fi
fi

# Run TypeScript check
echo -e "${YELLOW}🔎 Running TypeScript type check...${NC}"
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript check failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"
echo ""

# Run build
echo -e "${YELLOW}🏗️  Building production bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist folder not created${NC}"
    exit 1
fi
echo -e "${GREEN}✅ dist folder created${NC}"

# Check if index.html exists in dist
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ dist/index.html not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ dist/index.html exists${NC}"

# Check if assets folder exists
if [ ! -d "dist/assets" ]; then
    echo -e "${RED}❌ dist/assets folder not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ dist/assets folder exists${NC}"

# Check public files
echo ""
echo -e "${YELLOW}📁 Checking public files...${NC}"
for file in manifest.json sw.js offline.html 404.html robots.txt sitemap.xml; do
    if [ -f "dist/$file" ]; then
        echo -e "${GREEN}✅ $file copied to dist${NC}"
    else
        echo -e "${RED}⚠️  $file not found in dist${NC}"
    fi
done

# List dist contents
echo ""
echo -e "${YELLOW}📦 dist folder contents:${NC}"
ls -lh dist/

echo ""
echo -e "${GREEN}🎉 Build test completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run 'npm run preview' to test the build locally"
echo "2. Visit http://localhost:4173 and test different routes"
echo "3. Commit and push to deploy to Vercel"
