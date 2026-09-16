import { searchUrl } from '../engines'
import type { QueryPlan, Result, Source } from '../types'

export const suggestSource: Source = {
  kind: 'suggest',
  local: false,
  async query({ term, engineId }: QueryPlan, signal: AbortSignal): Promise<Result[]> {
    if (!term) return []

    const response = await chrome.runtime.sendMessage({ action: 'suggest', term })
    if (signal.aborted || !response?.suggestions) return []

    return (response.suggestions as string[])
      .filter(suggestion => suggestion.toLowerCase() !== term.toLowerCase())
      .slice(0, 6)
      .map((suggestion, index) => ({
        id: `suggest:${suggestion}`,
        kind: 'suggest' as const,
        title: suggestion,
        url: searchUrl(engineId, suggestion),
        engineId,
        score: 600 - index * 10,
      }))
  },
}
