export const RECENT_KEY = 'recentSearches'
const MAX_RECENT = 30

export async function recentSearches(): Promise<string[]> {
  const stored = await chrome.storage.local.get(RECENT_KEY)
  return Array.isArray(stored[RECENT_KEY]) ? stored[RECENT_KEY] : []
}

export async function rememberSearch(term: string): Promise<void> {
  const clean = term.trim()
  if (!clean) return

  const existing = await recentSearches()
  const next = [clean, ...existing.filter(item => item.toLowerCase() !== clean.toLowerCase())]
  await chrome.storage.local.set({ [RECENT_KEY]: next.slice(0, MAX_RECENT) })
}

export async function clearRecentSearches(): Promise<void> {
  await chrome.storage.local.set({ [RECENT_KEY]: [] })
}
