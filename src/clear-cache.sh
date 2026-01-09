#!/bin/bash

# Cache Buster Script for Hop On Sintra
# This script clears all cache and temporary files

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite

echo "🧹 Clearing dist folder..."
rm -rf dist

echo "🧹 Clearing public cache files..."
rm -f public/.cache

echo "✅ Cache cleared!"
echo ""
echo "Now run: npm run dev"
