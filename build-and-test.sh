#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")

echo "🧹 Cleaning previous build..."
rm -rf dist/chrome

echo "🔨 Building Chrome extension for production..."
pnpm build:chrome

echo ""
echo "✅ Build successful!"
echo ""
echo "🚀 To test the extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist/chrome' directory"
echo "5. Press Ctrl+Shift+Space (Cmd+Shift+Space on macOS)"
echo ""
echo "📂 Extension files are in: $(pwd)/dist/chrome"
echo "📦 Zip file for store upload: $(pwd)/dist/chrome-${VERSION}.zip"
