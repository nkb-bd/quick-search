import type { Result } from './types'

export interface LauncherContext {
  originTabId?: number
  originWindowId?: number
}

export async function execute(result: Result, context: LauncherContext): Promise<void> {
  if (result.kind === 'command' && result.commandId) {
    await runCommand(result.commandId, context)
    return
  }

  if (result.kind === 'tab' && result.tabId !== undefined) {
    await focusTab(result.tabId)
    return
  }

  if (result.url) await openUrl(result.url, context)
}

async function focusTab(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId)
  await chrome.tabs.update(tabId, { active: true })
  if (tab.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true })
  }
}

async function openUrl(url: string, context: LauncherContext): Promise<void> {
  if (context.originWindowId !== undefined) {
    await chrome.tabs.create({ url, windowId: context.originWindowId, active: true })
    await chrome.windows.update(context.originWindowId, { focused: true })
    return
  }

  await chrome.tabs.create({ url, active: true })
}

async function runCommand(commandId: string, context: LauncherContext): Promise<void> {
  const originTabId = context.originTabId

  switch (commandId) {
    case 'tab.new':
      return void (await chrome.tabs.create({ windowId: context.originWindowId, active: true }))
    case 'window.new':
      return void (await chrome.windows.create({ focused: true }))
    case 'window.incognito':
      return void (await chrome.windows.create({ incognito: true, focused: true }))
    case 'tab.duplicate':
      return void (originTabId !== undefined && (await chrome.tabs.duplicate(originTabId)))
    case 'tab.reload':
      return void (originTabId !== undefined && (await chrome.tabs.reload(originTabId)))
    case 'tab.close':
      return void (originTabId !== undefined && (await chrome.tabs.remove(originTabId)))
    case 'tab.pin': {
      if (originTabId === undefined) return
      const tab = await chrome.tabs.get(originTabId)
      return void (await chrome.tabs.update(originTabId, { pinned: !tab.pinned }))
    }
    case 'tab.bookmark': {
      if (originTabId === undefined) return
      const tab = await chrome.tabs.get(originTabId)
      return void (await chrome.bookmarks.create({ title: tab.title, url: tab.url }))
    }
    case 'open.history':
      return void (await openUrl('chrome://history/', context))
    case 'open.bookmarks':
      return void (await openUrl('chrome://bookmarks/', context))
    case 'open.downloads':
      return void (await openUrl('chrome://downloads/', context))
    case 'open.extensions':
      return void (await openUrl('chrome://extensions/', context))
    case 'open.shortcuts':
      return void (await openUrl('chrome://extensions/shortcuts', context))
    case 'open.settings':
      return void (await chrome.runtime.openOptionsPage())
    case 'data.clearHistory':
      return void (await chrome.runtime.sendMessage({ action: 'clearHistory' }))
  }
}
