# Releasing

## How publishing works

Pushing a version tag publishes. Nothing else does — commits to `main` never ship.

```
git push origin v1.0.2
  └─ GitHub Actions: .github/workflows/publish.yml
       1. pnpm install --frozen-lockfile
       2. pnpm typecheck + pnpm verify          stop on any failure
       3. pnpm release:zip                       wipe dist/chrome, rebuild, zip
          └─ scripts/verify-release.mjs          tag == package.json version?
                                                 zip == fresh build, nothing extra?
       4. upload the zip as a run artifact       (download it from the run page)
       5. pnpm submit:chrome                     upload + submit for review (API v2)
  └─ Chrome Web Store reviews it (hours to days)
  └─ You click **Publish** in the dashboard      STAGED_PUBLISH: nothing goes live without you
```

Watch it: `gh run watch` or the repo's **Actions** tab. GitHub emails you if a run fails.

## Steps

```bash
# 1. verify locally
pnpm typecheck && pnpm lint && pnpm verify

# 2. bump the version in package.json ONLY (manifest.config.ts derives from it)
# 3. add a section at the top of CHANGELOG.md
# 4. load dist/chrome unpacked after `pnpm build:chrome` and press the shortcut once

# 5. commit, tag, push — the tag push is the release
git commit -am "RELEASE: Version <version>"
git tag -a v<version> -m "Quick Search <version>"
git push origin main v<version>

# 6. when the dashboard shows the item approved: Publish
```

The tag must equal `package.json`'s version (`v1.0.2` ↔ `1.0.2`) or the run stops before uploading.

### Dry run (checks everything, uploads nothing)

```bash
gh workflow run publish.yml -f dry_run=true && gh run watch
```

### Without GitHub

`pnpm publish:chrome` runs the same build, checks and submit locally. It reads credentials from
`.env.submit` (gitignored — copy `.env.submit.example`).

## Credentials

A Google **service account** logs in to the Chrome Web Store API on your behalf — a robot account
with no password, only a private key. It can upload, submit and publish **every item under the
publisher**, and nothing else in your Google account.

| Where | What |
| --- | --- |
| Google Cloud project `cws-publisher-509717` | Service account `cws-publish@cws-publisher-509717.iam.gserviceaccount.com`, Chrome Web Store API enabled, no roles, no billing |
| CWS dashboard → Settings → **Service account** | That email, authorizing it for this publisher (one allowed per publisher) |
| GitHub → Settings → Secrets → Actions | `CHROME_PUBLISHER_ID`, `CHROME_EXTENSION_ID`, `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL`, `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` |
| Your password manager | The JSON key file — nowhere else |

Secrets are encrypted, masked as `***` in (public) run logs, and never given to fork pull requests.

**If the key leaks:** Cloud Console → Service accounts → `cws-publish` → Keys → delete it, create a
new JSON key, then `gh secret set CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` from the new file. Removing
the email from the dashboard's Service account field cuts access immediately.

### Troubleshooting

| Error | Fix |
| --- | --- |
| `tag vX ≠ package.json vY` | Tag the commit that bumped the version, or bump and re-tag |
| `serviceAccountPrivateKey … empty` | The private key secret is missing — `gh secret set` it |
| Upload rejected: version already exists | Versions are never reusable; bump the patch number |
| `400 INVALID_ITEM_METADATA` at "Submitting for review" | The zip uploaded fine; the listing is incomplete (often a missing permission justification on the Privacy tab). Dashboard → item → **Why can't I submit?** → fix → click **Submit for review** there; no re-tag needed |
| `zip has files not in the build` | A stale file leaked in; the clean rebuild should prevent it — check `dist/` |

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

Already granted, so free to build on: `storage`, `tabs`, `history`, `bookmarks`, `favicon`, and the
`suggestqueries.google.com` host. (The windows API needs no permission.)

Anything beyond that — notably `<all_urls>` for an in-page overlay — belongs in
`optional_host_permissions`, requested at runtime from a settings toggle, so existing users are
never disabled.

## Checklist

- [ ] `pnpm verify` green (27 checks)
- [ ] Loaded unpacked and pressed the shortcut
- [ ] CHANGELOG entry written
- [ ] Version bumped in `package.json` only
- [ ] Tag pushed, run green, approved, then Publish clicked
- [ ] Screenshots still match the UI (`screenshots/`, 1280x800)
- [ ] `STORE_LISTING.md` matches what is live, if the listing changed
- [ ] No new permission warnings, or a deliberate decision to accept one
