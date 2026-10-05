import { expect, test } from 'claude-code/testing'

import { shortModel } from './stats'

test('shortModel keeps a normal name and cuts a long one', () => {
  expect(shortModel('Opus 4.8')).toBe('Opus 4.8')
  expect(shortModel('claude-opus-4-8-with-an-extremely-long-suffix')).toHaveLength(28)
  expect(shortModel('claude-opus-4-8-with-an-extremely-long-suffix').endsWith('…')).toBe(true)
})
