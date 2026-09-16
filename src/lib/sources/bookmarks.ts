import { fuzzyMatch, frecency } from '../score'
import type { QueryPlan, Result, Source } from '../types'

export const bookmarksSource: Source = {
  kind: 'bookmark',
  local: true,
  async query({ term }: QueryPlan): Promise<Result[]> {
    if (!term || !chrome.bookmarks) return []

    const items = await chrome.bookmarks.search(term)
    const results: Result[] = []

    for (const item of items) {
      if (!item.url) continue

      const title = item.title || item.url
      const match = fuzzyMatch(term, title) ?? fuzzyMatch(term, item.url)
      if (!match) continue

      results.push({
        id: `bookmark:${item.id}`,
        kind: 'bookmark',
        title,
        subtitle: item.url,
        url: item.url,
        titleMatch: item.title ? match.indices : undefined,
        score: frecency(match, 'bookmark', { lastVisit: item.dateAdded }),
      })
    }

    return results
  },
}
