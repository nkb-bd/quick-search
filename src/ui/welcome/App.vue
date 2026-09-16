<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { FILTER_HINTS } from '../../lib/parseQuery'

const shortcut = ref<string | null>(null)
const loaded = ref(false)

onMounted(async () => {
  const commands = await chrome.commands.getAll()
  shortcut.value = commands.find(command => command.name === 'open-launcher')?.shortcut || null
  loaded.value = true
})

function openShortcutSettings() {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
}

function openOptions() {
  chrome.runtime.openOptionsPage()
}
</script>

<template>
  <div class="page">
    <h1>Quick Search is ready</h1>
    <p>One keystroke to reach any open tab, past visit, bookmark or the web.</p>

    <h2>Your shortcut</h2>
    <div class="card">
      <template v-if="loaded && shortcut">
        <div class="shortcut"><kbd>{{ shortcut }}</kbd> opens Quick Search</div>
      </template>
      <template v-else-if="loaded">
        <div class="shortcut shortcut--unset">No shortcut assigned</div>
        <p class="setting__hint">
          Chrome could not assign the suggested shortcut, usually because another extension took it.
        </p>
        <button
          class="button button--primary"
          @click="openShortcutSettings"
        >
          Assign a shortcut
        </button>
      </template>
    </div>

    <h2>Narrow your search</h2>
    <div class="card">
      <div
        v-for="hint in FILTER_HINTS"
        :key="hint.prefix"
        class="setting"
      >
        <span class="setting__label"><kbd>{{ hint.prefix }}</kbd> then your search</span>
        <span class="setting__hint">{{ hint.label }} only</span>
      </div>
      <div class="setting">
        <span class="setting__label"><kbd>yt</kbd>, <kbd>gh</kbd>, <kbd>npm</kbd>, <kbd>w</kbd> …</span>
        <span class="setting__hint">Search that site directly</span>
      </div>
      <div class="setting">
        <span class="setting__label"><kbd>qs</kbd> in the address bar</span>
        <span class="setting__hint">Search without opening the window</span>
      </div>
    </div>

    <h2>Keys</h2>
    <div class="card">
      <div class="setting">
        <span class="setting__label"><kbd>↑</kbd> <kbd>↓</kbd></span>
        <span class="setting__hint">Move through results</span>
      </div>
      <div class="setting">
        <span class="setting__label"><kbd>Tab</kbd></span>
        <span class="setting__hint">Switch search engine</span>
      </div>
      <div class="setting">
        <span class="setting__label"><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>1</kbd>–<kbd>9</kbd></span>
        <span class="setting__hint">Jump straight to a result</span>
      </div>
      <div class="setting">
        <span class="setting__label"><kbd>Esc</kbd></span>
        <span class="setting__hint">Clear the query, then close</span>
      </div>
    </div>

    <h2>Settings</h2>
    <div class="card">
      <div class="setting">
        <div>
          <div class="setting__label">Choose your engine and sources</div>
          <p class="setting__hint">Pick a default engine, theme, and which sources are searched.</p>
        </div>
        <button
          class="button"
          @click="openOptions"
        >
          Open settings
        </button>
      </div>
    </div>
  </div>
</template>
