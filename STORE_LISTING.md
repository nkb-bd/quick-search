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

**Every tab, every page you've visited, every bookmark — one shortcut.**

Press Ctrl+Shift+Space (Cmd+Shift+Space on Mac) anywhere in Chrome. Start typing. Quick Search
matches your open tabs, your browsing history, your bookmarks and web suggestions at the same time,
ranked together, and opens whatever you pick.

**Works on every page — including the ones other launchers can't reach**

Most command palettes inject themselves into the page you're on, which means they simply don't
appear on chrome:// pages, the Chrome Web Store, PDFs, or a blank new tab. Quick Search opens its
own window, centered on your screen, so the shortcut works the same everywhere — including the
settings page you were already looking at.

**It never touches the pages you visit**

Quick Search asks for no access to website content. It injects no scripts and reads nothing from
the pages you browse — there is no "read and change all your data on all websites" in its
permissions, because it does not need it.

The only thing that ever leaves your device is the text you type, sent to Google Suggest for
autocomplete — and that is a single toggle in Settings. Turn web suggestions off and Quick Search
makes no network requests at all. Everything else runs locally: your settings and recent searches
stay in your browser, and nothing is uploaded, synced or tracked.

**Fast, because local results don't wait on the network**

Tabs, history and bookmarks appear as you type, on every keystroke. Web suggestions merge in when
they arrive without moving your selection, so you're never racing a list that shifts under you.
Results are ranked by how recently and how often you actually visited them — not just by how well
the text matched — and a page that's open, bookmarked and in your history collapses into one row
instead of three.

**Narrow it down with a prefix**

• t — open tabs only
• h — history only
• b — bookmarks only
• > — browser commands
• yt, gh, npm, mdn, w, so — search YouTube, GitHub, npm, MDN, Wikipedia or Stack Overflow directly

**Six search engines, one keystroke**

Press Tab to cycle Google, Perplexity, DuckDuckGo, Bing, Brave and You.com. The first row always
shows exactly which engine Enter will use, so you never have to guess.

**Browser commands without leaving the keyboard**

Type > to close, duplicate, pin, reload or bookmark the current tab, open a new incognito window, or
jump to your history, downloads, bookmarks or extensions.

**Light, dark, or follow your system**

One click in the footer cycles system, light and dark — or type > and pick "Switch theme". Quick
Search matches your system automatically until you tell it otherwise.

**Also in the address bar**

Type qs, press Space, then your search — for when you don't want a window at all.

**Keyboard reference**

• ↑ ↓ — move through results
• Enter — open the selected result
• Tab / Shift+Tab — next / previous search engine
• Cmd or Ctrl + 1-9 — jump straight to a result
• Esc — clear the query; on an empty query, close the launcher

Open source. No account, no analytics, no telemetry.

---

## Permission justifications

Each field in the dashboard must justify one permission. These match PRIVACY_POLICY.md.

**tabs** — Matches the user's open tabs against their query so they can switch to an existing tab
instead of opening a duplicate, and activates the tab they select.

**history** — Matches pages the user has already visited against their query, so they can return to
a page without remembering its URL. History is read on demand and never copied or transmitted.

**bookmarks** — Matches the user's bookmarks against their query, and creates a bookmark for the
current tab when the user runs the "Bookmark current tab" command.

**windows** — Opens the launcher window centered on the user's focused window, and focuses the
correct window when the user selects a tab that lives in a different one.

**favicon** — Displays site icons for tab and bookmark results using Chrome's local favicon cache,
so no icon requests are made to any external service.

**storage** — Stores the user's settings (default engine, theme, which sources are enabled) and
their recent searches locally on the device.

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

1. `screenshots/1-unified-results.png` — one query, results from tabs, history, bookmarks and the web
2. `screenshots/2-command-palette.png` — the `>` command palette
3. `screenshots/3-filters.png` — prefix filters on the empty state
4. `screenshots/4-settings.png` — settings: engine, theme, per-source toggles
5. `screenshots/5-light-theme.png` — the same launcher in light theme
