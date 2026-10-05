import { expect, test } from 'claude-code/testing'

import { asAbsolute, drawsImages, imagesToOpen, isPng } from './images'

test('imagesToOpen keeps image files and drops everything else', () => {
  expect(imagesToOpen(['/a/shot.PNG', '/a/report.pdf', 'b/photo.jpeg', '/a/notes.md'])).toEqual(['/a/shot.PNG', 'b/photo.jpeg'])
  expect(imagesToOpen([])).toEqual([])
})

test('imagesToOpen skips a path that looks like an option', () => {
  expect(imagesToOpen(['-a.png', '/ok.png'])).toEqual(['/ok.png'])
})

test('imagesToOpen opens at most five at once', () => {
  const many = Array.from({ length: 8 }, (_, i) => `/a/${i}.png`)
  expect(imagesToOpen(many)).toHaveLength(5)
})

test('asAbsolute joins a relative path to the session directory', () => {
  expect(asAbsolute('/a/b/', 'shot.png')).toBe('/a/b/shot.png')
  expect(asAbsolute('/a/b', '/x/y.png')).toBe('/x/y.png')
})

test('drawsImages is true for kitty and Ghostty only', () => {
  expect(drawsImages({ program: 'ghostty', term: 'xterm-ghostty', kitty: '' })).toBe(true)
  expect(drawsImages({ program: '', term: 'xterm-kitty', kitty: '3' })).toBe(true)
  expect(drawsImages({ program: 'WarpTerminal', term: 'xterm-256color', kitty: '' })).toBe(false)
  expect(drawsImages({ program: 'iTerm.app', term: 'xterm-256color', kitty: '' })).toBe(false)
})

test('isPng matches the extension only', () => {
  expect(isPng('/a/Shot.PNG')).toBe(true)
  expect(isPng('/a/photo.jpg')).toBe(false)
})

test('CLAWD_BUDDY_IMAGES overrides the terminal guess', () => {
  expect(drawsImages({ program: 'WarpTerminal', term: 'xterm-256color', kitty: '', force: 'pane' })).toBe(true)
  expect(drawsImages({ program: 'ghostty', term: 'xterm-ghostty', kitty: '', force: 'viewer' })).toBe(false)
})
