<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { engineById, nextEngineId, selectableEngines } from '../../lib/engines'
import { execute, type LauncherContext } from '../../lib/execute'
import { FILTER_HINTS } from '../../lib/parseQuery'
import { clearRecentSearches, recentSearches, rememberSearch } from '../../lib/recent'
import { DEFAULT_SETTINGS, applyTheme, loadSettings, saveSettings, type Settings } from '../../lib/settings'
import type { Result } from '../../lib/types'
import ResultRow from './components/ResultRow.vue'
import { useLauncher } from './useLauncher'

const engineId = ref(DEFAULT_SETTINGS.engineId)
const sources = ref<Settings['sources']>({ ...DEFAULT_SETTINGS.sources })
const engineFlash = ref(false)
const context = ref<LauncherContext>({})
const recent = ref<string[]>([])
const inputEl = ref<HTMLInputElement | null>(null)
const listEl = ref<HTMLElement | null>(null)

const { query, results, selected, selectedIndex, isFetching, move } = useLauncher(
  () => engineId.value,
  () => sources.value,
)

const engines = selectableEngines()
const engineName = computed(() => engineById(engineId.value).name)
const showEmptyState = computed(() => !query.value.trim())

onMounted(async () => {
  const [settings, saved, launcherContext] = await Promise.all([
    loadSettings(),
    recentSearches(),
    chrome.runtime.sendMessage({ action: 'getContext' }).catch(() => ({})),
  ])

  engineId.value = settings.engineId
  sources.value = settings.sources
  applyTheme(settings.theme)
  recent.value = saved
  context.value = launcherContext ?? {}
  inputEl.value?.focus()
})

watch(selectedIndex, () => {
  nextTick(() => {
    listEl.value
      ?.querySelector('.row--selected')
      ?.scrollIntoView({ block: 'nearest' })
  })
})

async function cycleEngine(direction: number) {
  engineId.value = nextEngineId(engineId.value, direction)
  await saveSettings({ engineId: engineId.value })
  flashEngine()
}

async function pickEngine(id: string) {
  engineId.value = id
  await saveSettings({ engineId: id })
  flashEngine()
  inputEl.value?.focus()
}

function flashEngine() {
  engineFlash.value = true
  setTimeout(() => (engineFlash.value = false), 260)
}

async function run(result?: Result) {
  if (!result) return

  if (result.kind === 'action' || result.kind === 'suggest') {
    await rememberSearch(result.title)
  }

  await execute(result, context.value)

  if (result.commandId === 'data.clearHistory') {
    recent.value = []
    return
  }

  window.close()
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      return move(1)
    case 'ArrowUp':
      event.preventDefault()
      return move(-1)
    case 'Tab':
      event.preventDefault()
      return void cycleEngine(event.shiftKey ? -1 : 1)
    case 'Enter':
      event.preventDefault()
      return void run(selected.value)
    case 'Escape':
      event.preventDefault()
      if (query.value) {
        query.value = ''
        return
      }
      return window.close()
  }

  if ((event.metaKey || event.ctrlKey) && /^[1-9]$/.test(event.key)) {
    event.preventDefault()
    void run(results.value[Number(event.key) - 1])
  }
}

async function useRecent(term: string) {
  query.value = term
  await nextTick()
  inputEl.value?.focus()
}

async function forgetRecent() {
  await clearRecentSearches()
  recent.value = []
}
</script>

<template>
  <div
    class="launcher"
    @keydown="onKeydown"
  >
    <div class="field">
      <span
        class="field__engine"
        :class="{ 'field__engine--changed': engineFlash }"
      >
        {{ engineName }}
      </span>
      <input
        ref="inputEl"
        v-model="query"
        class="field__input"
        type="text"
        placeholder="Search tabs, history, bookmarks or the web…"
        role="combobox"
        aria-expanded="true"
        aria-controls="launcher-results"
        aria-autocomplete="list"
        :aria-activedescendant="selected ? `row-${selectedIndex}` : undefined"
        autofocus
        spellcheck="false"
      />
      <span
        v-if="isFetching"
        class="field__spinner"
        aria-hidden="true"
      />
    </div>

    <div
      v-if="showEmptyState"
      class="empty"
    >
      <template v-if="recent.length">
        <p class="empty__label">Recent searches</p>
        <div
          v-for="term in recent.slice(0, 5)"
          :key="term"
          class="row"
          @click="useRecent(term)"
        >
          <span class="row__icon">{{ '\u{1F553}' }}</span>
          <span class="row__body"><span class="row__title">{{ term }}</span></span>
        </div>
        <p class="empty__label">
          <button
            class="engine"
            @click="forgetRecent"
          >
            Clear recent searches
          </button>
        </p>
      </template>

      <p class="empty__label">Type to filter</p>
      <div class="empty__hints">
        <div
          v-for="hint in FILTER_HINTS"
          :key="hint.prefix"
          class="hint"
        >
          <kbd>{{ hint.prefix }}</kbd> {{ hint.label }}
        </div>
        <div class="hint"><kbd>yt</kbd> YouTube</div>
        <div class="hint"><kbd>gh</kbd> GitHub</div>
      </div>
    </div>

    <div
      v-else
      id="launcher-results"
      ref="listEl"
      class="results"
      role="listbox"
    >
      <ResultRow
        v-for="(result, index) in results"
        :id="`row-${index}`"
        :key="result.id"
        :result="result"
        :selected="index === selectedIndex"
        @click="run(result)"
        @mouseenter="selectedIndex = index"
      />
    </div>

    <div class="footer">
      <div class="engines">
        <button
          v-for="engine in engines"
          :key="engine.id"
          class="engine"
          :class="{ 'engine--active': engine.id === engineId }"
          @click="pickEngine(engine.id)"
        >
          {{ engine.name }}
        </button>
      </div>
      <div class="keys">
        <span><kbd>↑↓</kbd> move</span>
        <span><kbd>⏎</kbd> open</span>
        <span><kbd>⇥</kbd> engine</span>
      </div>
    </div>
  </div>
</template>
