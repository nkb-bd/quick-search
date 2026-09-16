const WIDTH = 620
const HEIGHT = 540
const PAGE = 'src/ui/launcher/index.html'

let launcherWindowId: number | undefined
let origin: { originTabId?: number; originWindowId?: number } = {}

export function launcherContext() {
  return origin
}

export async function openLauncher(): Promise<void> {
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
