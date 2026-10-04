import { expect, test } from 'claude-code/testing'

import { parseGit, parseWorktree, shortPath } from './git'

test('parseGit reads branch, counts and ahead/behind', () => {
  const out = '## dev...origin/dev [ahead 2, behind 1]\n M a.php\nM  b.php\nMM c.php\n?? d.txt\n?? e.txt\n'
  expect(parseGit(out)).toEqual({ branch: 'dev', staged: 2, modified: 2, untracked: 2, ahead: 2, behind: 1, worktree: null })
  expect(parseGit('## feat/x\n')).toEqual({ branch: 'feat/x', staged: 0, modified: 0, untracked: 0, ahead: 0, behind: 0, worktree: null })
  expect(parseGit('')).toBe(null)
})

test('shortPath swaps the home directory for ~', () => {
  expect(shortPath('/Users/alex/www/app')).toBe('~/www/app')
  expect(shortPath('/var/www')).toBe('/var/www')
})

test('parseWorktree names a linked worktree only', () => {
  expect(parseWorktree('.git\n.git\n')).toBe(null)
  expect(parseWorktree('/a/app/.git/worktrees/app-topic\n/a/app/.git\n')).toBe('app-topic')
  expect(parseWorktree('')).toBe(null)
})
