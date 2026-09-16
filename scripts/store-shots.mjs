/* Store screenshots for Quick Search.
   Renders the real launcher components against the stubbed chrome.* preview
   (see vite.preview.config.ts) in Chrome for Testing, at exactly 1280x800. */
import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'screenshots')
const PROFILE = mkdtempSync(join(tmpdir(), 'quick-search-shots-'))
const CDP_PORT = 9355
const VITE_PORT = 5599
const W = 1280, H = 800

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = join(homedir(), '.cache/puppeteer/chrome')
  if (!existsSync(cache)) return null
  for (const b of readdirSync(cache).sort().reverse()) {
    const p = join(cache, b, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
    if (existsSync(p)) return p
    const l = join(cache, b, 'chrome-linux64/chrome')
    if (existsSync(l)) return l
  }
  return null
}

const CHROME = findChrome()
if (!CHROME) { console.error('No Chrome for Testing. Run: npx @puppeteer/browsers install chrome@stable'); process.exit(1) }

const http = async (path, method = 'GET') => {
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}${path}`, { method })
  const body = await res.text()
  // /json/close answers with the plain string "Target is closing", not JSON.
  try { return JSON.parse(body) } catch { return body }
}

const vite = spawn('npx', ['vite', '--config', 'vite.preview.config.ts', '--port', String(VITE_PORT), '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' })
const chrome = spawn(CHROME, [
  `--user-data-dir=${PROFILE}`, `--remote-debugging-port=${CDP_PORT}`,
  '--headless=new', '--no-first-run', '--no-default-browser-check',
  '--force-device-scale-factor=2', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })

let failures = 0

async function connect(url) {
  const t = await http(`/json/new?${encodeURIComponent(url)}`, 'PUT')
  if (!t?.webSocketDebuggerUrl) throw new Error(`no debugger url: ${JSON.stringify(t).slice(0, 120)}`)
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('websocket open timed out')), 10000)
    ws.onopen = () => { clearTimeout(timer); resolve() }
    ws.onerror = e => { clearTimeout(timer); reject(new Error(`websocket error: ${e.message ?? 'failed'}`)) }
  })
  let id = 0
  const pending = new Map()
  ws.onmessage = e => {
    const m = JSON.parse(e.data)
    if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
      const timer = setTimeout(() => { pending.delete(mid); reject(new Error(`${method} timed out`)) }, 30000)
      pending.set(mid, r => { clearTimeout(timer); resolve(r) })
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: false })
  return { send, close: () => ws.close(), targetId: t.id }
}

const evaluate = (c, expression) => c.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })

/* Vite compiles the entry on first request, so the app can mount well after load.
   Waiting on the rendered element beats guessing with a sleep. */
async function waitFor(c, selector, tries = 24) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < tries; i++) {
      const r = await evaluate(c, `!!document.querySelector('${selector}')`)
      if (r?.result?.value === true) return
      await sleep(250)
    }
    // Vite's first-run dep optimization can 504 the entry module; that page never
    // recovers on its own, so reload once before giving up.
    if (pass === 0) { await c.send('Page.reload', { ignoreCache: true }); await sleep(1000) }
  }
  throw new Error(`never rendered: ${selector}`)
}

async function type(c, text) {
  await evaluate(c, `document.querySelector('.field__input')?.focus()`)
  for (const ch of text) {
    await c.send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch })
    await c.send('Input.dispatchKeyEvent', { type: 'keyUp', text: ch })
    await sleep(40)
  }
}

async function shoot(name, opts) {
  // The first capture after launch can outrun Chrome's warm-up; one retry covers it.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (await capture(name, opts, attempt === 1)) return
  }
  failures++
}

async function capture(name, { url, query = '', theme, settle = 900, ready = '.field__input' }, isRetry) {
  try {
    const c = await connect(url)
    await waitFor(c, ready)
    await sleep(500)
    if (theme) await evaluate(c, `document.documentElement.setAttribute('data-theme','${theme}')`)
    if (query) { await type(c, query); await sleep(settle) }
    await sleep(500)
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    const raw = join(tmpdir(), `${name}-2x.png`)
    writeFileSync(raw, Buffer.from(data, 'base64'))
    execFileSync('sips', ['-z', String(H), String(W), raw, '--out', join(OUT, `${name}.png`)], { stdio: 'ignore' })
    rmSync(raw, { force: true })
    console.log(`  ✔ ${name}.png  ${W}x${H}`)
    c.close(); await http(`/json/close/${c.targetId}`)
    return true
  } catch (e) {
    if (isRetry) console.log(`  ✘ ${name} — ${e.message}`)
    return false
  }
}

try {
  for (let i = 0; i < 60; i++) { try { await http('/json/version'); break } catch { await sleep(250) } }
  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${VITE_PORT}/`); break } catch { await sleep(250) }
  }
  mkdirSync(OUT, { recursive: true })
  // Prime Vite: the first request compiles the entry graph, which can outlast a page load.
  for (const path of ['/', '/main.ts', '/options.html', '/options.ts']) {
    try { await fetch(`http://127.0.0.1:${VITE_PORT}${path}`) } catch { /* not fatal */ }
  }
  await sleep(1500)

  const launcher = `http://127.0.0.1:${VITE_PORT}/`
  /* The first CDP target after launch races Chrome's warm-up; burn one on a
     throwaway so every captured shot runs warm. */
  try {
    const warm = await connect(launcher)
    await waitFor(warm, '.field__input')
    warm.close(); await http(`/json/close/${warm.targetId}`)
  } catch { /* warm-up only */ }

  /* Theme is pinned per shot: headless Chrome reports a light color scheme, so
     without this the set silently changes with whatever host runs it. */
  await shoot('1-unified-results', { url: launcher, query: 'gith', theme: 'dark', settle: 1200 })
  await shoot('2-command-palette', { url: launcher, query: '>', theme: 'dark' })
  await shoot('3-filters', { url: launcher, theme: 'dark' })
  await shoot('4-settings', { url: `http://127.0.0.1:${VITE_PORT}/options.html`, ready: '.page .card', theme: 'dark' })
  await shoot('5-light-theme', { url: launcher, query: 'gith', theme: 'light', settle: 1200 })

  console.log(`\n→ ${OUT}`)
} finally {
  chrome.kill(); vite.kill()
  rmSync(PROFILE, { recursive: true, force: true })
  process.exit(failures ? 1 : 0)
}
