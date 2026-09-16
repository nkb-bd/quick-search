export interface Engine {
  id: string
  name: string
  url: string
  bang?: string
  selectable: boolean
}

export const ENGINES: Engine[] = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', bang: 'g', selectable: true },
  { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=', bang: 'p', selectable: true },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', bang: 'd', selectable: true },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', bang: 'bi', selectable: true },
  { id: 'brave', name: 'Brave', url: 'https://search.brave.com/search?q=', bang: 'br', selectable: true },
  { id: 'youcom', name: 'You.com', url: 'https://you.com/search?q=', bang: 'y', selectable: true },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query=', bang: 'yt', selectable: false },
  { id: 'github', name: 'GitHub', url: 'https://github.com/search?q=', bang: 'gh', selectable: false },
  { id: 'npm', name: 'npm', url: 'https://www.npmjs.com/search?q=', bang: 'npm', selectable: false },
  { id: 'mdn', name: 'MDN', url: 'https://developer.mozilla.org/en-US/search?q=', bang: 'mdn', selectable: false },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search=', bang: 'w', selectable: false },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=', bang: 'so', selectable: false },
]

export const DEFAULT_ENGINE_ID = 'google'

export const selectableEngines = () => ENGINES.filter(e => e.selectable)

export function engineById(id: string): Engine {
  return ENGINES.find(e => e.id === id) ?? ENGINES[0]
}

export function engineByBang(bang: string): Engine | undefined {
  return ENGINES.find(e => e.bang === bang)
}

export function searchUrl(engineId: string, term: string): string {
  return `${engineById(engineId).url}${encodeURIComponent(term)}`
}

export function nextEngineId(currentId: string, direction = 1): string {
  const list = selectableEngines()
  const index = list.findIndex(e => e.id === currentId)
  const base = index === -1 ? 0 : index
  return list[(base + direction + list.length) % list.length].id
}
