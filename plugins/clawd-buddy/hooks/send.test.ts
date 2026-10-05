import { expect, test } from 'claude-code/testing'

const RUN = (stdout = '') => ({ exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })

async function sendImage($: any, on: any, terminal: string) {
  const argvs: string[][] = []
  on('process.run', async (_$: any, e: any) => {
    argvs.push([...e.argv])
    return { value: RUN(e.argv[0] === 'sh' ? terminal : '') }
  })
  on('tool.call', { tool: 'SendUserFile' }, async () => ({ result: {} as never }))
  await $.tool.call({ tool: 'SendUserFile', files: ['/tmp/shot.png'], status: 'normal' })
  return argvs
}

test('outside kitty and Ghostty a sent image opens in the default viewer', async ($, on) => {
  const argvs = await sendImage($, on, 'WarpTerminal|xterm-256color|')
  expect(argvs.some(a => a[0] === 'open' && a.includes('/tmp/shot.png'))).toBe(true)
})

test('in Ghostty a sent image goes to the pane, not the viewer', async ($, on) => {
  const argvs = await sendImage($, on, 'ghostty|xterm-ghostty|')
  expect(argvs.some(a => a[0] === 'open')).toBe(false)
})
