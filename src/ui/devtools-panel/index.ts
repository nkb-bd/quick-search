import { i18n } from "src/utils/i18n"
import { pinia } from "src/utils/pinia"
import { appRouter } from "src/utils/router"
import { createApp } from "vue"
import App from "./app.vue"
import ui from "@nuxt/ui/vue-plugin"
import "./index.css"

appRouter.addRoute({
  path: "/",
  redirect: "/devtools-panel",
})

const app = createApp(App).use(i18n).use(ui).use(pinia).use(appRouter)

app.mount("#app")

export default app

self.onerror = function (event: string | Event, source?: string, lineno?: number, colno?: number, error?: Error) {
  const errorDetails = {
    message: typeof event === 'string' ? event : 'Unknown error',
    source: source || 'Unknown source',
    line: lineno || 0,
    column: colno || 0,
    error: error || null,
    timestamp: new Date().toISOString()
  }

  // Log to console with better formatting
  console.error('DevTools Error:', {
    ...errorDetails,
    stack: error?.stack || 'No stack trace available'
  })

  // Send error to background script for centralized error handling
  chrome.runtime.sendMessage({
    type: 'DEVTOOLS_ERROR',
    payload: errorDetails
  })

  // Return false to prevent default error handling
  return false
}

// Global unhandled promise rejection handler
self.onunhandledrejection = function (event: PromiseRejectionEvent) {
  const errorDetails = {
    message: event.reason?.message || 'Unhandled promise rejection',
    reason: event.reason,
    timestamp: new Date().toISOString()
  }

  console.error('DevTools Unhandled Promise Rejection:', errorDetails)

  // Send rejection to background script
  chrome.runtime.sendMessage({
    type: 'DEVTOOLS_UNHANDLED_REJECTION',
    payload: errorDetails
  })
}
