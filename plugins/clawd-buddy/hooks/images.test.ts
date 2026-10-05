import { expect, test } from 'claude-code/testing'

import { imagesToOpen } from './images'

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
