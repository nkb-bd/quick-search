const calls: any[] = []
let focusListener: (id: number) => void
let removedListener: (id: number) => void
let nextWindowId = 100
let failNextUpdate = false

const anchor = { id: 1, left: 100, top: 50, width: 1440, height: 900 }

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
}

const { openLauncher, launcherContext } = await import('../src/background/launcherWindow.ts')

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

console.log(failures ? `\n${failures} FAILED` : '\nall passed')
process.exit(failures ? 1 : 0)
