import { expect, test } from 'claude-code/testing'

import { shortModel } from './stats'

test('shortModel turns a model id into a short name', () => {
  expect(shortModel('claude-opus-4-8')).toBe('Opus 4.8')
  expect(shortModel('claude-sonnet-5-5')).toBe('Sonnet 5.5')
  expect(shortModel('claude-fable-5-1')).toBe('Fable 5.1')
  expect(shortModel('claude-sonnet-5')).toBe('Sonnet 5')
  expect(shortModel('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5')
  expect(shortModel('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
})

test('shortModel keeps the 1M context mark', () => {
  expect(shortModel('claude-opus-4-8[1m]')).toBe('Opus 4.8 1M')
  expect(shortModel('Opus 4.8 (1M context)')).toBe('Opus 4.8 1M')
  expect(shortModel('Sonnet 5.5')).toBe('Sonnet 5.5')
})

test('shortModel only cuts a name it does not know', () => {
  expect(shortModel('default')).toBe('default')
  expect(shortModel('some-custom-model-with-an-extremely-long-name')).toHaveLength(28)
})
