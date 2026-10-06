import type { OpenMode } from '../lib/settings'

const WIDTH = 620
const HEIGHT = 540
const PAGE = 'src/ui/launcher/index.html'

let launcherWindowId: number | undefined
let origin: { originTabId?: number; originWindowId?: number } = {}

export function launcherContext() {
  return origin
}

export async function openLauncher(mode: OpenMode = 'popup'): Promise<void> {
  if (launcherWindowId !== undefined) {
    try {
      await chrome.windows.update(launcherWindowId, { focused: true, drawAttention: true })
      return
    } catch {
      launcherWindowId = undefined
    }
  }

  const anchor = await lastNormalWindow()
  origin = await captureOrigin(anchor)

  // macOS gives a new window its own Space when the browser is fullscreen, so stay inside the page.
  const inPage = mode !== 'popup' || anchor?.state === 'fullscreen'
  if (inPage && (await toggleOverlay(origin.originTabId))) return

  await openPopup(anchor)
}

/** Call synchronously from the shortcut or toolbar handler — sidePanel.open needs the user gesture. */
export function openSidePanel(tab: chrome.tabs.Tab): Promise<void> {
  origin = { originTabId: tab.id, originWindowId: tab.windowId }
  return chrome.sidePanel.open({ windowId: tab.windowId })
}

async function openPopup(anchor: chrome.windows.Window | null): Promise<void> {
  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(PAGE),
    type: 'popup',
    focused: true,
    width: WIDTH,
    height: HEIGHT,
    ...placement(anchor),
  })

  launcherWindowId = created?.id
}

/** False when the page refuses scripts (chrome://, the Web Store, PDFs) — the caller falls back to the popup. */
async function toggleOverlay(tabId: number | undefined): Promise<boolean> {
  if (tabId === undefined) return false

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: mountOverlay as () => void, // chrome-types omits the args generic
      args: [chrome.runtime.getURL(PAGE), WIDTH, HEIGHT],
    })
    return true
  } catch {
    return false
  }
}

// Serialized into the page by executeScript: it must not reference anything outside its own body.
function mountOverlay(src: string, width: number, height: number) {
  const ID = 'quick-search-launcher'
  const existing = document.getElementById(ID)
  if (existing) {
    existing.remove()
    return
  }

  const host = document.createElement('div')
  host.id = ID
  const root = host.attachShadow({ mode: 'closed' })
  root.innerHTML = `
    <style>
      .backdrop {
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; justify-content: center; align-items: flex-start;
        padding-top: 12vh; background: rgb(0 0 0 / 0.32);
      }
      iframe {
        width: ${width}px; height: ${height}px;
        max-width: calc(100vw - 32px); max-height: calc(100vh - 12vh - 16px);
        border: 0; border-radius: 12px; background: transparent;
        box-shadow: 0 24px 64px rgb(0 0 0 / 0.35);
        color-scheme: normal;
      }
    </style>
    <div class="backdrop"><iframe title="Quick Search"></iframe></div>`

  const backdrop = root.querySelector('.backdrop') as HTMLElement
  const frame = root.querySelector('iframe') as HTMLIFrameElement
  const previousFocus = document.activeElement as HTMLElement | null

  const close = () => {
    window.removeEventListener('message', onMessage)
    host.remove()
    previousFocus?.focus?.()
  }
  const onMessage = (event: MessageEvent) => {
    if (event.source === frame.contentWindow && event.data === 'quick-search:close') close()
  }

  window.addEventListener('message', onMessage)
  backdrop.addEventListener('mousedown', event => {
    if (event.target === backdrop) close()
  })
  frame.addEventListener('load', () => frame.focus())
  frame.src = src
  document.documentElement.append(host)
}

/** Upper-third of the focused window — launcher convention, and clear of the OS menu bar. */
function placement(anchor: chrome.windows.Window | null) {
  if (!anchor || anchor.left === undefined || anchor.top === undefined) return {}

  const width = anchor.width ?? WIDTH
  const height = anchor.height ?? HEIGHT

  return {
    left: Math.max(0, Math.round(anchor.left + (width - WIDTH) / 2)),
    top: Math.max(0, Math.round(anchor.top + (height - HEIGHT) / 3)),
  }
}

async function lastNormalWindow(): Promise<chrome.windows.Window | null> {
  try {
    return await chrome.windows.getLastFocused({ windowTypes: ['normal'] })
  } catch {
    return null
  }
}

async function captureOrigin(anchor: chrome.windows.Window | null) {
  if (!anchor?.id) return {}

  const [tab] = await chrome.tabs.query({ active: true, windowId: anchor.id })
  return { originTabId: tab?.id, originWindowId: anchor.id }
}

chrome.windows.onRemoved.addListener(windowId => {
  if (windowId === launcherWindowId) launcherWindowId = undefined
})

chrome.windows.onFocusChanged.addListener(windowId => {
  if (launcherWindowId === undefined) return
  if (windowId === launcherWindowId || windowId === chrome.windows.WINDOW_ID_NONE) return

  const closing = launcherWindowId
  launcherWindowId = undefined
  chrome.windows.remove(closing).catch(() => {})
})
