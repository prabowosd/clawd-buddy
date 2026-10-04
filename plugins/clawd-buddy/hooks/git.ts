import type { GitInfo } from '../types'

/** Home directory prefix becomes `~`. */
export const shortPath = (cwd: string) => cwd.replace(/^(\/Users|\/home)\/[^/]+/, '~')

/** Reads `git status --porcelain=v1 -b` output. */
export function parseGit(stdout: string): GitInfo | null {
  const [head, ...files] = stdout.split('\n')
  if (!head?.startsWith('## ')) return null
  const branch = head.slice(3).replace(/^No commits yet on /, '').split('...')[0]?.split(' ')[0] ?? ''
  const count = (re: RegExp) => Number(re.exec(head)?.[1] ?? 0)
  const info: GitInfo = { branch, staged: 0, modified: 0, untracked: 0, ahead: count(/ahead (\d+)/), behind: count(/behind (\d+)/), worktree: null }
  for (const line of files) {
    if (!line) continue
    if (line.startsWith('??')) info.untracked += 1
    else {
      if (line[0] !== ' ') info.staged += 1
      if (line[1] !== ' ') info.modified += 1
    }
  }
  return info
}

/** A linked worktree has a git dir apart from the shared one; its admin folder carries the name. */
export function parseWorktree(stdout: string): string | null {
  const [gitDir, common] = stdout.split('\n')
  if (!gitDir || !common || gitDir === common) return null
  return gitDir.split('/').filter(Boolean).pop() ?? null
}
