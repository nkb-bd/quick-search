import { DEFAULT_ENGINE_ID } from './engines'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  engineId: string
  theme: ThemeMode
  sources: { tabs: boolean; bookmarks: boolean; history: boolean; suggest: boolean }
}

export const SETTINGS_KEY = 'settings'

export const DEFAULT_SETTINGS: Settings = {
  engineId: DEFAULT_ENGINE_ID,
  theme: 'system',
  sources: { tabs: true, bookmarks: true, history: true, suggest: true },
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY)
  return {
    ...DEFAULT_SETTINGS,
    ...(stored[SETTINGS_KEY] ?? {}),
    sources: { ...DEFAULT_SETTINGS.sources, ...(stored[SETTINGS_KEY]?.sources ?? {}) },
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch }
  await chrome.storage.local.set({ [SETTINGS_KEY]: next })
  return next
}

export function applyTheme(theme: ThemeMode): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}
