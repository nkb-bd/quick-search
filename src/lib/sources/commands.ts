import { fuzzyMatch } from '../score'
import type { QueryPlan, Result, Source } from '../types'

export interface Command {
  id: string
  title: string
  subtitle?: string
  needsOriginTab?: boolean
}

export const COMMANDS: Command[] = [
  { id: 'tab.new', title: 'New tab' },
  { id: 'window.new', title: 'New window' },
  { id: 'window.incognito', title: 'New incognito window' },
  { id: 'tab.duplicate', title: 'Duplicate current tab', needsOriginTab: true },
  { id: 'tab.pin', title: 'Pin or unpin current tab', needsOriginTab: true },
  { id: 'tab.reload', title: 'Reload current tab', needsOriginTab: true },
  { id: 'tab.close', title: 'Close current tab', needsOriginTab: true },
  { id: 'tab.bookmark', title: 'Bookmark current tab', needsOriginTab: true },
  { id: 'open.history', title: 'Open browser history' },
  { id: 'open.bookmarks', title: 'Open bookmark manager' },
  { id: 'open.downloads', title: 'Open downloads' },
  { id: 'open.extensions', title: 'Open extensions' },
  { id: 'open.shortcuts', title: 'Change keyboard shortcut' },
  { id: 'open.settings', title: 'Open Quick Search settings' },
  { id: 'data.clearHistory', title: 'Clear Quick Search history', subtitle: 'Removes your saved searches' },
]

export const commandsSource: Source = {
  kind: 'command',
  local: true,
  async query({ term, only }: QueryPlan): Promise<Result[]> {
    const commandMode = only?.includes('command') ?? false
    if (!commandMode && term.length < 2) return []

    const results: Result[] = []

    for (const command of COMMANDS) {
      const match = term ? fuzzyMatch(term, command.title) : { score: 500, indices: [] }
      if (!match) continue

      results.push({
        id: `command:${command.id}`,
        kind: 'command',
        title: command.title,
        subtitle: command.subtitle,
        commandId: command.id,
        titleMatch: match.indices,
        score: commandMode ? match.score + 200 : match.score * 0.8,
      })
    }

    return results
  },
}
