#!/bin/bash

# Build and Test Script for Quick Search Extension
# This script ensures a clean production build for testing

echo "🧹 Cleaning previous build..."
rm -rf dist/chrome

echo "🔨 Building Chrome extension for production..."
pnpm build:chrome

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 To test the extension:"
    echo "1. Open Chrome and go to chrome://extensions/"
    echo "2. Enable 'Developer mode' (toggle in top right)"
    echo "3. Click 'Load unpacked'"
    echo "4. Select the 'dist/chrome' directory"
    echo ""
    echo "📂 Extension files are in: $(pwd)/dist/chrome"
    echo "📦 Zip file for store upload: $(pwd)/dist/chrome-0.0.1.zip"
else
    echo "❌ Build failed!"
    exit 1
fi
