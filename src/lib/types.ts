export type ResultKind = 'action' | 'tab' | 'bookmark' | 'history' | 'suggest' | 'command'

export interface Result {
  id: string
  kind: ResultKind
  title: string
  subtitle?: string
  url?: string
  score: number
  titleMatch?: number[]
  tabId?: number
  windowId?: number
  commandId?: string
  engineId?: string
}

export interface Source {
  kind: ResultKind
  local: boolean
  query(input: QueryPlan, signal: AbortSignal): Promise<Result[]>
}

export interface QueryPlan {
  raw: string
  term: string
  engineId: string
  only: ResultKind[] | null
}
