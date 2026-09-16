import { env } from "node:process"
import type { ManifestV3Export } from "@crxjs/vite-plugin"
import packageJson from "./package.json" with { type: "json" }

const { version, name, displayName, description } = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, "")
  // split into version parts
  .split(/[.-]/)

export default {
  author: {
    email: "lukman.nakib@gmail.com",
  },
  name: env.mode === "staging" ? `[INTERNAL] ${name}` : displayName || name,
  description,
  // up to four numbers separated by dots
  version: [major, minor, patch, label].filter(Boolean).join("."),
  // semver is OK in "version_name"
  version_name: version,
  manifest_version: 3,
  minimum_chrome_version: "104",
  action: {
    default_title: "Quick Search",
    default_icon: {
      16: "src/assets/logo-16x16.png",
      32: "src/assets/logo-32x32.png",
      48: "src/assets/logo-48x48.png",
      128: "src/assets/logo-128-128.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  options_ui: {
    page: "src/ui/options/index.html",
    open_in_tab: true,
  },
  omnibox: {
    keyword: "qs",
  },
  offline_enabled: true,
  permissions: ["storage", "tabs", "windows", "history", "bookmarks", "favicon"],
  host_permissions: ["https://suggestqueries.google.com/*"],
  commands: {
    "open-launcher": {
      suggested_key: {
        default: "Ctrl+Shift+Space",
        mac: "Command+Shift+Space",
      },
      description: "Open Quick Search",
    },
  },
  icons: {
    16: "src/assets/logo-16x16.png",
    32: "src/assets/logo-32x32.png",
    48: "src/assets/logo-48x48.png",
    128: "src/assets/logo-128-128.png",
  },
} as ManifestV3Export
