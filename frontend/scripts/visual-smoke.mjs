/**
 * Headless smoke test for the animations: mount each one, drive the controls,
 * and assert the step counter actually moves.
 *
 *   node scripts/visual-smoke.mjs
 *
 * The interval is stubbed so "play" is tested deterministically instead of by
 * waiting several seconds per frame.
 */
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
})

// Capture the scheduled frame callbacks so "play" is tested deterministically
// instead of by waiting several seconds per frame.
const ticks = []
const realTimeout = dom.window.setTimeout.bind(dom.window)
dom.window.setTimeout = (fn, ms) => {
  // only intercept the player's frame scheduling; leave short waits alone
  if (ms && ms > 200) {
    ticks.push(fn)
    return -ticks.length
  }
  return realTimeout(fn, ms)
}
const realClear = dom.window.clearTimeout.bind(dom.window)
dom.window.clearTimeout = (id) => {
  if (typeof id === 'number' && id < 0) ticks[-id - 1] = null
  else realClear(id)
}
dom.window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
})

for (const k of ['window', 'document', 'HTMLElement', 'Node', 'Element', 'SVGElement', 'MouseEvent', 'Event']) {
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true })
}
// node 21+ defines navigator as a getter-only global
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
})
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const { act } = await import('react')

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
  // react-router ships CJS; let vite process it so named exports resolve
  ssr: { noExternal: ['react-router-dom', 'react-router'] },
})

const TARGETS = [
  ['WholePicture', '/src/components/visuals/WholePicture.tsx'],
  ['ThreadsAndLocks', '/src/components/visuals/ThreadsAndLocks.tsx'],
  ['ConcurrentCollections', '/src/components/visuals/ConcurrentCollections.tsx'],
  ['JavaPipeline', '/src/components/visuals/JavaPipeline.tsx'],
  ['HashMapInternals', '/src/components/visuals/HashMapInternals.tsx'],
  ['StreamPipeline', '/src/components/visuals/StreamPipeline.tsx'],
  ['GcLifecycle', '/src/components/visuals/GcLifecycle.tsx'],
  ['JvmAreas', '/src/components/visuals/JvmAreas.tsx'],
  ['Collectors', '/src/components/visuals/Collectors.tsx'],
]

const step = (el) => {
  const m = el.querySelector('.stage-head')?.textContent?.match(/(\d+)\s*\/\s*(\d+)/)
  return m ? { at: Number(m[1]), total: Number(m[2]) } : null
}
const btn = (el, text) =>
  [...el.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(text))

let failures = 0

for (const [name, path] of TARGETS) {
  const host = dom.window.document.createElement('div')
  dom.window.document.body.appendChild(host)
  ticks.length = 0

  try {
    const mod = await server.ssrLoadModule(path)
    const root = createRoot(host)
    await act(async () => {
      root.render(React.createElement(mod[name]))
    })

    const start = step(host)

    // 1. the step button
    await act(async () => {
      btn(host, '›')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    const afterNext = step(host)

    // 2. play — does it register a ticker, and does firing it advance?
    await act(async () => {
      btn(host, '▶')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    const registered = ticks.filter(Boolean).length
    const label = btn(host, '❙❙') ? 'Pause' : btn(host, '▶') ? 'Play' : '?'

    // fire successive scheduled frames — play must keep advancing, not stall
    await act(async () => { ticks.filter(Boolean).forEach((fn) => fn()) })
    const afterTick = step(host)
    await act(async () => { ticks.filter(Boolean).forEach((fn) => fn()) })
    const afterTick2 = step(host)

    // full screen: the button toggles the class, and playing survives it
    const expandBtn = host.querySelector('.stage-expand')
    await act(async () => {
      expandBtn?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    const isExpanded = !!host.querySelector('.stage--expanded')
    await act(async () => { ticks.filter(Boolean).forEach((fn) => fn()) })
    const afterExpandTick = step(host)
    await act(async () => {
      host.querySelector('.stage--expanded .stage-expand')?.dispatchEvent(
        new dom.window.MouseEvent('click', { bubbles: true }),
      )
    })
    const collapsed = !host.querySelector('.stage--expanded')

    const ok =
      start &&
      afterNext.at === start.at + 1 &&
      registered === 1 &&
      label === 'Pause' &&
      afterTick.at === afterNext.at + 1 &&
      afterTick2.at === afterTick.at + 1 &&
      isExpanded &&
      afterExpandTick.at === afterTick2.at + 1 &&
      collapsed

    if (!ok) failures++
    console.log(
      `${name.padEnd(13)} ${ok ? 'OK  ' : 'FAIL'} ` +
        `start=${start?.at}/${start?.total} step→${afterNext?.at} ` +
        `scheduled=${registered} label=${label} play→${afterTick?.at}→${afterTick2?.at} ` +
        `expand=${isExpanded ? 'y' : 'N'} playsExpanded=${afterExpandTick?.at} collapse=${collapsed ? 'y' : 'N'}`,
    )
  } catch (e) {
    failures++
    console.log(`${name.padEnd(13)} THREW ${e.message.split('\n')[0]}`)
  }
}

await server.close()
console.log(failures ? `\n${failures} failing` : '\nall animations drive correctly')
process.exit(failures ? 1 : 0)
