<template>
  <div class="p-4 max-w-md mx-auto">
    <RouterLinkUp />

    <div class="text-center mb-6">
      <img
        src="@assets/logo.png"
        alt="Quick Search Logo"
        class="h-16 w-auto mx-auto mb-4"
      />
      <h1 class="text-2xl font-bold text-primary mb-2">Quick Search</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Fast and intelligent search extension for Chrome
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <h3 class="font-semibold mb-2">Features</h3>
        <ul class="text-sm space-y-1 text-gray-600 dark:text-gray-400">
          <li>• Auto-suggestions from open tabs</li>
          <li>• Google search integration</li>
          <li>• Light and dark theme support</li>
          <li>• Multiple search engines</li>
          <li>• Recent searches history</li>
          <li>• Customizable keyboard shortcuts</li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold mb-2">Version</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">v0.0.1</p>
      </div>

      <div>
        <h3 class="font-semibold mb-2">Developer</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Built with Vue 3, Vite, and Chrome Extension Manifest V3
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling if needed */
</style>
