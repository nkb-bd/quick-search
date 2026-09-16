import { computed, ref, shallowRef, watch } from 'vue'
import { engineById, searchUrl } from '../../lib/engines'
import { parseQuery } from '../../lib/parseQuery'
import { rank } from '../../lib/score'
import { bookmarksSource } from '../../lib/sources/bookmarks'
import { commandsSource } from '../../lib/sources/commands'
import { historySource } from '../../lib/sources/history'
import { suggestSource } from '../../lib/sources/suggest'
import { tabsSource } from '../../lib/sources/tabs'
import type { Settings } from '../../lib/settings'
import type { QueryPlan, Result, Source } from '../../lib/types'

const LOCAL_SOURCES: Source[] = [tabsSource, bookmarksSource, historySource, commandsSource]

const SOURCE_SETTING: Partial<Record<Source['kind'], keyof Settings['sources']>> = {
  tab: 'tabs',
  bookmark: 'bookmarks',
  history: 'history',
}
const REMOTE_DEBOUNCE_MS = 120
const MAX_RESULTS = 12

export function useLauncher(engineId: () => string, sources: () => Settings['sources']) {
  const query = ref('')
  const localResults = shallowRef<Result[]>([])
  const remoteResults = shallowRef<Result[]>([])
  const selectedIndex = ref(0)
  const isFetching = ref(false)

  let generation = 0
  let controller = new AbortController()
  let remoteTimer: ReturnType<typeof setTimeout> | undefined

  const plan = computed<QueryPlan>(() => parseQuery(query.value, engineId()))

  const primaryAction = computed<Result | null>(() => {
    const { term, engineId: planEngine, only } = plan.value
    if (!term || only?.includes('command')) return null

    const engine = engineById(planEngine)
    return {
      id: 'action:search',
      kind: 'action',
      title: term,
      subtitle: `Search ${engine.name}`,
      url: searchUrl(planEngine, term),
      engineId: planEngine,
      score: Number.MAX_SAFE_INTEGER,
    }
  })

  const results = computed<Result[]>(() => {
    const merged = rank([...localResults.value, ...remoteResults.value]).slice(0, MAX_RESULTS)
    return primaryAction.value ? [primaryAction.value, ...merged] : merged
  })

  const selected = computed<Result | undefined>(() => results.value[selectedIndex.value])

  watch([query, () => engineId()], () => {
    controller.abort()
    controller = new AbortController()
    clearTimeout(remoteTimer)

    const current = ++generation
    const currentPlan = plan.value

    if (!currentPlan.term) {
      localResults.value = []
      remoteResults.value = []
      selectedIndex.value = 0
      isFetching.value = false
      return
    }

    remoteResults.value = []
    runLocal(current, currentPlan)
    scheduleRemote(current, currentPlan)
  })

  async function runLocal(current: number, currentPlan: QueryPlan): Promise<void> {
    const enabled = sources()
    const active = LOCAL_SOURCES.filter(source => {
      const setting = SOURCE_SETTING[source.kind]
      if (setting && !enabled[setting]) return false
      return !currentPlan.only || currentPlan.only.includes(source.kind)
    })

    const settled = await Promise.all(
      active.map(source => source.query(currentPlan, controller.signal).catch(() => [])),
    )

    if (current !== generation) return
    localResults.value = settled.flat()
    selectedIndex.value = 0
  }

  function scheduleRemote(current: number, currentPlan: QueryPlan): void {
    if (!sources().suggest) return
    if (currentPlan.only && !currentPlan.only.includes('suggest')) return

    isFetching.value = true
    remoteTimer = setTimeout(async () => {
      const selectedId = selected.value?.id
      const fetched = await suggestSource
        .query(currentPlan, controller.signal)
        .catch<Result[]>(() => [])

      if (current !== generation) return

      remoteResults.value = fetched
      isFetching.value = false
      restoreSelection(selectedId)
    }, REMOTE_DEBOUNCE_MS)
  }

  function restoreSelection(selectedId?: string): void {
    if (!selectedId || selectedIndex.value === 0) return

    const index = results.value.findIndex(result => result.id === selectedId)
    selectedIndex.value = index === -1 ? 0 : index
  }

  function move(direction: number): void {
    const total = results.value.length
    if (!total) return
    selectedIndex.value = (selectedIndex.value + direction + total) % total
  }

  function reset(): void {
    query.value = ''
  }

  return { query, plan, results, selected, selectedIndex, isFetching, move, reset }
}
