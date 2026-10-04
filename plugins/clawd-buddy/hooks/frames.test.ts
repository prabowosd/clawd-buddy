import { expect, test } from 'claude-code/testing'

import { BODY_W, sprite } from './sprite'

test('every frame of every mood is 2 rows of BODY_W cells', () => {
  for (const mood of ['idle', 'working', 'done'] as const) {
    for (let tick = 0; tick < 40; tick++) {
      const rows = sprite(mood, tick)
      expect(rows.length).toBe(2)
      for (const row of rows) expect(row.length).toBe(BODY_W)
    }
  }
})

test('idle blinks, working changes frame', () => {
  expect(sprite('idle', 0)).not.toEqual(sprite('idle', 7))
  expect(sprite('working', 0)).not.toEqual(sprite('working', 1))
})

test('open eyes are quarter cells, a blink has none', () => {
  const eyes = (rows: ReturnType<typeof sprite>) => rows.flat().filter(c => c.ch === '▗' || c.ch === '▖').length
  expect(eyes(sprite('idle', 0))).toBe(2)
  expect(eyes(sprite('idle', 7))).toBe(0)
})
