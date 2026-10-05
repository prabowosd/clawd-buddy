const IMAGE = /\.(png|jpe?g|gif|webp|heic|bmp|tiff?)$/i
const MAX_OPEN = 5

// Image paths worth opening: a known extension, never one that could pass for an option.
export function imagesToOpen(files: readonly string[]): string[] {
  return files.filter(f => IMAGE.test(f) && !f.startsWith('-')).slice(0, MAX_OPEN)
}

export const isPng = (file: string): boolean => /\.png$/i.test(file)

export function asAbsolute(dir: string, file: string): string {
  return file.startsWith('/') ? file : `${dir.replace(/\/$/, '')}/${file}`
}

// Only kitty and Ghostty draw an Image element. CLAWD_BUDDY_IMAGES=pane or viewer overrides the guess.
export function drawsImages(env: { program: string; term: string; kitty: string; force?: string }): boolean {
  if (env.force === 'pane') return true
  if (env.force === 'viewer') return false
  return env.kitty !== '' || /ghostty|kitty/i.test(`${env.program} ${env.term}`)
}
