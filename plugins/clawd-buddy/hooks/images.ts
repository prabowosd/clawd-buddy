const IMAGE = /\.(png|jpe?g|gif|webp|heic|bmp|tiff?)$/i
const MAX_OPEN = 5

// Image paths worth opening: a known extension, never one that could pass for an option.
export function imagesToOpen(files: readonly string[]): string[] {
  return files.filter(f => IMAGE.test(f) && !f.startsWith('-')).slice(0, MAX_OPEN)
}
