import type { Mood } from '../types'

export type Cell = { ch: string; color?: string; backgroundColor?: string }

const PALETTE: Record<string, string> = { o: '#D97757', e: '#2B1A14' }
const EYE = PALETTE.e
export const BODY_W = 11

// Squat 11x4 body: two pixel rows make one text row.
function pixels(mood: Mood, tick: number): string[] {
  const blink = mood === 'idle' && tick % 8 === 7
  const wave = mood !== 'idle' && tick % 2 === 0
  const legs = mood === 'working' && tick % 2 === 0 ? '.o..o.o..o.' : '..o.o.o.o..'
  if (wave) return ['o.ooooooo.o', blink ? '.ooooooooo.' : '.ooeoooeoo.', '..ooooooo..', legs]
  return ['..ooooooo..', blink ? 'ooooooooooo' : 'oooeoooeooo', '..ooooooo..', legs]
}

/** Draws the mascot as 2 rows of BODY_W half-block cells. */
export function sprite(mood: Mood, tick: number): Cell[][] {
  const rows = pixels(mood, tick)
  const out: Cell[][] = []
  for (let r = 0; r < rows.length; r += 2) {
    out.push(
      [...rows[r]].map((t, x) => {
        const top = PALETTE[t]
        const bottom = PALETTE[rows[r + 1][x]]
        // An eye is a quarter cell: half as wide and half as tall as a plain pixel.
        if (top && bottom === EYE) return { ch: x < BODY_W / 2 ? '▗' : '▖', color: bottom, backgroundColor: top }
        if (!top && !bottom) return { ch: ' ' }
        if (top && !bottom) return { ch: '▀', color: top }
        if (!top && bottom) return { ch: '▄', color: bottom }
        return { ch: '▀', color: top, backgroundColor: bottom }
      }),
    )
  }
  return out
}
