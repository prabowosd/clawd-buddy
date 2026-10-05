# clawd-buddy

A small mascot and a two line status band above the Claude Code prompt.

The left side shows how much of your usage window is gone, how full the context is, how long the prompt cache stays warm, which directory you are in, and the git state of that directory. The right side is a small mascot that blinks while idle and waves while Claude works.

```
5h ━━────  3%   7d ━─────  7%   ctx 30%   cache 59:12
~/www/app   main ~1 ?2 ↑1 wt:app-topic
```

The mascot is drawn with half-block characters and 24-bit colour, so there are no images and nothing to download.

## Install

Inside Claude Code:

```
/plugin marketplace add prabowosd/clawd-buddy
/plugin install clawd-buddy@clawd-buddy
/reload-plugins
```

To try it without installing, clone the repo and start Claude Code with:

```
claude --plugin-dir plugins/clawd-buddy
```

It was built and tested on Claude Code 2.1.289, on macOS, in a terminal. The band is only drawn by Claude Code on the terminal and desktop surfaces.

## What it shows

| Item | Meaning |
| --- | --- |
| model | The main loop's model, as `/model` shows it, in the mascot's colour on its own row under the directory and git state, then the context window and the effort level in grey: `Opus 4.8 · 1M · high`. The id is shortened, so `claude-opus-4-8[1m]` reads `Opus 4.8`, and a name that is no known family is cut at 28 characters. The effort shows after the first request of the session. A band with room for only two rows puts all of it at the end of the second row. |
| `5h`, `7d` | Rate limit usage for the 5 hour and 7 day windows, as a bar and a percentage. Green below 70%, amber from 70%, red from 90%. A dash means Claude Code has not reported a value yet. |
| `ctx` | Share of the context window in use, coloured the same way. |
| `cache` | Countdown of the prompt cache. It restarts after each response and turns amber in the last minute. `cold` means it has expired or nothing has been sent yet. |
| directory | The session directory, with your home folder shortened to `~`. |
| git | Branch, then `✓` when clean. Otherwise `+n` staged, `~n` modified, `?n` untracked, `↑n` ahead and `↓n` behind. Inside a linked worktree the worktree name follows as `wt:name`. |

The mascot has three moods: idle (blinks every couple of seconds), working (waves and shuffles its feet while a turn runs) and done (waves for three seconds after a turn finishes).

## Behaviour worth knowing

- The cache countdown assumes a 1 hour cache. There is no setting for the 5 minute cache yet.
- Git is read with `git status --porcelain=v1 -b` and `git rev-parse`. Both are read only, `--no-optional-locks` keeps `status` from taking the index lock, and nothing touches the network. It refreshes when a turn ends and every 30 seconds, so a `cd` can take up to 30 seconds to show.
- Outside a git repository only the directory is shown.
- If the terminal gives the band less room than the mascot needs, only its top row is drawn.
- The band steps aside while Claude Code is showing a survey.
- The font needs the block elements and box drawing ranges (U+2580 and U+2500). Most terminal fonts have them.

## Images

When Claude sends you an image with the `SendUserFile` tool (PNG, JPEG, GIF, WebP, HEIC, BMP or TIFF, at most five per call):

- In a terminal that can draw pictures (kitty, Ghostty) the last image shows in an `Image` pane. A PNG is read as it is, anything else is converted once with `sips` into `/tmp/clawd-buddy`. Preview opens too, but only when Claude sent the file with `display: render`.
- In any other terminal (Warp, iTerm, Terminal) every image opens in the default viewer with `open`, so on macOS it lands in Preview.

To force the pane in a terminal that is not guessed right, start Claude Code with `CLAWD_BUDDY_IMAGES=pane`. `CLAWD_BUDDY_IMAGES=viewer` always uses the default viewer.

Other files are left alone. If a viewer is missing or fails the file still reaches you and nothing is shown. Images are handled after the tool call succeeds. The pane needs a wide terminal to seat on its own, so on a narrow one it waits.

## Layout

```
.claude-plugin/marketplace.json     marketplace entry
plugins/clawd-buddy/
  .claude-plugin/plugin.json        plugin manifest
  hooks/register.tsx                hooks, state and the band
  hooks/sprite.ts                   the mascot frames
  hooks/stats.ts                    bars, colours, the clock
  hooks/git.ts                      git and worktree parsing
  hooks/images.ts                   which sent files count as images
  hooks/*.test.ts                   tests
  types/index.d.ts                  state types
```

The mascot lives in `sprite.ts` as plain strings, one character per pixel, so changing it is a matter of editing a few rows.

## Development

```
claude plugin validate .
claude plugin test plugins/clawd-buddy
```

For a live loop, keep the plugin in a folder Claude Code watches for mods and edit it while a session is open. It reloads when a turn ends.

## License

MIT
