# Quick Search Chrome Extension

A fast and intelligent search extension for Chrome with auto-suggestions, theme support, and customizable keyboard shortcuts.

Built with Vue 3, Vite, and Chrome Extension Manifest V3.

## 🚀 Features

- **Smart Auto-suggestions**: Get suggestions from open tabs and Google search as you type
- **Multiple Search Engines**: Choose from Google, Bing, DuckDuckGo, and Yahoo
- **Light/Dark Theme**: Automatic theme detection with manual toggle
- **Keyboard Shortcuts**: Customizable shortcuts for quick access
- **Recent Searches**: Keep track of your recent searches
- **Privacy Controls**: Clear search history when needed

## ⌨️ Default Keyboard Shortcuts

### Windows/Linux:
- **Ctrl+Shift+Space** - Open Quick Search popup

### macOS:
- **Command+Shift+Space** - Open Quick Search popup

## 🛠️ Installation

### For Development:
1. Clone this repository
2. Run `pnpm install` to install dependencies
3. Run `pnpm build:chrome` to build the extension
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist/chrome` directory

### For Production:
1. Download the latest release
2. Follow steps 4-6 above

## 🎨 Customization

### Theme Settings:
- Click the extension icon
- Click the gear icon (⚙️) to open Settings
- Toggle between light and dark themes

### Keyboard Shortcuts:
- Go to Settings → Keyboard Shortcuts
- Click "Configure Shortcuts" to customize
- Or go directly to `chrome://extensions/shortcuts`

### Search Engine:
- Go to Settings → Search Engine
- Select your preferred default search engine

## 🔧 Development

### Build Commands:
```bash
# Install dependencies
pnpm install

# Build for Chrome
pnpm build:chrome

# Development mode (with hot reload)
pnpm dev:chrome

# Clean build and test
./build-and-test.sh
```

### Project Structure:
```
src/
├── assets/              # Logo and static assets
├── background/          # Background script for API calls
├── components/          # Reusable Vue components
├── composables/         # Vue composables
├── devtools/           # DevTools integration
├── locales/            # Internationalization files
├── stores/             # Pinia state management
├── types/              # TypeScript type definitions
├── ui/
│   ├── action-popup/   # Main search popup
│   └── devtools-panel/ # DevTools panel
└── utils/              # Utility functions
```

## 📦 Build Output

The extension builds to `dist/chrome/` with:
- Optimized JavaScript bundles
- CSS with theme support
- Manifest V3 configuration
- Service worker for background tasks
- Zip file ready for Chrome Web Store

## 🔒 Permissions

The extension requires minimal permissions:
- **storage**: Save user preferences and recent searches
- **tabs**: Access tab information for suggestions
- **host_permissions**: Fetch search suggestions from Google

## 🎯 Browser Support

- Chrome (Manifest V3)
- Chromium-based browsers
- Edge (Chromium)

## 📄 License

MIT License - see LICENSE file for details



## Support

For issues and feature requests, please use the GitHub issue tracker.

---

Built with Vue 3, Vite, and Chrome Extension Manifest V3
