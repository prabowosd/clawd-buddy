import type { Mood } from '../types'

export type Cell = { ch: string; color?: string; backgroundColor?: string }

export const BODY = '#D77757'
export const BODY_W = 9
const EYE_BG = '#000000'

// Index bits UL=1 UR=2 LL=4 LR=8: the quadrant block that draws those pixels.
const QUADRANT = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█']

// The Claude Code mascot as 18x6 pixels, two per cell each way: o is body, e an eye, . nothing.
const BASE = [
  '...ooooooooooooo..',
  '...ooeoooooooeoo..',
  '.ooooooooooooooooo',
  '...ooooooooooooo..',
  '...o.o.......o.o..',
  '..................',
]

function frame(mood: Mood, tick: number): string[] {
  const g = BASE.map(r => [...r])
  const set = (r: number, xs: number[], v: string) => xs.forEach(x => (g[r][x] = v))

  if (mood === 'idle') {
    if (tick % 8 === 7) set(1, [5, 13], 'o')
  } else {
    // One arm up, then the other: it waves while Claude works and when it finishes.
    const left = tick % 2 === 0
    set(2, left ? [1, 2] : [16, 17], '.')
    set(1, left ? [1, 2] : [16, 17], 'o')
    if (mood === 'working') {
      set(4, [3, 5, 13, 15], '.')
      set(4, tick % 4 < 2 ? [4, 6, 12, 14] : [2, 4, 14, 16], 'o')
    }
  }
  return g.map(r => r.join(''))
}

/** Draws the mascot as 3 rows of BODY_W quadrant-block cells. */
export function sprite(mood: Mood, tick: number): Cell[][] {
  const g = frame(mood, tick)
  const on = (r: number, x: number) => (g[r][x] === 'o' ? 1 : 0)
  const rows: Cell[][] = []
  for (let r = 0; r < g.length; r += 2) {
    const row: Cell[] = []
    for (let c = 0; c < BODY_W; c++) {
      const bits = on(r, c * 2) + on(r, c * 2 + 1) * 2 + on(r + 1, c * 2) * 4 + on(r + 1, c * 2 + 1) * 8
      const hasEye = g[r][c * 2] === 'e' || g[r][c * 2 + 1] === 'e' || g[r + 1][c * 2] === 'e' || g[r + 1][c * 2 + 1] === 'e'
      // The eyes are the empty quadrants of the first row, on a black ground like the real one.
      row.push(r === 0 && c >= 2 && c <= 7 ? { ch: QUADRANT[bits], color: BODY, backgroundColor: EYE_BG } : bits === 0 && !hasEye ? { ch: ' ' } : { ch: QUADRANT[bits], color: BODY })
    }
    rows.push(row)
  }
  return rows
}
