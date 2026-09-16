const L: Record<string, any> = {}
const created: any[] = []
const store: Record<string, any> = {}

;(globalThis as any).fetch = async (url: string) => {
  created.push(['fetch', url])
  return { json: async () => ['gith', ['github', 'github actions'], [], []] }
}

;(globalThis as any).chrome = {
  runtime: {
    getURL: (p: string) => `chrome-extension://abc/${p}`,
    onInstalled: { addListener: (fn: any) => (L.installed = fn) },
    onMessage: { addListener: (fn: any) => (L.message = fn) },
  },
  action: { onClicked: { addListener: (fn: any) => (L.clicked = fn) } },
  commands: { onCommand: { addListener: (fn: any) => (L.command = fn) } },
  omnibox: {
    setDefaultSuggestion: (s: any) => (L.defaultSuggestion = s),
    onInputChanged: { addListener: (fn: any) => (L.inputChanged = fn) },
    onInputEntered: { addListener: (fn: any) => (L.inputEntered = fn) },
  },
  storage: { local: {
    get: async (k: string) => ({ [k]: store[k] }),
    set: async (p: any) => Object.assign(store, p),
  } },
  tabs: {
    create: async (o: any) => { created.push(['tabs.create', o]); return { id: 1 } },
    update: async (o: any) => { created.push(['tabs.update', o]); return { id: 1 } },
    query: async () => [{ id: 1, title: 'GitHub & <script>', url: 'https://github.com' }],
  },
  windows: {
    WINDOW_ID_NONE: -1,
    getLastFocused: async () => ({ id: 1, left: 0, top: 0, width: 1440, height: 900 }),
    create: async (o: any) => { created.push(['windows.create', o]); return { id: 9 } },
    update: async () => {}, remove: async () => {},
    onRemoved: { addListener: () => {} }, onFocusChanged: { addListener: () => {} },
  },
  history: { search: async () => [{ id: 'h1', title: 'GitHub Docs', url: 'https://docs.github.com' }] },
}

await import('../src/background/index.ts')

let failures = 0
const check = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`  PASS  ${name}`)
  else { failures++; console.log(`  FAIL  ${name}`, detail ?? '') }
}
const respond = (msg: any) => new Promise(res => { L.message(msg, {}, res) })

check('registers an omnibox default suggestion', !!L.defaultSuggestion?.description)

// install opens the welcome page, updates do not
L.installed({ reason: 'update' })
check('update does not reopen onboarding', !created.some(c => c[0] === 'tabs.create'), created)
L.installed({ reason: 'install' })
check('install opens the welcome page',
  created.some(c => c[0] === 'tabs.create' && String(c[1].url).includes('welcome')), created)

// shortcut + icon both open the launcher
created.length = 0
L.command('open-launcher')
await new Promise(r => setTimeout(r, 10))
check('open-launcher command opens the launcher window',
  created.some(c => c[0] === 'windows.create' && c[1].type === 'popup'), created)
created.length = 0
L.command('some-other-command')
await new Promise(r => setTimeout(r, 10))
check('unknown commands are ignored', created.length === 0, created)

// message router
const ctx = await respond({ action: 'getContext' })
check('getContext returns the origin tab', (ctx as any)?.originTabId === 1, ctx)
const sug = await respond({ action: 'suggest', term: 'gith' })
check('suggest unwraps the Google response shape',
  JSON.stringify((sug as any)?.suggestions) === JSON.stringify(['github', 'github actions']), sug)
check('suggest hits only the narrowed host',
  created.filter(c => c[0] === 'fetch').every(c => String(c[1]).startsWith('https://suggestqueries.google.com/')), created)
store.recentSearches = ['old search']
await respond({ action: 'clearHistory' })
check('clearHistory empties recent searches', store.recentSearches.length === 0, store.recentSearches)
check('unknown messages are not answered', L.message({ action: 'nope' }, {}, () => {}) === false)

// omnibox
const suggestions: any[] = await new Promise(res => L.inputChanged('git', res))
check('omnibox returns tab and history matches', suggestions.length >= 2, suggestions)
check('omnibox escapes XML in titles',
  suggestions.every(s => !/[<>&](?!amp;|lt;|gt;|quot;)/.test(s.description)), suggestions)
check('omnibox suggestions all carry a url', suggestions.every(s => s.content.startsWith('http')), suggestions)

created.length = 0
await L.inputEntered('vue router', 'currentTab')
check('omnibox search uses the saved engine',
  created.some(c => c[0] === 'tabs.update' && c[1].url.includes('google.com/search?q=vue%20router')), created)
created.length = 0
await L.inputEntered('https://example.com', 'newForegroundTab')
check('omnibox opens a pasted URL directly',
  created.some(c => c[0] === 'tabs.create' && c[1].url === 'https://example.com'), created)

console.log(failures ? `\n${failures} FAILED` : '\nall passed')
process.exit(failures ? 1 : 0)
