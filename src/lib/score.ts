import type { Result, ResultKind } from './types'

export interface Match {
  score: number
  indices: number[]
}

const BOUNDARY = /[\s\-_/.:?&=|,]/

const EXACT = 1000
const PREFIX = 900
const WORD_START = 800
const SUBSTRING = 700
const SUBSEQUENCE = 400

export function fuzzyMatch(query: string, text: string): Match | null {
  if (!query) return { score: 0, indices: [] }
  if (!text) return null

  const q = query.toLowerCase()
  const t = text.toLowerCase()

  if (q === t) return { score: EXACT, indices: range(0, q.length) }

  const at = t.indexOf(q)
  if (at === 0) return { score: PREFIX - lengthPenalty(t), indices: range(0, q.length) }
  if (at > 0) {
    const base = BOUNDARY.test(t[at - 1]) ? WORD_START : SUBSTRING
    return { score: base - lengthPenalty(t) - at, indices: range(at, q.length) }
  }

  return subsequence(q, t)
}

function subsequence(q: string, t: string): Match | null {
  const indices: number[] = []
  let bonus = 0
  let qi = 0
  let previous = -2

  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] !== q[qi]) continue

    if (i === previous + 1) bonus += 8
    if (i === 0 || BOUNDARY.test(t[i - 1])) bonus += 12

    indices.push(i)
    previous = i
    qi++
  }

  if (qi < q.length) return null

  const spread = indices[indices.length - 1] - indices[0]
  return { score: SUBSEQUENCE + bonus - spread - lengthPenalty(t), indices }
}

function lengthPenalty(text: string): number {
  return Math.min(text.length / 4, 60)
}

function range(start: number, length: number): number[] {
  return Array.from({ length }, (_, i) => start + i)
}

const KIND_WEIGHT: Record<ResultKind, number> = {
  action: 1,
  command: 1.2,
  tab: 1.35,
  bookmark: 1.15,
  history: 1,
  suggest: 0.55,
}

const DAY = 86_400_000

export function recencyBoost(timestamp?: number): number {
  if (!timestamp) return 1
  const ageDays = (Date.now() - timestamp) / DAY
  if (ageDays < 0) return 1
  return 1 + 1.2 * Math.exp(-ageDays / 7)
}

export function visitBoost(visitCount?: number): number {
  if (!visitCount || visitCount < 1) return 1
  return 1 + Math.min(Math.log10(visitCount) / 2, 0.5)
}

export function frecency(
  match: Match,
  kind: ResultKind,
  meta: { lastVisit?: number; visitCount?: number } = {},
): number {
  return match.score * KIND_WEIGHT[kind] * recencyBoost(meta.lastVisit) * visitBoost(meta.visitCount)
}

function normalizeUrl(url?: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/$/, '')
    return `${parsed.hostname.replace(/^www\./, '')}${path}${parsed.search}`
  } catch {
    return url
  }
}

const KIND_PRIORITY: ResultKind[] = ['action', 'command', 'tab', 'bookmark', 'history', 'suggest']

export function dedupe(results: Result[]): Result[] {
  const seen = new Map<string, Result>()
  const passthrough: Result[] = []

  for (const result of results) {
    const key = normalizeUrl(result.url)
    if (!key) {
      passthrough.push(result)
      continue
    }

    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, result)
      continue
    }

    const score = Math.max(result.score, existing.score)
    const winner = KIND_PRIORITY.indexOf(result.kind) < KIND_PRIORITY.indexOf(existing.kind)
      ? result
      : existing

    seen.set(key, { ...winner, score })
  }

  return [...passthrough, ...seen.values()]
}

export function rank(results: Result[]): Result[] {
  return dedupe(results).sort((a, b) => b.score - a.score)
}
