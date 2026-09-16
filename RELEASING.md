# Releasing

## Steps

```bash
# 1. verify
pnpm typecheck && pnpm lint && pnpm verify

# 2. bump the version in package.json ONLY
#    manifest.config.ts derives the manifest version from it,
#    build-and-test.sh reads it for the zip name.
#    Editing it anywhere else creates a mismatch.

# 3. add a section at the top of CHANGELOG.md

# 4. build
pnpm build          # -> dist/chrome-<version>.zip, dist/firefox-<version>.zip

# 5. load dist/chrome unpacked and press the shortcut once
#    chrome://extensions -> Developer mode -> Load unpacked

# 6. commit and tag
git commit -am "RELEASE: Version <version>"
git tag -a v<version> -m "Quick Search <version>"
```

Upload at https://chrome.google.com/webstore/devconsole → the item → **Package → Upload new
package** → update listing fields from `STORE_LISTING.md` if they changed → **Submit for review**.

## Version rules

- The store version must strictly increase, and a number can **never** be reused — not even after
  a rejection. A rejected 1.1.0 ships its fix as 1.1.1.
- There is no rollback. Undoing a bad release means publishing a higher version with the old code.
- Prereleases transform: `1.1.0-beta.2` becomes manifest version `1.1.0.2`, while `version_name`
  keeps the full string. The manifest number is what the store orders by.

| Bump | For |
| --- | --- |
| Patch — 1.0.1 | Bug fixes, ranking tweaks, copy |
| Minor — 1.1.0 | A new source, engine, bang or command |
| Major — 2.0.0 | New permissions, or changing what the shortcut does |

## The permission trap

Adding a permission that creates a new user-facing warning **disables the extension for every
existing user** until each one re-approves it in `chrome://extensions`. Most never do, and the loss
is silent.

Already granted, so free to build on: `storage`, `tabs`, `windows`, `history`, `bookmarks`,
`favicon`, and the `suggestqueries.google.com` host.

Anything beyond that — notably `<all_urls>` for an in-page overlay — belongs in
`optional_host_permissions`, requested at runtime from a settings toggle, so existing users are
never disabled.

## Checklist

- [ ] `pnpm verify` green (27 checks)
- [ ] Loaded unpacked and pressed the shortcut
- [ ] CHANGELOG entry written
- [ ] Version bumped in `package.json` only
- [ ] Screenshots still match the UI (`screenshots/`, 1280x800)
- [ ] `STORE_LISTING.md` matches what is live, if the listing changed
- [ ] No new permission warnings, or a deliberate decision to accept one
