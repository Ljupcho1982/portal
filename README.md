# Portal — personal start page

An Excite-style portal built for exactly one person. Weather, sun times, exchange
rates, news, mail, bookmarks, an app launcher, tasks and a scratchpad — one dense
page, all of it yours to rearrange.

**Free for every user, permanently.** No sign-up, no paid API keys, no
subscriptions, no ads, no analytics, no tracking, no server. Nothing to pay for
and nothing to cancel.

The one exception to "no accounts" is the optional Mail card: each person signs
into **their own** Gmail, read-only, and sees only their own inbox. It is still
free — nobody but the reader and Google is in the loop. Every other card works
without it, and the card can be removed with its ✕.

---

## Run it

Just open `index.html` in a browser. That's the whole install.

For the news card you need a local web server (browsers block `fetch()` on
`file://`), so either open it through one:

```bash
python -m http.server 4341 --directory .
```

…or ignore the news card and use everything else straight from `file://`.

To make it your browser's home page, set the URL (or the file path) as the
start page and as the new-tab page.

## What's on the page

| Card | Data source | Cost |
|---|---|---|
| Weather + 5-day | `api.open-meteo.com` | free, no key |
| Mail (optional) | `gmail.googleapis.com`, read-only, each reader's own inbox | free, no billing |
| Sun (rise/set/noon/daylight) | same call as weather | free |
| Exchange rates | `api.frankfurter.dev` (ECB) | free, no key |
| News | `feeds.json`, written locally by `fetch-feeds.js` | free |
| Bookmarks / My apps / To do / Notes | your browser's `localStorage` | free |
| Search | links out to DuckDuckGo, Google, Wikipedia, YouTube, OSM, Translate | free |

MKD is derived from the denar's fixed euro peg (61.5), since the ECB does not
publish a MKD rate. It is labelled `peg` in the table.

Weather and rates are cached in `localStorage`, so the page still shows the last
known values with no connection.

## News feeds

1. Edit `feeds.txt` — one RSS/Atom URL per line, optional `Label | URL`.
2. Run it:

```bash
node fetch-feeds.js
```

It writes `feeds.json` next to the page; the news card reads that file. No
dependencies, Node 18+.

To keep it fresh, put it on a schedule — Windows Task Scheduler, e.g. every hour:

```bash
schtasks /create /tn "Portal feeds" /tr "node \"%USERPROFILE%\OneDrive - mtc.gov.mk\Desktop\idea\portal\fetch-feeds.js\"" /sc hourly
```

A feed that dies just prints `fail` and is skipped — it never breaks the page.

## Mail

The Mail card shows unread inbox messages, opens the full text of any of them
in place, and raises a desktop notification when something new arrives. It
talks to the Gmail API straight from the browser — no server, no secret, no
third party in between, and **read-only**: the scope granted is
`gmail.readonly`, so the portal cannot send, delete or change anything.

**It is not tied to any one person.** Whoever presses *Connect Gmail* and
authorises is the mailbox that gets shown — the identity comes from Gmail's own
profile call, and *Sign in as someone else* on the card switches accounts,
clearing everything the previous account loaded.

What Google *does* tie down is the client ID that lets a web page talk to Gmail
at all. There are two free ways to have one.

### Two ways to run it — both free

**A. One shared client ID (any visitor signs in with one click).**
Open `app.js`, find `DEFAULT_GMAIL_ID` near the top, and paste one client ID
there. Everyone who opens the site then just presses **Connect Gmail** and signs
into their *own* mailbox — no setup on their side.

The Google account that owns that client ID **never sees anyone's mail**. It only
registers the app with Google, which OAuth requires. Use a throwaway account if
you like; it does not have to be a mailbox you read.

Google limits an unverified app with a restricted scope to roughly 100 accounts
and shows an "unverified app" warning during sign-in. Lifting either needs a paid
annual security assessment, so this route suits a site with a modest audience.

**B. Bring your own client ID (unlimited, no warning).**
Leave `DEFAULT_GMAIL_ID` empty. Each visitor makes their own free client ID with
the steps below and pastes it into Settings → Mail. No cap, no warning screen,
about ten minutes per person.

### Creating the client ID (either route)

