export type Mood = 'idle' | 'working' | 'done'
export type Limit = { kind: string; percentUsed: number; resetsAt?: string }
export type Ctx = { tokens?: number; window: number; percent?: number }
export type GitInfo = { branch: string; staged: number; modified: number; untracked: number; ahead: number; behind: number; worktree: string | null }

declare module 'claude-code' {
  interface PluginState {
    'clawd-buddy': {
      mood: Mood
      moodAt: number
      now: number
      cacheAt: number | null
      ctx: Ctx | null
      limits: Limit[]
      cwd: string
      git: GitInfo | null
    }
  }
}
