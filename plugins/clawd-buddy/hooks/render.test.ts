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
