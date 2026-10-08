<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ENGINES, selectableEngines } from '../../lib/engines'
import { clearRecentSearches } from '../../lib/recent'
import { applyTheme, DEFAULT_SETTINGS, loadSettings, saveSettings, type OpenMode, type Settings, type ThemeMode } from '../../lib/settings'

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

const OPEN_MODES: { value: OpenMode; label: string; hint: string }[] = [
  { value: 'sidePanel', label: 'Side panel', hint: 'Keeps the current page visible and stays available as you browse.' },
  { value: 'popup', label: 'Popup window', hint: 'A small window over Chrome. Opens inside the page when Chrome is full screen.' },
  { value: 'overlay', label: 'Overlay on the page', hint: 'Opens inside the current tab. Uses a popup on pages like chrome://.' },
]
const openModes = OPEN_MODES.filter(mode => mode.value !== 'sidePanel' || 'sidePanel' in chrome)

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
  <main class="page page--settings">
    <header class="page__header">
      <span
        class="brand-mark"
        aria-hidden="true"
      >Q</span>
      <div>
        <h1>Quick Search settings</h1>
        <p class="page__intro">Choose how search opens, what it includes, and where web queries go.</p>
      </div>
    </header>

    <section
      class="page__section"
      aria-labelledby="shortcut-heading"
    >
      <div class="section-heading">
        <div>
          <h2 id="shortcut-heading">Shortcut and appearance</h2>
          <p>Use the same shortcut to open and close the selected search surface.</p>
        </div>
      </div>
      <div class="card">
        <div class="setting">
          <div>
            <div class="setting__label">Keyboard shortcut</div>
            <p class="setting__hint">
              <template v-if="shortcut"><kbd>{{ shortcut }}</kbd> is assigned by Chrome.</template>
              <span
                v-else
                class="shortcut--unset"
              >Not assigned</span>
            </p>
          </div>
          <button
            class="button"
            @click="openShortcutSettings"
          >
            Change
          </button>
        </div>

        <fieldset class="mode-picker">
          <legend>Open Quick Search as</legend>
          <div class="mode-picker__grid">
            <label
              v-for="mode in openModes"
              :key="mode.value"
              class="mode-option"
              :class="{ 'mode-option--selected': settings.openMode === mode.value }"
            >
              <input
                type="radio"
                name="openMode"
                :value="mode.value"
                :checked="settings.openMode === mode.value"
                @change="update({ openMode: mode.value })"
              >
              <span>
                <span class="setting__label">{{ mode.label }}</span>
                <span class="setting__hint">{{ mode.hint }}</span>
              </span>
            </label>
          </div>
        </fieldset>
      </div>
    </section>

    <section
      class="page__section"
      aria-labelledby="preferences-heading"
    >
      <div class="section-heading">
        <div>
          <h2 id="preferences-heading">Search preferences</h2>
          <p>Set the default engine and match the interface to your environment.</p>
        </div>
      </div>
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
    </section>

    <section
      class="page__section"
      aria-labelledby="sources-heading"
    >
      <div class="section-heading">
        <div>
          <h2 id="sources-heading">Search sources</h2>
          <p>Local browser data stays on this device. Web suggestions send typed text to Google Suggest.</p>
        </div>
      </div>
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
    </section>

    <section
      class="page__section page__section--split"
      aria-label="Shortcuts and local data"
    >
      <div>
        <div class="section-heading">
          <div>
            <h2>Site shortcuts</h2>
            <p>Type a prefix, a space, then your search.</p>
          </div>
        </div>
        <div class="card shortcut-list">
          <div
            v-for="engine in bangs"
            :key="engine.id"
            class="shortcut-list__item"
          >
            <kbd>{{ engine.bang }}</kbd>
            <span>{{ engine.name }}</span>
          </div>
        </div>
      </div>

      <div>
        <div class="section-heading">
          <div>
            <h2>Local data</h2>
            <p>Manage the search activity stored by this extension.</p>
          </div>
        </div>
        <div class="card setting">
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
    </section>
  </main>
</template>
