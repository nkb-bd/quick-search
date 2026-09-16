const TABS = [
  { id: 1, windowId: 1, title: 'GitHub · Pull Requests', url: 'https://github.com/pulls', lastAccessed: Date.now() - 60000 },
  { id: 2, windowId: 1, title: 'vuejs/core: Vue.js framework', url: 'https://github.com/vuejs/core', lastAccessed: Date.now() - 900000 },
  { id: 3, windowId: 1, title: 'Chrome Extensions API reference', url: 'https://developer.chrome.com/docs/extensions/reference', lastAccessed: Date.now() - 7200000 },
  { id: 4, windowId: 2, title: 'Figma — Quick Search redesign', url: 'https://figma.com/file/quick-search', lastAccessed: Date.now() - 300000 },
]

const HISTORY = [
  { id: 'h1', title: 'GitHub Actions cache action', url: 'https://github.com/actions/cache', lastVisitTime: Date.now() - 86400000, visitCount: 12 },
  { id: 'h2', title: 'Manifest V3 migration checklist', url: 'https://developer.chrome.com/docs/extensions/develop/migrate', lastVisitTime: Date.now() - 172800000, visitCount: 4 },
  { id: 'h3', title: 'gitignore templates', url: 'https://github.com/github/gitignore', lastVisitTime: Date.now() - 604800000, visitCount: 2 },
]

const BOOKMARKS = [
  { id: 'b1', title: 'GitHub Docs', url: 'https://docs.github.com', dateAdded: Date.now() - 2592000000 },
  { id: 'b2', title: 'Vite Guide', url: 'https://vite.dev/guide/', dateAdded: Date.now() - 5184000000 },
]

const SUGGESTIONS: Record<string, string[]> = {
  gith: ['github', 'github copilot', 'github actions', 'github desktop'],
  vue: ['vue 3 composition api', 'vuejs router', 'vue devtools'],
}

const match = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase())

const store: Record<string, unknown> = {}

;(globalThis as any).chrome = {
  runtime: {
    getURL: (path: string) => `https://www.google.com/s2/favicons?domain=github.com&sz=32#${path}`,
    openOptionsPage: () => window.open('/options.html'),
    sendMessage: async (message: any) => {
      if (message.action === 'getContext') return { originTabId: 1, originWindowId: 1 }
      if (message.action === 'suggest') {
        const key = Object.keys(SUGGESTIONS).find(k => message.term.toLowerCase().startsWith(k.slice(0, 3)))
        await new Promise(resolve => setTimeout(resolve, 220))
        return { suggestions: key ? SUGGESTIONS[key] : [`${message.term} tutorial`, `${message.term} docs`] }
      }
      return {}
    },
  },
  storage: { local: {
    get: async (key: string) => ({ [key]: store[key] }),
    set: async (patch: Record<string, unknown>) => Object.assign(store, patch),
  } },
  tabs: {
    query: async () => TABS,
    get: async (id: number) => TABS.find(t => t.id === id),
    update: async () => {},
    create: async () => {},
  },
  windows: {
    getLastFocused: async () => ({ id: 1, left: 0, top: 0, width: 1440, height: 900 }),
    update: async () => {},
  },
  history: { search: async ({ text }: { text: string }) => HISTORY.filter(h => match(`${h.title} ${h.url}`, text)) },
  bookmarks: {
    search: async (text: string) => BOOKMARKS.filter(b => match(`${b.title} ${b.url}`, text)),
    create: async () => {},
  },
  commands: { getAll: async () => [{ name: 'open-launcher', shortcut: '⌘⇧Space' }] },
}

export {}
