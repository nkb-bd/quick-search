<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ENGINES, selectableEngines } from '../../lib/engines'
import { clearRecentSearches } from '../../lib/recent'
import { applyTheme, DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings, type ThemeMode } from '../../lib/settings'

const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
const shortcut = ref<string | null>(null)
const cleared = ref(false)

const engines = selectableEngines()
const bangs = ENGINES.filter(engine => engine.bang)

const SOURCES: { key: keyof Settings['sources']; label: string; hint: string }[] = [
  { key: 'tabs', label: 'Open tabs', hint: 'Jump to a tab you already have open' },
  { key: 'bookmarks', label: 'Bookmarks', hint: 'Search your saved bookmarks' },
  { key: 'history', label: 'Browsing history', hint: 'Search pages you have visited' },
  { key: 'suggest', label: 'Web suggestions', hint: 'Sends what you type to Google Suggest' },
]

onMounted(async () => {
  settings.value = await loadSettings()
  const commands = await chrome.commands.getAll()
  shortcut.value = commands.find(command => command.name === 'open-launcher')?.shortcut || null
})

async function update(patch: Partial<Settings>) {
  settings.value = await saveSettings(patch)
  applyTheme(settings.value.theme)
}

function toggleSource(key: keyof Settings['sources']) {
  void update({ sources: { ...settings.value.sources, [key]: !settings.value.sources[key] } })
}

function openShortcutSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
}

async function clearData() {
  await clearRecentSearches()
  cleared.value = true
}
</script>

<template>
  <div class="page">
    <h1>Quick Search settings</h1>

    <h2>Shortcut</h2>
    <div class="card">
      <div class="setting">
        <div>
          <div class="setting__label">
            <template v-if="shortcut"><kbd>{{ shortcut }}</kbd></template>
            <span
              v-else
              class="shortcut--unset"
            >Not assigned</span>
          </div>
          <p class="setting__hint">Chrome owns extension shortcuts, so this is changed in Chrome.</p>
        </div>
        <button
          class="button"
          @click="openShortcutSettings"
        >
          Change
        </button>
      </div>
    </div>

    <h2>Default engine</h2>
    <div class="card">
      <div class="setting">
        <div>
          <div class="setting__label">Search engine</div>
          <p class="setting__hint">Press Tab in the launcher to switch without changing this.</p>
        </div>
        <select
          :value="settings.engineId"
          @change="update({ engineId: ($event.target as HTMLSelectElement).value })"
        >
          <option
            v-for="engine in engines"
            :key="engine.id"
            :value="engine.id"
          >
            {{ engine.name }}
          </option>
        </select>
      </div>

      <div class="setting">
        <div>
          <div class="setting__label">Theme</div>
          <p class="setting__hint">System follows your operating system setting.</p>
        </div>
        <select
          :value="settings.theme"
          @change="update({ theme: ($event.target as HTMLSelectElement).value as ThemeMode })"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>

    <h2>Sources</h2>
    <div class="card">
      <div
        v-for="source in SOURCES"
        :key="source.key"
        class="setting"
      >
        <div>
          <div class="setting__label">{{ source.label }}</div>
          <p class="setting__hint">{{ source.hint }}</p>
        </div>
        <button
          class="switch"
          :class="{ 'switch--on': settings.sources[source.key] }"
          :aria-pressed="settings.sources[source.key]"
          :aria-label="source.label"
          @click="toggleSource(source.key)"
        />
      </div>
    </div>

    <h2>Site shortcuts</h2>
    <div class="card">
      <p class="setting__hint">Type the prefix, a space, then your search.</p>
      <div
        v-for="engine in bangs"
        :key="engine.id"
        class="setting"
      >
        <span class="setting__label"><kbd>{{ engine.bang }}</kbd></span>
        <span class="setting__hint">{{ engine.name }}</span>
      </div>
    </div>

    <h2>Data</h2>
    <div class="card">
      <div class="setting">
        <div>
          <div class="setting__label">Recent searches</div>
          <p class="setting__hint">Stored on this device only, never uploaded.</p>
        </div>
        <button
          class="button"
          @click="clearData"
        >
          {{ cleared ? 'Cleared' : 'Clear' }}
        </button>
      </div>
    </div>
  </div>
</template>
