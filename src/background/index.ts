import { searchUrl } from '../lib/engines'
import { clearRecentSearches } from '../lib/recent'
import { loadSettings } from '../lib/settings'
import { launcherContext, openLauncher } from './launcherWindow'

const SUGGEST_ENDPOINT = 'https://suggestqueries.google.com/complete/search'

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/welcome/index.html') })
  }
})

chrome.action.onClicked.addListener(() => {
  void openLauncher()
})

chrome.commands.onCommand.addListener(command => {
  if (command === 'open-launcher') void openLauncher()
})

type Respond = (response?: unknown) => void

chrome.runtime.onMessage.addListener((message, _sender, sendResponse: Respond) => {
  if (message?.action === 'getContext') {
    sendResponse(launcherContext())
    return false
  }

  if (message?.action === 'clearHistory') {
    clearRecentSearches().then(() => sendResponse({ ok: true }))
    return true
  }

  if (message?.action === 'suggest') {
    fetchSuggestions(message.term)
      .then(suggestions => sendResponse({ suggestions }))
      .catch(() => sendResponse({ suggestions: [] }))
    return true
  }

  return false
})

async function fetchSuggestions(term: string): Promise<string[]> {
  if (!term) return []

  const response = await fetch(`${SUGGEST_ENDPOINT}?client=chrome&q=${encodeURIComponent(term)}`)
  const data = await response.json()
  return Array.isArray(data?.[1]) ? data[1] : []
}

chrome.omnibox.setDefaultSuggestion({ description: 'Quick Search: open tabs, history and bookmarks' })

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  void buildOmniboxSuggestions(text).then(suggest)
})

chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  const url = text.startsWith('http') ? text : searchUrl((await loadSettings()).engineId, text)

  if (disposition === 'newForegroundTab') await chrome.tabs.create({ url })
  else if (disposition === 'newBackgroundTab') await chrome.tabs.create({ url, active: false })
  else await chrome.tabs.update({ url })
})

async function buildOmniboxSuggestions(text: string) {
  if (!text.trim()) return []

  const [tabs, history] = await Promise.all([
    chrome.tabs.query({}),
    chrome.history.search({ text, maxResults: 5, startTime: 0 }),
  ])

  const matched = tabs
    .filter(tab => `${tab.title} ${tab.url}`.toLowerCase().includes(text.toLowerCase()))
    .slice(0, 3)
    .map(tab => ({ content: tab.url ?? '', description: `Tab — ${escapeXml(tab.title ?? '')}` }))

  const visited = history
    .filter(item => item.url)
    .map(item => ({
      content: item.url ?? '',
      description: `History — ${escapeXml(item.title || item.url || '')}`,
    }))

  return [...matched, ...visited].filter(item => item.content).slice(0, 6)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
