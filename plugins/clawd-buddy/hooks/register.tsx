import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ctx, GitInfo, Limit, Mood } from '../types'
import { parseGit, parseWorktree, shortPath } from './git'
import { imagesToOpen } from './images'
import { BODY_W, sprite } from './sprite'
import { AMBER, GREEN, bar, clockText, levelColor } from './stats'

const BODY = '#D97757'

const mood = atom({ plugin: 'clawd-buddy', key: 'mood' } as const, 'idle' as Mood)
const moodAt = atom({ plugin: 'clawd-buddy', key: 'moodAt' } as const, 0)
const now = atom({ plugin: 'clawd-buddy', key: 'now' } as const, 0)
const cacheAt = atom({ plugin: 'clawd-buddy', key: 'cacheAt' } as const, null as number | null)
const ctx = atom({ plugin: 'clawd-buddy', key: 'ctx' } as const, null as Ctx | null)
const limits = atom({ plugin: 'clawd-buddy', key: 'limits' } as const, [] as Limit[])
const cwd = atom({ plugin: 'clawd-buddy', key: 'cwd' } as const, '')
const git = atom({ plugin: 'clawd-buddy', key: 'git' } as const, null as GitInfo | null)

const BRANCH = '#8AB4F8'
const WORKTREE = '#C792EA'
const FRAME_MS = 250
const GIT_REFRESH_MS = 30_000
const DONE_MS = 3_000
// Fixed 1h prompt cache TTL. Add a userConfig option if 5m is needed.
const CACHE_TTL_MS = 60 * 60_000

// Reads the directory and its git state; a missing repo or a slow git just leaves it blank.
async function refreshGit($: EngineInterface) {
  const dir = await $.session.cwd()
  await update($, cwd, () => dir)
  try {
    const r = await $.process.run(['git', '--no-optional-locks', 'status', '--porcelain=v1', '-b'], { cwd: dir, timeoutMs: 5_000 })
    const w = await $.process.run(['git', 'rev-parse', '--git-dir', '--git-common-dir'], { cwd: dir, timeoutMs: 5_000 })
    const info = r.exitCode === 0 ? parseGit(r.stdout) : null
    await update($, git, () => (info ? { ...info, worktree: w.exitCode === 0 ? parseWorktree(w.stdout) : null } : null))
  } catch {
    await update($, git, () => null)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.ui.status(undefined)
    const u = await $.session.usage()
    await update($, ctx, () => u.context)
    await update($, limits, () => u.rateLimits)
    $.clock.every(FRAME_MS, async () => {
      const t = await $.clock.now()
      await update($, now, () => t)
    })
    $.clock.every(GIT_REFRESH_MS, () => refreshGit($))
    void refreshGit($)
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, ctx, () => e.context)
    if (e.rateLimits.length) await update($, limits, () => e.rateLimits)
    if (e.changed.includes('context')) {
      const t = await $.clock.now()
      await update($, cacheAt, () => t)
    }
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, mood, () => 'working' as Mood)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) return next(e)
    const t = await $.clock.now()
    await update($, moodAt, () => t)
    await update($, mood, () => (e.isAborted || e.reason === 'error' ? 'idle' : 'done') as Mood)
    void refreshGit($)
    return next(e)
  })

  // Images Claude sends to the user open in the default viewer. Best effort: no viewer, no harm.
  on('tool.call', { tool: 'SendUserFile' }, async ($, e, next) => {
    const sent = await next(e)
    const images = imagesToOpen(e.files)
    if (sent.deny === undefined && sent.isError !== true && images.length) {
      try {
        await $.process.run(['open', ...images], { timeoutMs: 5_000 })
      } catch {
        // open is missing or refused: the file still reached the user.
      }
    }
    return sent
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const t = await read($, now)
    const stored = await read($, mood)
    const doneAt = await read($, moodAt)
    const shown: Mood = e.props.isWorking ? 'working' : stored === 'done' && t - doneAt < DONE_MS ? 'done' : 'idle'
    const tick = Math.floor(t / FRAME_MS)
    const rows = sprite(shown, tick)
    // A band shorter than the mascot shows its top row only, so it is not scrolled away.
    if (e.props.maxRows < 1) return next(e)
    const shownRows = e.props.maxRows < rows.length ? rows.slice(0, 1) : rows

    const rl = await read($, limits)
    const c = await read($, ctx)
    const at = await read($, cacheAt)
    const left = at === null ? 0 : CACHE_TTL_MS - (t - at)
    const warm = at !== null && left > 0
    const meters = [
      { kind: 'five_hour', label: '5h' },
      { kind: 'seven_day', label: '7d' },
    ].map(s => ({ ...s, lim: rl.find(l => l.kind === s.kind) }))
    const dir = await read($, cwd)
    const g = await read($, git)
    const isClean = g !== null && g.staged + g.modified + g.untracked === 0

    return (
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingX={1}>
        <Box flexDirection="column">
        <Box flexDirection="row" gap={3}>
          {meters.map(s => (
            <Text key={s.kind}>
              <Text dimColor>{s.label} </Text>
              {s.lim ? (
                <Text>
                  <Text color={levelColor(s.lim.percentUsed)}>{bar(s.lim.percentUsed).on}</Text>
                  <Text dimColor>{bar(s.lim.percentUsed).off}</Text>
                  <Text color={levelColor(s.lim.percentUsed)}> {Math.round(s.lim.percentUsed)}%</Text>
                </Text>
              ) : (
                <Text dimColor>–</Text>
              )}
            </Text>
          ))}
          <Text>
            <Text dimColor>ctx </Text>
            <Text color={c?.percent === undefined ? undefined : levelColor(c.percent)} dimColor={c?.percent === undefined}>
              {c?.percent === undefined ? '–' : `${c.percent}%`}
            </Text>
          </Text>
          <Text>
            <Text dimColor>cache </Text>
            <Text color={!warm ? undefined : left < 60_000 ? AMBER : GREEN} dimColor={!warm}>
              {warm ? clockText(left) : 'cold'}
            </Text>
          </Text>
        </Box>
        <Box flexDirection="row" gap={2}>
          <Text dimColor>{dir === '' ? '–' : shortPath(dir)}</Text>
          {g && (
            <Text>
              <Text color={BRANCH}>{g.branch}</Text>
              {g.worktree ? <Text color={WORKTREE}> wt:{g.worktree}</Text> : null}
              {isClean ? <Text color={GREEN}> ✓</Text> : null}
              {g.staged > 0 ? <Text color={GREEN}> +{g.staged}</Text> : null}
              {g.modified > 0 ? <Text color={AMBER}> ~{g.modified}</Text> : null}
              {g.untracked > 0 ? <Text dimColor> ?{g.untracked}</Text> : null}
              {g.ahead > 0 ? <Text dimColor> ↑{g.ahead}</Text> : null}
              {g.behind > 0 ? <Text dimColor> ↓{g.behind}</Text> : null}
            </Text>
          )}
        </Box>
        </Box>
        <Box width={BODY_W} flexDirection="column">
          {shownRows.map((row, i) => (
            <Text key={i}>
              {row.map((cell, x) => (
                <Text key={x} color={cell.color} backgroundColor={cell.backgroundColor}>
                  {cell.ch}
                </Text>
              ))}
            </Text>
          ))}
        </Box>
      </Box>
    )
  })
}
