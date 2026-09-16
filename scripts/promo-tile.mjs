/* Chrome Web Store marquee promo tile — 1400x560, JPEG (no alpha).
   Composites the real launcher screenshot so the tile can never drift from the UI. */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'screenshots')
const TMP = mkdtempSync(join(tmpdir(), 'quick-search-promo-'))
const MARQUEE = { w: 1400, h: 560, name: 'promo-marquee-1400x560' }
const SMALL = { w: 440, h: 280, name: 'promo-small-440x280' }

/* Branded Chrome with the old --headless renders a static file reliably;
   Chrome for Testing hangs on `--headless=new --screenshot`. This is a plain
   HTML render with no extension involved, so branded Chrome is the right tool. */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const branded = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(branded)) return branded
  const cache = join(homedir(), '.cache/puppeteer/chrome')
  for (const b of existsSync(cache) ? readdirSync(cache).sort().reverse() : []) {
    const p = join(cache, b, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  throw new Error('No Chrome found')
}

const source = join(OUT, '1-unified-results.png')
if (!existsSync(source)) { console.error('Run `npm run shots` first.'); process.exit(1) }

// The launcher card sits centred in the 1280x800 shot, so a centred crop isolates it.
const card = join(TMP, 'card.png')
execFileSync('sips', ['-c', '540', '620', source, '--out', card], { stdio: 'ignore' })

const b64 = f => readFileSync(f).toString('base64')
const html = join(TMP, 'tile.html')

writeFileSync(html, `<!doctype html><meta charset=utf-8><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${MARQUEE.w}px;height:${MARQUEE.h}px;overflow:hidden;
       background:linear-gradient(125deg,#4d5ce8 0%,#3b6bf5 45%,#2a4fd0 100%);
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
       display:flex;align-items:center;position:relative}
  body::before{content:'';position:absolute;inset:0;opacity:.13;
       background-image:radial-gradient(circle at 1px 1px,#fff 1.4px,transparent 0);
       background-size:26px 26px}
  .left{position:relative;width:660px;padding:0 0 0 72px;color:#fff}
  .brand{display:flex;align-items:center;gap:16px;margin-bottom:30px}
  .brand img{width:60px;height:60px;border-radius:14px;
       box-shadow:0 8px 22px rgba(10,20,60,.34)}
  .brand span{font-size:34px;font-weight:650;letter-spacing:-.4px}
  h1{font-size:46px;line-height:1.1;font-weight:700;letter-spacing:-1.4px;margin-bottom:22px}
  h1 em{font-style:normal;color:#c7d2ff}
  p{font-size:20px;line-height:1.45;color:#dbe3ff;max-width:420px}
  .keys{display:flex;gap:9px;margin-top:34px}
  .keys b{font-weight:600;font-size:17px;color:#fff;background:rgba(255,255,255,.17);
       border:1px solid rgba(255,255,255,.3);border-radius:9px;padding:9px 15px}
  .shot{position:absolute;right:62px;top:50%;transform:translateY(-50%);
       width:556px;border-radius:16px;overflow:hidden;
       box-shadow:0 34px 76px rgba(8,14,44,.5),0 0 0 1px rgba(255,255,255,.16)}
  .shot img{display:block;width:100%}
</style>
<div class=left>
  <div class=brand><img src="data:image/png;base64,${b64(join(ROOT, 'src/assets/logo-128-128.png'))}"><span>Quick Search</span></div>
  <h1>Every tab.<br>Every visit.<br><em>One keystroke.</em></h1>
  <p>Search open tabs, history and bookmarks together — or the web, across six engines.</p>
  <div class=keys><b>⌘</b><b>⇧</b><b>Space</b></div>
</div>
<div class=shot><img src="data:image/png;base64,${b64(card)}"></div>`)

function render(file, { w, h, name }) {
  const raw = join(TMP, `${name}-2x.png`)
  execFileSync(findChrome(), ['--headless', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=2', `--window-size=${w},${h}`,
    `--screenshot=${raw}`, `file://${file}`], { stdio: 'ignore', timeout: 60000 })
  const out = join(OUT, `${name}.jpg`)
  execFileSync('sips', ['-z', String(h), String(w), '-s', 'format', 'jpeg',
    '-s', 'formatOptions', '92', raw, '--out', out], { stdio: 'ignore' })
  const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out]).toString()
  console.log(`  ✔ ${name}.jpg  ${dims.match(/pixelWidth: (\d+)/)[1]}x${dims.match(/pixelHeight: (\d+)/)[1]}`)
}

/* The small tile is 440x280 — a screenshot is illegible at that size, so it
   carries the mark and the promise only. */
const smallHtml = join(TMP, 'small.html')
writeFileSync(smallHtml, `<!doctype html><meta charset=utf-8><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${SMALL.w}px;height:${SMALL.h}px;overflow:hidden;
       background:linear-gradient(125deg,#4d5ce8 0%,#3b6bf5 45%,#2a4fd0 100%);
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
       color:#fff;display:flex;flex-direction:column;justify-content:center;
       padding:0 34px;position:relative}
  body::before{content:'';position:absolute;inset:0;opacity:.13;
       background-image:radial-gradient(circle at 1px 1px,#fff 1.3px,transparent 0);
       background-size:22px 22px}
  .brand{position:relative;display:flex;align-items:center;gap:12px;margin-bottom:18px}
  .brand img{width:46px;height:46px;border-radius:11px;box-shadow:0 6px 16px rgba(10,20,60,.34)}
  .brand span{font-size:25px;font-weight:650;letter-spacing:-.3px}
  h1{position:relative;font-size:29px;line-height:1.16;font-weight:700;letter-spacing:-.8px}
  h1 em{font-style:normal;color:#c7d2ff}
  .keys{position:relative;display:flex;gap:7px;margin-top:20px}
  .keys b{font-weight:600;font-size:13px;background:rgba(255,255,255,.17);
       border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:6px 11px}
</style>
<div class=brand><img src="data:image/png;base64,${b64(join(ROOT, 'src/assets/logo-128-128.png'))}"><span>Quick Search</span></div>
<h1>Every tab. Every visit.<br><em>One keystroke.</em></h1>
<div class=keys><b>⌘</b><b>⇧</b><b>Space</b></div>`)

const raw = join(TMP, 'tile-2x.png')
render(html, MARQUEE)
render(smallHtml, SMALL)
rmSync(TMP, { recursive: true, force: true })
console.log(`\n→ ${OUT}`)
