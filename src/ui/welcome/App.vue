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
  <main class="page page--welcome">
    <header class="page__header page__header--welcome">
      <span
        class="brand-mark"
        aria-hidden="true"
      >Q</span>
      <div>
        <h1>Quick Search is ready</h1>
        <p class="page__intro">Find an open tab, past visit, bookmark, or the web without leaving the page you are reading.</p>
      </div>
    </header>

    <section
      class="shortcut-hero"
      aria-labelledby="shortcut-heading"
    >
      <div>
        <h2 id="shortcut-heading">Your shortcut</h2>
        <p>Quick Search opens in the side panel by default. Press the shortcut again to close it.</p>
      </div>
      <template v-if="loaded && shortcut">
        <div class="shortcut"><kbd>{{ shortcut }}</kbd></div>
      </template>
      <template v-else-if="loaded">
        <div>
          <div class="shortcut shortcut--unset">No shortcut assigned</div>
          <p class="setting__hint">Chrome could not assign it, usually because another extension already uses it.</p>
          <button
            class="button button--primary"
            @click="openShortcutSettings"
          >
            Assign a shortcut
          </button>
        </div>
      </template>
    </section>

    <div class="welcome-grid">
      <section aria-labelledby="narrow-heading">
        <div class="section-heading">
          <div>
            <h2 id="narrow-heading">Narrow the results</h2>
            <p>Start with a prefix when you already know where to look.</p>
          </div>
        </div>
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
        </div>
      </section>

      <section aria-labelledby="keys-heading">
        <div class="section-heading">
          <div>
            <h2 id="keys-heading">Stay on the keyboard</h2>
            <p>These four actions cover the normal search flow.</p>
          </div>
        </div>
        <div class="card">
          <div class="setting"><span class="setting__label"><kbd>↑</kbd> <kbd>↓</kbd></span><span class="setting__hint">Move through results</span></div>
          <div class="setting"><span class="setting__label"><kbd>Tab</kbd></span><span class="setting__hint">Switch search engine</span></div>
          <div class="setting"><span class="setting__label"><kbd>⏎</kbd></span><span class="setting__hint">Open selected result</span></div>
          <div class="setting"><span class="setting__label"><kbd>Esc</kbd></span><span class="setting__hint">Clear, then close</span></div>
        </div>
      </section>
    </div>

    <section
      class="welcome-footer"
      aria-label="Settings"
    >
      <div>
        <h2>Make it yours</h2>
        <p>Choose another opening style, engine, theme, or set of sources at any time.</p>
      </div>
      <button
        class="button"
        @click="openOptions"
      >
        Open settings
      </button>
    </section>
  </main>
</template>
