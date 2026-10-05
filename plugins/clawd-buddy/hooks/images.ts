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

// Only kitty and Ghostty draw an Image element; elsewhere it would show its alt text.
export function drawsImages(env: { program: string; term: string; kitty: string }): boolean {
  return env.kitty !== '' || /ghostty|kitty/i.test(`${env.program} ${env.term}`)
}
