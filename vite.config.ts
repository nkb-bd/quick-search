import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, relative } from "node:path"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import "dotenv/config"

// @ts-expect-error commonjs module
import { define, raw } from "./define.config.mjs"

const IS_DEV = process.env.NODE_ENV === "development"
const PORT = Number(process.env.PORT) || 3303

export default defineConfig({
  base: IS_DEV ? `/` : "",

  plugins: [
    {
      name: "ensure-output-dir",
      buildStart() {
        ;["dist/chrome", "dist/firefox"].forEach((dir) => {
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        })
      },
    },
    vue(),
    {
      name: "html-define-plugin",
      enforce: "post",
      transformIndexHtml(html: string) {
        return html.replace(
          /%+\s*(\w+)\s*%+/g,
          (_, key: string) => raw[key] ?? `%${key}%`,
        )
      },
    },
    {
      name: "assets-rewrite",
      enforce: "post",
      apply: "build",
      transformIndexHtml(html: string, { path }: { path: string }) {
        return html.replace(
          /"\/assets\//g,
          `"${relative(dirname(path), "/assets")}/`,
        )
      },
    },
  ],

  define,

  legacy: {
    // ⚠️ SECURITY RISK: Allows WebSockets to connect to the vite server without a token check ⚠️
    // See https://github.com/crxjs/chrome-extension-tools/issues/971 for more info
    skipWebSocketTokenCheck: true,
  },

  optimizeDeps: {
    include: ["vue"],
    exclude: ["vue-demi"],
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL(".", import.meta.url)),
      src: fileURLToPath(new URL("src", import.meta.url)),
      "@assets": fileURLToPath(new URL("src/assets", import.meta.url)),
    },
  },

  build: {
    rollupOptions: {
      input: {
        launcher: fileURLToPath(new URL("src/ui/launcher/index.html", import.meta.url)),
        options: fileURLToPath(new URL("src/ui/options/index.html", import.meta.url)),
        welcome: fileURLToPath(new URL("src/ui/welcome/index.html", import.meta.url)),
      },
    },
  },

  server: {
    port: PORT,
    hmr: {
      host: "localhost",
    },
    cors: {
      origin: [
        // ⚠️ SECURITY RISK: Allows any chrome-extension to access the vite server ⚠️
        // See https://github.com/crxjs/chrome-extension-tools/issues/971 for more info
        /chrome-extension:\/\//,
      ],
    },
  },
})