1. Open [console.cloud.google.com](https://console.cloud.google.com) and create
   a project. Free, no billing details.
2. **APIs & Services → Library** → search *Gmail API* → **Enable**.
3. **APIs & Services → OAuth consent screen** → *External* → fill in an app name
   and your email → add the scope `.../auth/gmail.readonly` → add your own
   address under **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   application type **Web application**. Under *Authorised JavaScript origins*
   add exactly:

   ```
   http://localhost:4341            ← running it locally
   https://ljupcho1982.github.io    ← the published site
   ```

   Add both if you use both. The origin is the scheme + host only, no path.

5. Copy the client ID (it ends in `.apps.googleusercontent.com`).
6. In the portal: **⚙ Settings → Mail** → paste it → Save.
7. On the Mail card press **Connect Gmail**, approve in the Google popup, and
   allow notifications when the browser asks.

### Worth knowing

- **It must be served over http(s) from a registered origin.** `file://` cannot
  be an OAuth origin, so opening `index.html` from disk gives you every card
  except mail. Any new host or port needs adding in the console too.
- Google will warn that the app is **unverified**. That is normal for a client
  ID you made for yourself — *Advanced → Continue*. Google also expires consent
  for test-mode apps periodically, so expect to press Connect again now and then.
- **Notifications arrive only while the portal is open in a tab.** That is the
  limit of a page with no server behind it. If you want mail alerts with the
  browser closed, the local-helper approach (a Node script on a schedule) is the
  one that can do it.
- The access token is kept **in memory only** — never written to storage — so
  closing the tab drops it. Only the client ID, which is not a secret, is saved.
- Message bodies are rendered as **plain text, never as HTML**. An email is
  untrusted input; text cannot carry a script or a tracking pixel.
- Checks every 5 minutes by default; adjustable in Settings.
- **Signing out** is on the card in two places: an icon in the header (which
  never scrolls away behind a long list) and *Sign out* in the footer next to
  the signed-in address, plus a Disconnect button in Settings → Mail. It hands
  the token back to Google and erases every trace of the mailbox from the
  browser — senders, subjects, message bodies, and the record of which mail has
  already been notified. *Sign in as someone else* does the same and reopens the
  Google picker, so several people can share one browser without seeing each
  other's mail.

## Adding and removing cards

Every card has a **✕** in its header, and the **+** in the top bar adds new ones.

- **✕ on a built-in card** (Weather, News, Rates…) hides it. Nothing is lost —
  it reappears under *Bring back a hidden card* in the **+** dialog.
- **✕ on a card you made** deletes it, after a confirmation.
- **✎** on your own cards reopens the editor.
- New cards land at the top of the grid; drag them wherever you want.

Five kinds you can add, as many of each as you like:

| | Card | What goes in it |
|---|---|---|
| 📝 | **Note** | free text that just sits there — passwords for the guest wifi, a shopping list |
| 🔗 | **Link list** | your own group of links, `Title \| URL \| icon` per line |
| 🖼️ | **Embedded page** | any URL in an iframe — a map, a dashboard, one of your own apps |
| ⏳ | **Countdown** | days left until a date, with a caption |
| 🕐 | **World clock** | the time in another zone, picked from the browser's own list |

The **My apps** launcher starts empty on a deployed site and pre-filled when you
run it locally: its default tiles are relative paths to the sibling project
folders, which exist on your machine but not on a public host. Add your own with
the pencil — they are saved in your browser.

Embedded pages: some sites refuse to be framed (`X-Frame-Options`) and will come
up blank — that's the site's choice, not a bug. Local files, OpenStreetMap
embeds and your own apps frame fine. A relative path like
`../nevreme/index.html` works when you open the portal from disk.

## Customising

- **⚙ Settings** — theme (dark/light/auto), language (English / македонски),
  density, location, currency base and symbols, which cards show, backup.
- **Drag a card by its title bar** to reorder the grid.
- **✎ on Bookmarks / My apps** — a plain text list, `Title | URL | icon`.
- **Export / Import** — a JSON backup of everything, since there is no cloud.
- `/` focuses the search box. A URL or bare domain in the box opens directly
  instead of searching.

## Tests

229 tests, no framework and no dependencies.

**Browser — 191 tests.** Serve the folder and open `/tests.html`. It loads the
real `index.html` markup and the real `app.js`, stubs only the network, and
drives the actual widgets. A green/red report renders on the page and the
result is left in `window.__results`. Groups: config & storage, search,
weather, sun, exchange rates, news, bookmarks & apps, to do, notes, custom
cards, hide/restore/reorder, language, appearance, escaping & safety, mail.

**Node — 38 tests.** The feed parser and collator:

```bash
node test-feeds.js
```

## Design notes

Dark by default, light on the same variables — one `[data-theme]` switch, no
duplicated rules. All icons are inline 24×24 stroke SVG drawn in `app.js` and
coloured with `currentColor`, so there is no icon font and nothing to download;
emoji appear only where they carry meaning (weather, your own bookmarks).
Type is the OS's own UI face (Segoe UI Variable on Windows 11), which means no
webfont request and no layout shift on load.

Cards pack into balanced columns rather than a rigid grid, so a tall News card
never leaves dead space beside it. Card controls fade in on hover — and stay
visible on touch screens, where there is no hover. The search bar's engine pills
unfold only while the field is focused. `prefers-reduced-motion` turns every
transition off.

## Files

```
index.html       markup + dialogs
styles.css       theming, columns, cards
app.js           config, widgets, settings — no framework, no CDN
feeds.txt        your feed list
fetch-feeds.js   feeds.txt → feeds.json (Node, no dependencies)
feeds.json       generated
tests.html       browser test runner — open it in a served folder
tests.js         191 browser tests
test-feeds.js    38 Node tests for the feed parser
```

## Privacy

Everything you type stays in this browser's `localStorage`. The only outbound
requests are the weather, geocoding and exchange-rate calls listed above, and
they carry nothing but coordinates and currency codes.
