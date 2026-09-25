# Changelog

## 1.0.1 — 2026-09-25

### Fixed

- Dropped the `windows` entry from `permissions`: it is not a Chrome permission (the windows API
  needs none), so Chrome reported it as unknown.

## 1.0.0 — 2026-09-16

First release as a launcher. The extension was a toolbar popup that searched open tabs and Google
suggestions; it is now a centered launcher window over tabs, history, bookmarks, commands and the web.

### Added

- **Centered launcher window.** Opens in the upper third of the focused window instead of anchored to
  the toolbar icon, works on `chrome://` pages and the Web Store, reuses an already-open window,
  and closes when it loses focus.
- **History, bookmarks and browser commands** as result sources, alongside tabs and web suggestions.
- **Commands** — new tab/window/incognito, duplicate, pin, reload, close or bookmark the current tab,
  open history/bookmarks/downloads/extensions/shortcuts/settings, clear Quick Search history.
- **Filters and site shortcuts** — `t`, `h`, `b`, `>` for sources; `g`, `p`, `d`, `bi`, `br`, `y` for
  engines; `yt`, `gh`, `npm`, `mdn`, `w`, `so` for site searches.
- **Frecency ranking** — recency and visit count weight every match; results that appear in more than
  one source collapse into a single row, keeping the most actionable kind.
- **Explicit first row** — `Search <engine> for …` is always row 0 and pre-selected, so Enter is never
  ambiguous.
- **Omnibox keyword `qs`** — search from the address bar without opening the launcher.
- **Welcome page** on install showing the shortcut Chrome actually assigned, with a fix link when it
  assigned none.
- **Settings page** — default engine, theme, per-source toggles, site-shortcut reference, clear data.
- **Theme toggle in the launcher footer** cycling system → light → dark, mirrored by a
  "Switch theme" command in the palette, so it no longer takes a trip to Settings.
- **Matched-character highlighting** and `combobox`/`listbox` roles on results.
- <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>1</kbd>–<kbd>9</kbd> to jump to a result, <kbd>Shift</kbd>+<kbd>Tab</kbd>
  to cycle engines backwards.

### Changed

- **Instant local results.** Tabs, history and bookmarks now render on every keystroke instead of
  after a 500 ms debounce; only the remote suggest call is debounced (120 ms) and it merges in without
  moving the selection. Local results are no longer blocked behind the network request.
- **Stable layout.** Fixed launcher frame with the input pinned top, results as the only scrolling
  region, and a footer that is always present — the engine row no longer disappears mid-type.
- **Favicons come from Chrome's local cache** (`favicon` permission) instead of
  `google.com/s2/favicons`, which sent every result's domain to Google.
- **Popup shell removed** — the launcher no longer loads Vue Router, Pinia, vue-i18n or a UI kit.
- Recent searches consolidated into one store; searches are recorded once instead of twice.
- Shortcut renamed from `_execute_action` to `open-launcher`, so it no longer routes through the
  overflow menu when the extension is unpinned.

### Fixed

- Selecting a tab in another window now focuses that window instead of silently activating a tab you
  cannot see.
- The `Press Tab to change search engine` hint no longer overlaps the first result row.
- The engine indicator no longer renders outside its container, where any `overflow:hidden` ancestor clipped it.
- The engine-button footer now actually pins to the bottom (`margin-top:auto` had no effect without a
  sized ancestor).
- The debug panel showing recent-search counts and sync status no longer ships to users.
- The welcome/empty state is reachable again — it sat behind a `v-else-if` that could never match.

### Removed

- `<all_urls>` host permission and the content script, which only logged to the console.
- DevTools panel, i18n scaffolding and the unused template stores/composables carried over from the
  starter template.
- Two dead duplicate implementations of the search logic (`stores/search.ts`,
  `composables/useSearch.ts`) and the conflicting second engine list.
