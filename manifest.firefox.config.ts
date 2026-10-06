import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config"

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
  ...ManifestConfig,
  browser_specific_settings: {
    gecko: {
      id: env["FIREFOX_ADDON_ID"],
    },
  },
  side_panel: undefined,
  background: {
    scripts: ["src/background/index.ts"],
    type: "module",
    persistent: false,
  },
  permissions: [
    // @ts-expect-error permissions is always an array in the shared manifest
    ...ManifestConfig.permissions.filter(
      // "favicon" and "sidePanel" are Chrome-only
      (permission) => !["background", "favicon", "sidePanel"].includes(permission),
    ),
  ],
}))
