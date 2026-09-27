/* Store promo video for Quick Search — 1280x800 WebM (YouTube takes it as-is).
   Records the real launcher components against the stubbed chrome.* preview,
   the same source store-shots.mjs uses, so the video can never drift from the UI. */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'screenshots/quick-search-promo.webm')
const VITE_PORT = 5601
const SIZE = { width: 1280, height: 800 }

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = join(homedir(), '.cache/puppeteer/chrome')
  for (const b of existsSync(cache) ? readdirSync(cache).sort().reverse() : []) {
    const p = join(cache, b, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  throw new Error('No Chrome for Testing. Run: npx @puppeteer/browsers install chrome@stable')
}

// The launcher starts hidden so the shortcut visibly "opens" it.
const OVERLAY = `(() => {
  const s = document.createElement('style')
  s.textContent = \`
    #frame{zoom:1.2;margin-bottom:100px;transition:opacity .25s,transform .25s;opacity:0;transform:scale(.97)}
    #frame.open{opacity:1;transform:none}
    #promo-cap{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);z-index:9999;
      font:700 30px/1.2 -apple-system,system-ui,sans-serif;letter-spacing:-.02em;color:#fff;
      background:rgba(59,107,245,.95);padding:16px 28px;border-radius:16px;transition:opacity .25s;opacity:0;
      box-shadow:0 18px 50px rgba(0,0,0,.35);white-space:nowrap}
    #promo-key{position:fixed;right:36px;top:32px;z-index:9999;display:flex;gap:6px;transition:opacity .2s;opacity:0}
    #promo-key b{font:600 22px -apple-system,system-ui,sans-serif;color:#fff;background:#3b6bf5;
      border-radius:10px;padding:9px 15px;box-shadow:0 8px 22px rgba(20,40,120,.4)}\`
  document.head.append(s)
  document.body.insertAdjacentHTML('beforeend', '<div id=promo-cap></div><div id=promo-key></div>')
})()`

async function caption(page, text) {
  await page.evaluate((t) => {
    const el = document.getElementById('promo-cap')
    el.style.opacity = t ? '1' : '0'
    if (t) el.textContent = t
  }, text)
}

async function badge(page, combo) {
  await page.evaluate((k) => {
    const el = document.getElementById('promo-key')
    el.innerHTML = k.map((x) => `<b>${x}</b>`).join('')
    el.style.opacity = '1'
    setTimeout(() => (el.style.opacity = '0'), 900)
  }, combo)
}

async function clear(page, n) {
  for (let i = 0; i < n; i++) await page.keyboard.press('Backspace')
}

const vite = spawn('npx', ['vite', '--config', 'vite.preview.config.ts', '--port', String(VITE_PORT), '--host', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' })
const VIDEO_DIR = mkdtempSync(join(tmpdir(), 'quick-search-video-'))
const browser = await chromium.launch({ executablePath: findChrome(), headless: true })

try {
  const launcher = `http://127.0.0.1:${VITE_PORT}/`
  for (let i = 0; i < 60; i++) { try { await fetch(launcher); break } catch { await sleep(250) } }

  // Warm Vite's dependency optimizer off-camera so the recorded page loads first time.
  const warm = await browser.newPage()
  await warm.goto(launcher)
  await warm.waitForSelector('.field__input', { timeout: 30000 }).catch(() => warm.reload())
  await warm.close()

  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: VIDEO_DIR, size: SIZE } })
  const page = await ctx.newPage()
  await page.goto(launcher)
  await page.waitForSelector('.field__input', { timeout: 30000 })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await page.evaluate(OVERLAY)
  await sleep(1200)

  await caption(page, 'Looking for that tab again?')
  await sleep(2000)
  await badge(page, ['⌘', '⇧', 'Space'])
  await page.evaluate(() => document.getElementById('frame').classList.add('open'))
  await page.focus('.field__input')
  await caption(page, 'One shortcut opens Quick Search — on any page')
  await sleep(2200)

  await caption(page, 'Tabs, history and bookmarks in one list')
  await page.keyboard.type('gith', { delay: 170 })
  await sleep(2600)

  await clear(page, 4)
  await caption(page, 'Run the browser from the keyboard')
  await page.keyboard.type('>', { delay: 170 })
  await sleep(900)
  for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowDown'); await sleep(350) }
  await sleep(1500)

  await clear(page, 1)
  await caption(page, 'Search any site in two letters')
  await page.keyboard.type('yt lofi', { delay: 150 })
  await sleep(2400)

  await clear(page, 7)
  await caption(page, 'Six engines — press Tab to switch')
  await page.keyboard.type('lofi beats', { delay: 120 })
  await sleep(700)
  for (let i = 0; i < 5; i++) { await badge(page, ['Tab']); await page.keyboard.press('Tab'); await sleep(850) }
  await sleep(500)

  await caption(page, 'Or click the one you want')
  const chip = page.locator('.engines .engine', { hasText: 'DuckDuckGo' })
  await chip.evaluate((el) => { el.style.transition = 'box-shadow .2s'; el.style.boxShadow = '0 0 0 3px #7da2ff' })
  await sleep(500)
  await chip.click()
  await sleep(1400)
  await chip.evaluate((el) => { el.style.boxShadow = '' })

  await clear(page, 10)
  await caption(page, 'Or prefix it: p = Perplexity, d = DuckDuckGo')
  await page.keyboard.type('p lofi beats', { delay: 130 })
  await sleep(2600)

  await caption(page, 'Quick Search — every tab, every visit, one keystroke')
  await sleep(3000)
  await ctx.close()
} finally {
  await browser.close()
  vite.kill()
}

const [webm] = readdirSync(VIDEO_DIR)
  .map((f) => join(VIDEO_DIR, f))
  .sort((a, b) => statSync(b).size - statSync(a).size)
copyFileSync(webm, OUT)
rmSync(VIDEO_DIR, { recursive: true, force: true })
console.log(`✔ ${OUT}`)
