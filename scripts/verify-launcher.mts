const calls: any[] = []
let focusListener: (id: number) => void
let removedListener: (id: number) => void
let nextWindowId = 100
let failNextUpdate = false
let injectFails = false

const anchor: Record<string, any> = { id: 1, left: 100, top: 50, width: 1440, height: 900, state: 'normal' }

;(globalThis as any).chrome = {
  runtime: { getURL: (p: string) => `chrome-extension://abc/${p}` },
  windows: {
    WINDOW_ID_NONE: -1,
    getLastFocused: async () => anchor,
    create: async (opts: any) => {
      calls.push(['create', opts])
      return { id: nextWindowId++ }
    },
    update: async (id: number, opts: any) => {
      calls.push(['update', id, opts])
      if (failNextUpdate) { failNextUpdate = false; throw new Error('No window with id') }
    },
    remove: async (id: number) => { calls.push(['remove', id]); return undefined },
    onRemoved: { addListener: (fn: any) => (removedListener = fn) },
    onFocusChanged: { addListener: (fn: any) => (focusListener = fn) },
  },
  tabs: { query: async (q: any) => { calls.push(['tabs.query', q]); return [{ id: 42 }] } },
  scripting: {
    executeScript: async (opts: any) => {
      calls.push(['inject', opts])
      if (injectFails) throw new Error('Cannot access a chrome:// URL')
      return [{}]
    },
  },
  sidePanel: { open: async (opts: any) => { calls.push(['sidePanel', opts]) } },
}

const { openLauncher, openSidePanel, launcherContext } = await import('../src/background/launcherWindow.ts')

let failures = 0
const check = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) console.log(`  PASS  ${name}`)
  else { failures++; console.log(`  FAIL  ${name}`, detail ?? '') }
}

// 1. centered placement + window shape
await openLauncher()
const [, createOpts] = calls.find(c => c[0] === 'create')!
check('creates a focused popup window', createOpts.type === 'popup' && createOpts.focused === true, createOpts)
check('horizontally centered on the anchor window',
  createOpts.left === Math.round(anchor.left + (anchor.width - createOpts.width) / 2), createOpts.left)
check('sits in the upper third, not dead centre',
  createOpts.top === Math.round(anchor.top + (anchor.height - createOpts.height) / 3), createOpts.top)
check('never negative (menu bar / off-screen)', createOpts.left >= 0 && createOpts.top >= 0)
check('captures the anchor window active tab',
  launcherContext().originTabId === 42 && launcherContext().originWindowId === 1, launcherContext())

// 2. reuse instead of stacking
calls.length = 0
await openLauncher()
check('second open focuses, does not create a second window',
  calls.some(c => c[0] === 'update' && c[2]?.focused === true) && !calls.some(c => c[0] === 'create'), calls)

// 3. blur behaviour
calls.length = 0
focusListener!(-1)
check('ignores WINDOW_ID_NONE (app switch, transient on macOS)', calls.length === 0, calls)
focusListener!(100)
check('ignores focus events for itself', calls.length === 0, calls)
focusListener!(7)
check('closes when another Chrome window takes focus',
  calls.some(c => c[0] === 'remove' && c[1] === 100), calls)

// 4. after close, next open creates fresh
calls.length = 0
await openLauncher()
check('opens a fresh window after being closed', calls.some(c => c[0] === 'create'), calls)

// 5. stale id recovery
calls.length = 0
failNextUpdate = true
await openLauncher()
check('recreates when the tracked window is already gone',
  calls.some(c => c[0] === 'update') && calls.some(c => c[0] === 'create'), calls)

// 6. onRemoved clears tracking
calls.length = 0
removedListener!(nextWindowId - 1)
await openLauncher()
check('user-closed window is not reused', calls.some(c => c[0] === 'create'), calls)

// 7. fullscreen: a popup window would land in its own macOS Space, so mount in the page
removedListener!(nextWindowId - 1)
calls.length = 0
anchor.state = 'fullscreen'
await openLauncher('popup')
const inject = calls.find(c => c[0] === 'inject')
check('fullscreen popup mode injects the in-page overlay', !!inject && !calls.some(c => c[0] === 'create'), calls)
check('overlay targets the origin tab', inject?.[1].target.tabId === 42, inject)
check('overlay loads the launcher page', String(inject?.[1].args[0]).endsWith('src/ui/launcher/index.html'), inject)

calls.length = 0
injectFails = true
await openLauncher('popup')
check('fullscreen on chrome:// falls back to the popup window', calls.some(c => c[0] === 'create'), calls)
injectFails = false
removedListener!(nextWindowId - 1)

// 8. overlay mode outside fullscreen
anchor.state = 'normal'
calls.length = 0
await openLauncher('overlay')
check('overlay mode injects even when not fullscreen',
  calls.some(c => c[0] === 'inject') && !calls.some(c => c[0] === 'create'), calls)
calls.length = 0
await openLauncher('popup')
check('popup mode outside fullscreen never injects',
  !calls.some(c => c[0] === 'inject') && calls.some(c => c[0] === 'create'), calls)
removedListener!(nextWindowId - 1)

// 9. side panel
calls.length = 0
await openSidePanel({ id: 7, windowId: 3 } as any)
check('side panel opens on the tab window', calls.some(c => c[0] === 'sidePanel' && c[1].windowId === 3), calls)
check('side panel records the origin tab',
  launcherContext().originTabId === 7 && launcherContext().originWindowId === 3, launcherContext())

// 10. the injected function is self-contained and toggles
const mount = inject![1].func as (src: string, w: number, h: number) => void
const nodes: any[] = []
const listeners: Record<string, any> = {}
const fakeEl = () => {
  const el: any = { listeners: {}, addEventListener: (t: string, fn: any) => (el.listeners[t] = fn), focus() {}, remove: () => nodes.splice(nodes.indexOf(el), 1) }
  el.attachShadow = () => ({ set innerHTML(_v: string) {}, querySelector: (q: string) => (q === 'iframe' ? (el.frame ??= fakeEl()) : (el.backdrop ??= fakeEl())) })
  return el
}
;(globalThis as any).document = {
  getElementById: (id: string) => nodes.find(n => n.id === id) ?? null,
  createElement: () => fakeEl(),
  documentElement: { append: (n: any) => nodes.push(n) },
  activeElement: null,
}
;(globalThis as any).window = {
  addEventListener: (t: string, fn: any) => (listeners[t] = fn),
  removeEventListener: (t: string) => delete listeners[t],
}
mount('chrome-extension://abc/src/ui/launcher/index.html', 620, 540)
check('overlay mounts one host element', nodes.length === 1 && nodes[0].id === 'quick-search-launcher', nodes)
const frame = nodes[0].frame
listeners.message?.({ source: {}, data: 'quick-search:close' })
check('ignores close messages from other frames', nodes.length === 1)
listeners.message?.({ source: frame.contentWindow, data: 'quick-search:close' })
check('closes on its own frame message', nodes.length === 0, nodes)
mount('x', 620, 540)
mount('x', 620, 540)
check('pressing the shortcut again toggles it off', nodes.length === 0, nodes)

console.log(failures ? `\n${failures} FAILED` : '\nall passed')
process.exit(failures ? 1 : 0)
