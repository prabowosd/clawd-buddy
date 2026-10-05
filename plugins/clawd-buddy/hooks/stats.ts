const cut = (name: string): string => (name.length > 28 ? `${name.slice(0, 27)}…` : name)

// claude-opus-4-8[1m] becomes "Opus 4.8"; the context size is shown apart. An unknown name is only cut short.
export function shortModel(name: string): string {
  const low = name.toLowerCase()
  const m = low.match(/(opus|sonnet|haiku|fable)[\s-]*(\d{1,2})(?!\d)(?:[\s.-]+(\d{1,2})(?!\d))?/)
  if (!m) return cut(name)
  const family = m[1][0].toUpperCase() + m[1].slice(1)
  const version = m[3] ? `${m[2]}.${m[3]}` : m[2]
  return `${family} ${version}`
}

// 1000000 reads 1M, 200000 reads 200K.
export function windowText(tokens: number): string {
  if (tokens >= 1_000_000) return `${Number((tokens / 1_000_000).toFixed(1))}M`
  return `${Math.round(tokens / 1000)}K`
}

export const GREEN = '#4cc35a'
export const AMBER = '#e5a33a'
export const RED = '#e5534b'

export const levelColor = (p: number) => (p >= 90 ? RED : p >= 70 ? AMBER : GREEN)

/** A thin line: heavy for the used part, light for the rest. */
export function bar(percent: number, width = 6): { on: string; off: string } {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return { on: '━'.repeat(filled), off: '─'.repeat(width - filled) }
}

export function clockText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
