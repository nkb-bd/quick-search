# Privacy Policy — Quick Search

Quick Search has no servers, no analytics, and no accounts. Everything it stores stays in your browser.

## What leaves your device

Exactly one thing: when web suggestions are enabled, the text you type in the launcher is sent to
Google Suggest (`https://suggestqueries.google.com`) to fetch autocomplete results. Nothing else is
sent anywhere.

You can turn this off in **Settings → Sources → Web suggestions**. With it off, Quick Search makes no
network requests at all.

## What is read on your device

| Permission | Why |
| --- | --- |
| `tabs` | Match your open tabs so you can jump to one instead of opening a duplicate |
| `history` | Match pages you have already visited |
| `bookmarks` | Match your bookmarks, and save the current tab when you run the bookmark action |
| `windows` | Open the launcher window centered on your focused window |
| `favicon` | Render site icons from Chrome's local favicon cache — no icon requests to any server |
| `storage` | Remember your engine, theme, source toggles, and recent searches |

Each source can be disabled individually in Settings. Reading is on-demand and in-memory: Quick Search
never copies your history or bookmarks anywhere.

## What is stored

In `chrome.storage.local`, on this device only:

- Your settings (default engine, theme, which sources are enabled)
- Your recent searches in the launcher (most recent 30)

Clear the recent searches at any time from **Settings → Data**, or with the
*Clear Quick Search history* action inside the launcher. Uninstalling removes everything.

## Host permissions

Quick Search requests one host: `https://suggestqueries.google.com/*`. It does not request access to
the pages you visit and injects no scripts into any page.

## Contact

lukman.nakib@gmail.com

Last updated: September 16, 2026
