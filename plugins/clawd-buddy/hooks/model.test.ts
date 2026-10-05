import { expect, test } from 'claude-code/testing'

import { shortModel, windowText } from './stats'

test('shortModel turns a model id into a short name', () => {
  expect(shortModel('claude-opus-4-8')).toBe('Opus 4.8')
  expect(shortModel('claude-sonnet-5-5')).toBe('Sonnet 5.5')
  expect(shortModel('claude-fable-5-1')).toBe('Fable 5.1')
  expect(shortModel('claude-sonnet-5')).toBe('Sonnet 5')
  expect(shortModel('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5')
  expect(shortModel('claude-opus-4-8[1m]')).toBe('Opus 4.8')
  expect(shortModel('Opus 4.8 (1M context)')).toBe('Opus 4.8')
})

test('shortModel only cuts a name it does not know', () => {
  expect(shortModel('default')).toBe('default')
  expect(shortModel('some-custom-model-with-an-extremely-long-name')).toHaveLength(28)
})

test('windowText reads a context size', () => {
  expect(windowText(1_000_000)).toBe('1M')
  expect(windowText(1_500_000)).toBe('1.5M')
  expect(windowText(200_000)).toBe('200K')
})
