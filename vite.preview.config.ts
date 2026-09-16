import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// Renders the real launcher components against a stubbed chrome.* API.
export default defineConfig({
  root: "preview",
  plugins: [vue()],
  resolve: {
    alias: { src: fileURLToPath(new URL("src", import.meta.url)) },
  },
  server: { port: 5599, fs: { allow: [".."] } },
})
