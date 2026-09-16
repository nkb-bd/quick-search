import { engineByBang } from './engines'
import type { QueryPlan, ResultKind } from './types'

const FILTERS: Record<string, ResultKind[]> = {
  t: ['tab'],
  h: ['history'],
  b: ['bookmark'],
  s: ['suggest'],
}

export const FILTER_HINTS = [
  { prefix: 't', label: 'Open tabs' },
  { prefix: 'h', label: 'History' },
  { prefix: 'b', label: 'Bookmarks' },
  { prefix: '>', label: 'Commands' },
]

export function parseQuery(raw: string, defaultEngineId: string): QueryPlan {
  const plan: QueryPlan = { raw, term: raw.trim(), engineId: defaultEngineId, only: null }

  if (plan.term.startsWith('>')) {
    return { ...plan, term: plan.term.slice(1).trim(), only: ['command'] }
  }

  const spaceAt = plan.term.indexOf(' ')
  if (spaceAt < 1) return plan

  const token = plan.term.slice(0, spaceAt).toLowerCase()
  const rest = plan.term.slice(spaceAt + 1).trim()
  if (!rest) return plan

  if (FILTERS[token]) return { ...plan, term: rest, only: FILTERS[token] }

  const engine = engineByBang(token)
  if (engine) return { ...plan, term: rest, engineId: engine.id, only: ['suggest'] }

  return plan
}
