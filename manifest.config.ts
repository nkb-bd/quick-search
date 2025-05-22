import { env } from "node:process"
import type { ManifestV3Export } from "@crxjs/vite-plugin"
import packageJson from "./package.json" with { type: "json" }

const { version, name, displayName } = packageJson
const description = 'Quick Multi search engine with suggestions from tabs, history, and web. Navigate faster with keyboard shortcuts.'
// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch, label = "0"] = version
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
  version: `${major}.${minor}.${patch}.${label}`,
  // semver is OK in "version_name"
  version_name: version,
  manifest_version: 3,
  // key: '',
  action: {
    default_popup: "src/ui/action-popup/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  host_permissions: ["<all_urls>"],
  devtools_page: "src/devtools/index.html",
  offline_enabled: true,
  permissions: ["storage", "tabs", "windows"],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-scripts/sync.ts"],
      run_at: "document_start"
    }
  ],
  commands: {
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Space",
        "mac": "Command+Shift+Space"
      },
      "description": "Open Quick Search popup"
    }
  },
  web_accessible_resources: [
    {
      resources: [
        "src/ui/devtools-panel/index.html",
      ],
      matches: ["<all_urls>"],
      use_dynamic_url: false,
    },
  ],
  icons: {
    48: "src/assets/logo-48x48.png",
    128: "src/assets/logo-128-128.png"
  },
} as ManifestV3Export
