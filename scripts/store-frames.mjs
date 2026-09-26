/* Chrome Web Store listing screenshots — 1280x800 PNG, caption left, launcher right.
   Composites the 3x captures from store-shots.mjs so the launcher is enlarged by
   downscaling, never upscaling, and can never drift from the real UI. */
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const RAW = join(ROOT, 'screenshots/raw')
const OUT = join(ROOT, 'screenshots/listing')
const TMP = mkdtempSync(join(tmpdir(), 'quick-search-frames-'))
const W = 1280,
  H = 800,
  SCALE = 3

// Crop boxes in CSS px of the 1280x800 capture, centred (sips -c crops around the centre).
const LAUNCHER = { w: 620, h: 540, show: 720 }
const SETTINGS = { w: 700, h: 800, show: 610 }

const FRAMES = [
  {
    shot: '1-unified-results',
    crop: LAUNCHER,
    title: 'Every tab. Every visit.<br><em>One keystroke.</em>',
    body: 'Open tabs, history, bookmarks and the web in one list — ranked by what you actually use.',
  },
  {
    shot: '2-command-palette',
    crop: LAUNCHER,
    title: 'Run the browser<br><em>from the keyboard.</em>',
    body: 'Type <b>&gt;</b> for commands: new window, pin, duplicate, reload, bookmark, settings.',
  },
  {
    shot: '3-filters',
    crop: LAUNCHER,
    title: 'One letter<br><em>narrows it down.</em>',
    body: '<b>t</b> tabs · <b>h</b> history · <b>b</b> bookmarks · <b>&gt;</b> commands — plus <b>yt</b>, <b>gh</b>, <b>npm</b> and more.',
  },
  {
    shot: '4-settings',
    crop: SETTINGS,
    title: 'Your engine.<br><em>Your sources.</em>',
    body: 'Pick the default engine, theme and what to search. No account — settings stay on your device.',
  },
  {
    shot: '5-light-theme',
    crop: LAUNCHER,
    title: 'Light or dark,<br><em>your call.</em>',
    body: 'Follows your system, or switch from the launcher footer in one click.',
  },
]

/* Same renderer choice as promo-tile.mjs: branded Chrome's old headless renders a
   static file reliably; Chrome for Testing hangs on `--headless=new --screenshot`. */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const branded = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  if (existsSync(branded)) return branded
  const cache = join(homedir(), '.cache/puppeteer/chrome')
  for (const b of existsSync(cache)
    ? readdirSync(cache).sort().reverse()
    : []) {
    const p = join(
      cache,
      b,
      'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    )
    if (existsSync(p)) return p
  }
  throw new Error('No Chrome found')
}

const b64 = (f) => readFileSync(f).toString('base64')
const logo = b64(join(ROOT, 'src/assets/logo-128-128.png'))

function page({ title, body }, card, crop) {
  return `<!doctype html><meta charset=utf-8><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;overflow:hidden;
       background:linear-gradient(125deg,#4d5ce8 0%,#3b6bf5 45%,#2a4fd0 100%);
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
       display:flex;align-items:center;position:relative;color:#fff}
  body::before{content:'';position:absolute;inset:0;opacity:.13;
       background-image:radial-gradient(circle at 1px 1px,#fff 1.4px,transparent 0);
       background-size:26px 26px}
  .left{position:relative;width:${W - crop.show - 60}px;padding:0 36px 0 64px}
  .brand{display:flex;align-items:center;gap:13px;margin-bottom:36px}
  .brand img{width:44px;height:44px;border-radius:11px;box-shadow:0 6px 18px rgba(10,20,60,.34)}
  .brand span{font-size:24px;font-weight:650;letter-spacing:-.3px}
  h1{font-size:44px;line-height:1.12;font-weight:700;letter-spacing:-1.3px;margin-bottom:22px}
  h1 em{font-style:normal;color:#c7d2ff}
  p{font-size:19px;line-height:1.5;color:#dbe3ff}
  p b{color:#fff;font-weight:650;background:rgba(255,255,255,.16);border-radius:5px;padding:0 6px}
  .shot{position:absolute;right:48px;top:50%;transform:translateY(-50%);width:${crop.show}px;
       border-radius:16px;overflow:hidden;
       box-shadow:0 34px 76px rgba(8,14,44,.5),0 0 0 1px rgba(255,255,255,.16)}
  .shot img{display:block;width:100%}
</style>
<div class=left>
  <div class=brand><img src="data:image/png;base64,${logo}"><span>Quick Search</span></div>
  <h1>${title}</h1>
  <p>${body}</p>
</div>
<div class=shot><img src="data:image/png;base64,${b64(card)}"></div>`
}

mkdirSync(OUT, { recursive: true })
try {
  for (const frame of FRAMES) {
    const source = join(RAW, `${frame.shot}@${SCALE}x.png`)
    if (!existsSync(source)) {
      console.error(`Missing ${source} — run \`pnpm shots\` first.`)
      process.exit(1)
    }

    const card = join(TMP, `${frame.shot}-card.png`)
    execFileSync(
      'sips',
      [
        '-c',
        String(frame.crop.h * SCALE),
        String(frame.crop.w * SCALE),
        source,
        '--out',
        card,
      ],
      { stdio: 'ignore' },
    )

    const html = join(TMP, `${frame.shot}.html`)
    writeFileSync(html, page(frame, card, frame.crop))

    const raw = join(TMP, `${frame.shot}-2x.png`)
    execFileSync(
      findChrome(),
      [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=2',
        `--window-size=${W},${H}`,
        `--screenshot=${raw}`,
        `file://${html}`,
      ],
      { stdio: 'ignore', timeout: 60000 },
    )

    const out = join(OUT, `${frame.shot}.png`)
    execFileSync('sips', ['-z', String(H), String(W), raw, '--out', out], {
      stdio: 'ignore',
    })
    console.log(`  ✔ listing/${frame.shot}.png  ${W}x${H}`)
  }
} finally {
  rmSync(TMP, { recursive: true, force: true })
}
console.log(`\n→ ${OUT}`)
