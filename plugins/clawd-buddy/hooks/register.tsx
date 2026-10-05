import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ctx, GitInfo, Limit, Mood, Picture } from '../types'
import { parseGit, parseWorktree, shortPath } from './git'
import { asAbsolute, drawsImages, imagesToOpen, isPng } from './images'
import { BODY_W, sprite } from './sprite'
import { AMBER, GREEN, bar, clockText, levelColor, shortModel, windowText } from './stats'

const BODY = '#D97757'

const mood = atom({ plugin: 'clawd-buddy', key: 'mood' } as const, 'idle' as Mood)
const moodAt = atom({ plugin: 'clawd-buddy', key: 'moodAt' } as const, 0)
const now = atom({ plugin: 'clawd-buddy', key: 'now' } as const, 0)
const cacheAt = atom({ plugin: 'clawd-buddy', key: 'cacheAt' } as const, null as number | null)
const ctx = atom({ plugin: 'clawd-buddy', key: 'ctx' } as const, null as Ctx | null)
const limits = atom({ plugin: 'clawd-buddy', key: 'limits' } as const, [] as Limit[])
const cwd = atom({ plugin: 'clawd-buddy', key: 'cwd' } as const, '')
const git = atom({ plugin: 'clawd-buddy', key: 'git' } as const, null as GitInfo | null)
const picture = atom({ plugin: 'clawd-buddy', key: 'picture' } as const, null as Picture | null)
const model = atom({ plugin: 'clawd-buddy', key: 'model' } as const, '')
const effort = atom({ plugin: 'clawd-buddy', key: 'effort' } as const, '')

const PANE = 'clawd-image'

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

// The model as /model shows it; a failed read keeps the last name.
async function refreshModel($: EngineInterface) {
  try {
    const name = await $.session.model()
    await update($, model, () => name)
  } catch {
    // keep what is shown
  }
}

async function terminalDraws($: EngineInterface) {
  try {
    const r = await $.process.run(['sh', '-c', 'printf "%s|%s|%s|%s" "$TERM_PROGRAM" "$TERM" "$KITTY_WINDOW_ID" "$CLAWD_BUDDY_IMAGES"'], { timeoutMs: 2_000 })
    const [program = '', term = '', kitty = '', force = ''] = r.stdout.split('|')
    return drawsImages({ program, term, kitty, force })
  } catch {
    return false
  }
}

// The pane draws PNG only: anything else is converted once with sips into a temp file.
async function pngFor($: EngineInterface, file: string) {
  if (isPng(file)) return file
  const out = `/tmp/clawd-buddy/${await $.clock.now()}.png`
  try {
    await $.process.run(['mkdir', '-p', '/tmp/clawd-buddy'], { timeoutMs: 2_000 })
    const r = await $.process.run(['sips', '-s', 'format', 'png', file, '--out', out], { timeoutMs: 10_000 })
    return r.exitCode === 0 ? out : null
  } catch {
    return null
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
    $.clock.every(GIT_REFRESH_MS, () => Promise.all([refreshGit($), refreshModel($)]))
    void refreshGit($)
    void refreshModel($)
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

  // The main loop's effort, read off each model request; a subagent's own is left out.
  on('turn.step', async function* ($, e, next) {
    if (!e.agentId && e.effort !== undefined) await update($, effort, () => String(e.effort))
    return yield* next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, mood, () => 'working' as Mood)
    void refreshModel($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId) return next(e)
    const t = await $.clock.now()
    await update($, moodAt, () => t)
    await update($, mood, () => (e.isAborted || e.reason === 'error' ? 'idle' : 'done') as Mood)
    void refreshGit($)
    void refreshModel($)
    return next(e)
  })

  // Where the terminal can draw, a sent image shows in a pane and Preview opens only for display=render.
  // Elsewhere every image opens in the default viewer. Best effort: no viewer, no harm.
  on('tool.call', { tool: 'SendUserFile' }, async ($, e, next) => {
    const sent = await next(e)
    const images = imagesToOpen(e.files)
    if (sent.deny !== undefined || sent.isError === true || images.length === 0) return sent

    let viewer = images
    if (await terminalDraws($)) {
      const shown = asAbsolute(await $.session.cwd(), images[images.length - 1])
      const png = await pngFor($, shown)
      if (png) {
        await update($, picture, p => ({ file: png, name: shown.split('/').pop() ?? shown, n: (p?.n ?? 0) + 1 }))
        void $.ui.open({ id: PANE, title: 'Image' })
        viewer = e.display === 'render' ? images : []
      }
    }
    if (viewer.length) {
      try {
        await $.process.run(['open', ...viewer], { timeoutMs: 5_000 })
      } catch {
        // open is missing or refused: the file still reached the user.
      }
    }
    return sent
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Image } = $.ui.resolve(e)
    const p = await read($, picture)
    if (!p) return <Text dimColor>No image yet.</Text>
    const columns = Math.max(10, Math.min(120, (e.viewport?.columns ?? 60) - 2))
    const rows = Math.max(4, Math.min(60, (e.viewport?.rows ?? 24) - 4))
    return (
      <Box flexDirection="column">
        <Text dimColor>{p.name}</Text>
        <Image key="view" source={{ file: p.file, format: 'png', generation: p.n }} columns={columns} rows={rows} alt={p.name} />
      </Box>
    )
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
    const modelName = await read($, model)
    // A third row needs the band to be 3 rows tall; otherwise the model joins the second row.
    const modelOwnRow = e.props.maxRows >= 3
    const effortName = await read($, effort)
    const detail = [c?.window ? windowText(c.window) : '', effortName].filter(Boolean).join(' · ')
    const modelText =
      modelName === '' ? null : (
        <Text>
          <Text color={BODY}>{shortModel(modelName)}</Text>
          {detail === '' ? null : <Text dimColor> · {detail}</Text>}
        </Text>
      )
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
          {modelOwnRow ? null : modelText}
        </Box>
        {modelOwnRow ? modelText : null}
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
