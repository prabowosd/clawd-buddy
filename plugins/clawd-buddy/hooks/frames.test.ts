import { expect, test } from 'claude-code/testing'

import { BODY_W, sprite } from './sprite'

const text = (rows: ReturnType<typeof sprite>) => rows.map(r => r.map(c => c.ch).join(''))

test('every frame of every mood is 3 rows of BODY_W cells', () => {
  for (const mood of ['idle', 'working', 'done'] as const) {
    for (let tick = 0; tick < 40; tick++) {
      const rows = sprite(mood, tick)
      expect(rows.length).toBe(3)
      for (const row of rows) expect(row.length).toBe(BODY_W)
    }
  }
})

test('the resting mascot matches the one Claude Code draws', () => {
  expect(text(sprite('idle', 0))).toEqual([' ▐▛███▛█ ', '▝▜██████▀', ' ▝▝   ▝▝ '])
})

test('idle blinks, working changes frame', () => {
  expect(sprite('idle', 0)).not.toEqual(sprite('idle', 7))
  expect(sprite('working', 0)).not.toEqual(sprite('working', 1))
})

test('open eyes are the empty quadrants, a blink fills them', () => {
  expect(text(sprite('idle', 0))[0]).toContain('▛')
  expect(text(sprite('idle', 7))[0]).toBe(' ▐██████ ')
})
