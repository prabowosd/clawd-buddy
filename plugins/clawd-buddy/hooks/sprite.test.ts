import { expect, test } from 'claude-code/testing'

import { bar, clockText } from './stats'

test('bar and clock format', () => {
  expect(bar(50)).toEqual({ on: '━━━', off: '───' })
  expect(bar(150).on).toBe('━━━━━━')
  expect(clockText(59_000)).toBe('0:59')
})
