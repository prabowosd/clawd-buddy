import { expect, test } from 'claude-code/testing'

test('AbovePrompt draws the stats and the mascot on the terminal', async $ => {
  for (const isWorking of [false, true]) {
    const ui = await $.ui.mount({
      plugin: 'clawd-buddy',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking } as never,
    })
    expect(await ui.drawn()).toMatchObject({ type: 'Box' })
    expect(await ui.find({ type: 'Text', text: /cache/ })).toBeDefined()
    await ui.unmount()
  }
})

test('a one row band still draws the top row of the mascot', async $ => {
  const ui = await $.ui.mount({
    plugin: 'clawd-buddy',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: true, maxRows: 1 } as never,
  })
  expect(await ui.find({ type: 'Text', text: /▀/ })).toBeDefined()
  await ui.unmount()
})

test('the image pane says so when nothing was sent yet', async $ => {
  const ui = await $.ui.mount({
    plugin: 'clawd-buddy',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'clawd-image',
    props: {} as never,
  })
  expect(await ui.find({ type: 'Text', text: /No image yet/ })).toBeDefined()
  await ui.unmount()
})

test('the band shows the effort a classic hook reports', async ($, on) => {
  on('classic.PostToolUse', async () => ({}) as never)
  await $.classic.PostToolUse({ tool_name: 'Bash', tool_input: {}, tool_response: {}, tool_use_id: 't1', effort: { level: 'medium' } } as never)
  const ui = await $.ui.mount({
    plugin: 'clawd-buddy',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 3 } as never,
  })
  expect(await ui.find({ type: 'Text', text: /medium/ })).toBeDefined()
  await ui.unmount()
})
