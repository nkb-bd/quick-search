<template>
  <div class="p-4 max-w-md mx-auto">
    <RouterLinkUp />

    <h1 class="text-xl font-bold mb-4">Settings</h1>

    <div class="space-y-6">
      <!-- Theme Settings -->
      <div>
        <h3 class="font-semibold mb-3">Appearance</h3>
        <div class="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600">
          <div>
            <label class="font-medium">Dark Mode</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Toggle between light and dark themes
            </p>
          </div>
          <ThemeSwitch />
        </div>
      </div>

      <!-- Search Engine Settings -->
      <div>
        <h3 class="font-semibold mb-3">Search Engine</h3>
        <div class="space-y-2">
          <div
            v-for="engine in searchEngines"
            :key="engine.name"
            class="flex items-center space-x-2"
          >
            <input
              :id="engine.name"
              v-model="selectedEngine"
              :value="engine.name"
              type="radio"
              name="searchEngine"
              class="text-primary"
            />
            <label
              :for="engine.name"
              class="text-sm font-medium"
            >
              {{ engine.name }}
            </label>
          </div>
        </div>
      </div>

      <!-- Keyboard Shortcuts -->
      <div v-if="isSupported()">
        <h3 class="font-semibold mb-3">Keyboard Shortcuts</h3>
        <div class="space-y-3">
          <div v-if="isLoading" class="text-sm text-gray-600 dark:text-gray-400">
            Loading shortcuts...
          </div>
          <div v-else>
            <div
              v-for="shortcut in shortcuts"
              :key="shortcut.name"
              class="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600"
            >
              <div>
                <div class="font-medium">{{ shortcut.description }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  Open popup
                </div>
              </div>
              <div class="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {{ shortcut.shortcut }}
              </div>
            </div>
            <UButton
              variant="outline"
              size="sm"
              @click="openShortcutSettings"
              class="mt-3"
            >
              Configure Shortcuts
            </UButton>
          </div>
        </div>
      </div>

      <!-- Recent Searches -->
      <div>
        <h3 class="font-semibold mb-3">Privacy</h3>
        <UButton
          variant="outline"
          size="sm"
          @click="clearRecentSearches"
        >
          Clear Recent Searches
        </UButton>
      </div>

      <!-- About Section -->
      <div class="pt-4 border-t dark:border-gray-600">
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-600 dark:text-gray-400">Version 0.0.1</span>
          <RouterLink
            to="/action-popup/common/about"
            class="text-sm text-primary hover:underline"
          >
            About
          </RouterLink>
        </div>
      </div>

      
    </div>
  </div>
  <AppFooter />
</template>

<script setup lang="ts">
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useSearchEngine } from '@/composables/useSearchEngine'
import AppFooter from '@/components/AppFooter.vue'

const { searchEngines, currentEngine: selectedEngine, storeLoading } = useSearchEngine()
const { shortcuts, isLoading, openShortcutSettings, isSupported } = useKeyboardShortcuts()

const clearRecentSearches = async () => {
  try {
    await chrome.storage.local.remove('recentSearches')
  } catch (error) {
    // Handle error silently
  }
}
</script>

<style scoped>
/* Additional styling if needed */
</style>
