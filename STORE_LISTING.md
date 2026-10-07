# Chrome Web Store listing copy

Paste-ready text for the Developer Dashboard. Keep this file in sync with the
submitted listing so the next release starts from what is actually live.

---

## Short description (132 char limit — currently 126)

> One shortcut to search open tabs, history, bookmarks and the web. Works on every page, even chrome://. Never reads your pages.

This is the `description` field in `package.json`, which the manifest inherits. Change it there,
not here, or the two will drift.

---

## Single purpose

> Quick Search provides a keyboard launcher that searches the user's open tabs, browsing history,
> bookmarks and chosen web search engine from a single input, and opens the selected result.

---

## Detailed description

Plain text — the dashboard does not render Markdown. Paste as-is.

Never list engine or site names here: a list of brands is rejected as keyword spam
(Yellow Argon, 1.1.0). Describe the feature and point to Settings instead.

```text
Search your open tabs, history, bookmarks and the web from one shortcut.

Press Cmd+Shift+Space (Ctrl+Shift+Space on Windows) anywhere in Chrome, type, and press Enter. Results from every source appear together, ranked by how recently and how often you visit them.

Works on every page
Opens in its own window, so it also works on chrome:// pages, the Web Store and PDFs. Prefer it inside the page or in Chrome's side panel? Pick either in Settings. In full screen it opens inside the page, so it never pulls you out to another desktop.

Private by design
Quick Search never reads the pages you visit. The only thing that leaves your device is what you type, sent to Google Suggest for autocomplete, and you can turn that off in Settings. No account, no analytics, no tracking.

Keyboard first
• Tab — switch search engine; choose your default in Settings
• t, h, b — search only tabs, history or bookmarks
• > — browser commands: close, pin, duplicate or bookmark a tab, open incognito
• Short prefixes search popular sites directly; the full list is in Settings
• Cmd/Ctrl+1–9 — open a result directly
• Esc — clear or close

Also in the address bar: type qs, then Space, then your search.

Light, dark or system theme. Open source.
```

---

## Permission justifications

Each field in the dashboard must justify one permission. These match PRIVACY_POLICY.md.

**tabs** — Matches the user's open tabs against their query so they can switch to an existing tab
instead of opening a duplicate, and activates the tab they select.

**history** — Matches pages the user has already visited against their query, so they can return to
a page without remembering its URL. History is read on demand and never copied or transmitted.

**bookmarks** — Matches the user's bookmarks against their query, and creates a bookmark for the
current tab when the user runs the "Bookmark current tab" command.

**favicon** — Displays site icons for tab and bookmark results using Chrome's local favicon cache,
so no icon requests are made to any external service.

**storage** — Stores the user's settings (default engine, theme, which sources are enabled) and
their recent searches locally on the device.

**activeTab** — When the user presses the Quick Search shortcut or clicks its icon, grants temporary
access to that one tab so the launcher can be shown on top of it. No other tab, and no tab the user
did not invoke Quick Search on, is ever accessed.

**scripting** — Adds the launcher's own search box (an isolated extension frame) to the current tab,
in overlay mode or when Chrome is full screen. The injected code only creates and removes that box;
it never reads or changes the page's content.

**sidePanel** — Lets the user open the launcher in Chrome's side panel, if they pick that option in
Settings.

**host permission: https://suggestqueries.google.com/** — Fetches search autocomplete suggestions
for the text the user types. This is the extension's only network request, and the user can disable
it entirely in Settings.

**Remote code** — No. All code is bundled in the package; nothing is fetched or evaluated at runtime.

---

## Data usage disclosures

- Does the extension collect user data? **No** personally identifiable information, health, financial,
  authentication, personal communications, location, web history or user activity is collected,
  transmitted or sold. The query text is sent to Google Suggest only to retrieve autocomplete
  results and is not stored by the extension beyond the user's own local recent-search list.
- Not sold to third parties. Not used or transferred for purposes unrelated to the single purpose.
  Not used or transferred to determine creditworthiness or for lending.

---

## Screenshots (1280x800)

Upload `screenshots/listing/`: captioned frames around the real UI. Regenerate with
`pnpm shots && pnpm frames` (the plain `screenshots/*.png` are the unframed captures).

1. `screenshots/listing/1-unified-results.png` — "Every tab. Every visit. One keystroke."
2. `screenshots/listing/2-command-palette.png` — "Run the browser from the keyboard."
3. `screenshots/listing/3-filters.png` — "One letter narrows it down."
4. `screenshots/listing/4-settings.png` — "Your engine. Your sources."
5. `screenshots/listing/5-light-theme.png` — "Light or dark, your call."

Promo tiles: `screenshots/promo-small-440x280.jpg`, `screenshots/promo-marquee-1400x560.jpg`.
