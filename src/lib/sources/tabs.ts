import { fuzzyMatch, frecency } from '../score'
import type { QueryPlan, Result, Source } from '../types'

export const tabsSource: Source = {
  kind: 'tab',
  local: true,
  async query({ term }: QueryPlan): Promise<Result[]> {
    if (!term) return []

    const [tabs, currentWindow] = await Promise.all([
      chrome.tabs.query({}),
      chrome.windows.getLastFocused().catch(() => null),
    ])

    const results: Result[] = []

    for (const tab of tabs) {
      if (tab.id === undefined) continue

      const title = tab.title || tab.url || 'Untitled tab'
      const titleMatch = fuzzyMatch(term, title)
      const urlMatch = tab.url ? fuzzyMatch(term, tab.url) : null
      const best = pickBest(titleMatch, urlMatch)
      if (!best) continue

      const sameWindow = currentWindow && tab.windowId === currentWindow.id
      results.push({
        id: `tab:${tab.id}`,
        kind: 'tab',
        title,
        subtitle: tab.url,
        url: tab.url,
        tabId: tab.id,
        windowId: tab.windowId,
        titleMatch: best === titleMatch ? best.indices : undefined,
        score: frecency(best, 'tab', { lastVisit: tab.lastAccessed }) * (sameWindow ? 1.1 : 1),
      })
    }

    return results
  },
}

function pickBest<T extends { score: number } | null>(a: T, b: T): T {
  if (!a) return b
  if (!b) return a
  return a.score >= b.score ? a : b
}
