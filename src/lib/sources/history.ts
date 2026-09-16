import { fuzzyMatch, frecency } from '../score'
import type { QueryPlan, Result, Source } from '../types'

export const historySource: Source = {
  kind: 'history',
  local: true,
  async query({ term }: QueryPlan): Promise<Result[]> {
    if (!term || !chrome.history) return []

    const items = await chrome.history.search({
      text: term,
      maxResults: 60,
      startTime: 0,
    })

    const results: Result[] = []

    for (const item of items) {
      if (!item.url) continue

      const title = item.title || item.url
      const match = fuzzyMatch(term, title) ?? fuzzyMatch(term, item.url)
      if (!match) continue

      results.push({
        id: `history:${item.id}`,
        kind: 'history',
        title,
        subtitle: item.url,
        url: item.url,
        titleMatch: item.title ? match.indices : undefined,
        score: frecency(match, 'history', {
          lastVisit: item.lastVisitTime,
          visitCount: item.visitCount,
        }),
      })
    }

    return results
  },
}
