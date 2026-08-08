/* Portal test suite — runs in the browser against the real app.js.
   Open tests.html. Nothing is mocked except the network.                */

(() => {
'use strict';

/* ── tiny framework ───────────────────────────────────── */

const CASES = [];
let GROUP = '';
const g = name => { GROUP = name; };
const test = (name, fn) => CASES.push({ group: GROUP, name, fn });

const show = v => typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v) ?? String(v);
function eq(actual, expected, msg) {
  const a = show(actual), b = show(expected);
  if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}expected ${b}, got ${a}`);
}
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + show(v)); }
function no(v, msg) { if (v) throw new Error(msg || 'expected falsy, got ' + show(v)); }
function has(hay, needle, msg) {
  if (!String(hay).includes(needle))
    throw new Error(`${msg ? msg + ': ' : ''}expected to contain ${show(needle)} in ${show(String(hay).slice(0, 160))}`);
}
function hasnt(hay, needle, msg) {
  if (String(hay).includes(needle))
    throw new Error(`${msg ? msg + ': ' : ''}expected NOT to contain ${show(needle)}`);
}

/* ── helpers ──────────────────────────────────────────── */

const sleep = ms => new Promise(r => setTimeout(r, ms));
/* local calendar day, N days from now — never UTC, or tests break after
   midnight in any timezone east of Greenwich */
const dayOff = n => isoDay(new Date(Date.now() + n * 864e5));
const div = () => document.createElement('div');

const fresh = () => { cfg = structuredClone(DEFAULTS); T = I18N.en; save(); };

const net = fn => { window.__net.handler = fn; window.__net.calls = []; };
const json = data => Promise.resolve({ ok: true, json: async () => data });
const dead = () => Promise.reject(new Error('offline (test)'));

const paint = async id => { const b = div(); await descriptor(id).render(b); return b; };

const WX = {
  current: { temperature_2m: 21.4, apparent_temperature: 20.1, relative_humidity_2m: 55,
             weather_code: 0, wind_speed_10m: 7.2 },
  daily: {
    time: ['2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11'],
    weather_code: [0, 2, 3, 61, 95],
    temperature_2m_max: [30, 29, 28, 25, 24],
    temperature_2m_min: [17, 16, 15, 14, 13],
    sunrise: ['2020-01-01T05:30', 'x', 'x', 'x', 'x'],
    sunset:  ['2020-01-01T19:45', 'x', 'x', 'x', 'x']
  }
};
const FX = { base: 'EUR', date: '2026-08-07', rates: { USD: 1.1535, GBP: 0.8577, CHF: 0.9347 } };
const NEWS = { updated: '2026-08-07T18:00:00Z', items: Array.from({ length: 25 }, (_, i) =>
  ({ title: 'Headline ' + i, link: 'https://n.example/' + i, source: 'Src', date: '2026-08-07T10:00:00Z' })) };

/* ═════════ 1. config & storage ═════════ */
g('Config & storage');

test('defaults are used when storage is empty', () => {
  localStorage.removeItem(KEY);
  const c = load();
  eq(c.lang, 'en'); eq(c.theme, 'dark'); eq(c.base, 'EUR');
});
test('save() writes the config under its key', () => {
  fresh(); cfg.lang = 'mk'; save();
  eq(JSON.parse(localStorage.getItem(KEY)).lang, 'mk');
});
test('load() merges a partial stored config over the defaults', () => {
  localStorage.setItem(KEY, JSON.stringify({ theme: 'light' }));
  const c = load();
  eq(c.theme, 'light'); eq(c.engine, 'ddg', 'untouched key keeps its default');
});
test('load() survives corrupt JSON', () => {
  localStorage.setItem(KEY, '{not json');
  eq(load().lang, 'en');
});
test('load() repairs an order that is not an array', () => {
  localStorage.setItem(KEY, JSON.stringify({ order: 'weather' }));
  ok(Array.isArray(load().order), 'order must always be an array');
});
test('load() repairs a null custom map', () => {
  localStorage.setItem(KEY, JSON.stringify({ custom: null }));
  eq(typeof load().custom, 'object'); ok(load().custom);
});
test('load() repairs a todo list that is not an array', () => {
  localStorage.setItem(KEY, JSON.stringify({ todo: 'nope' }));
  ok(Array.isArray(load().todo));
});
test('load() repairs bookmarks that are not an array', () => {
  localStorage.setItem(KEY, JSON.stringify({ bookmarks: 42 }));
  ok(Array.isArray(load().bookmarks));
});
test('cache stores a value with a timestamp and reads it back', () => {
  cache.set('unit', { a: 1 });
  eq(cache.get('unit').v.a, 1);
  ok(cache.get('unit').at > 0);
});
test('cache returns null for a missing or corrupt entry', () => {
  localStorage.removeItem('portal.cache.gone');
  eq(cache.get('gone'), null);
  localStorage.setItem('portal.cache.bad', 'xx');
  eq(cache.get('bad'), null);
});
test('a config round-trips through export/import JSON unchanged', () => {
  fresh(); cfg.notes = 'hello'; cfg.todo = [{ text: 'a', done: true }];
  const copy = Object.assign(structuredClone(DEFAULTS), JSON.parse(JSON.stringify(cfg)));
  eq(copy.notes, 'hello'); eq(copy.todo[0].done, true);
});

/* ═════════ 2. search ═════════ */
g('Search');

test('there are six search engines, all with unique ids', () => {
  eq(ENGINES.length, 6);
  eq(new Set(ENGINES.map(e => e.id)).size, 6);
});
test('every engine builds a URL carrying the query', () => {
  ENGINES.forEach(e => has(e.url('kokoshka'), 'kokoshka', e.id));
});
test('an empty query goes nowhere', () => {
  fresh(); eq(targetFor('   '), null);
});
test('a full URL is opened as typed', () => {
  fresh();
  const r = targetFor('https://mtc.gov.mk/a?b=1');
  eq(r.kind, 'url'); eq(r.url, 'https://mtc.gov.mk/a?b=1');
});
test('a bare domain gets https:// in front', () => {
  fresh();
  eq(targetFor('github.com').url, 'https://github.com');
  eq(targetFor('time.mk/vesti').url, 'https://time.mk/vesti');
});
test('plain words are a search, not a domain', () => {
  fresh();
  eq(targetFor('kade e zima').kind, 'search');
  eq(targetFor('hello').kind, 'search');
});
test('a decimal number is a search, not a domain', () => {
  fresh();
  eq(targetFor('3.14').kind, 'search', '"3.14" must not navigate to a website');
  eq(targetFor('1.5').kind, 'search');
});
test('a sentence with a dot stays a search', () => {
  fresh();
  eq(targetFor('e.g. what is this').kind, 'search');
});
test('the query is percent-encoded', () => {
  fresh(); cfg.engine = 'ddg';
  has(targetFor('a b&c').url, 'a%20b%26c');
});
test('the chosen engine is the one used', () => {
  fresh(); cfg.engine = 'wiki';
  has(targetFor('Skopje').url, 'wikipedia.org');
  cfg.engine = 'yt';
  has(targetFor('Skopje').url, 'youtube.com');
});
test('an unknown engine id falls back to the first engine', () => {
  fresh(); cfg.engine = 'bogus';
  eq(targetFor('x').engine, ENGINES[0].id);
});
test('Wikipedia and Translate follow the interface language', () => {
  fresh(); cfg.lang = 'mk';
  has(ENGINES.find(e => e.id === 'wiki').url('x'), 'mk.wikipedia.org');
  has(ENGINES.find(e => e.id === 'trans').url('x'), 'tl=mk');
  cfg.lang = 'en';
  has(ENGINES.find(e => e.id === 'wiki').url('x'), 'en.wikipedia.org');
});

/* ═════════ 3. weather ═════════ */
g('Weather');

test('the current temperature is rendered, rounded', async () => {
  fresh(); net(() => json(WX));
  has((await paint('weather')).innerHTML, '21°');
});
test('the location name and description are shown', async () => {
  fresh(); net(() => json(WX));
  const h = (await paint('weather')).innerHTML;
  has(h, 'Skopje'); has(h, 'Clear');
});
test('feels-like, humidity and wind are shown', async () => {
  fresh(); net(() => json(WX));
  const h = (await paint('weather')).textContent;
  has(h, '20°'); has(h, '55%'); has(h, '7 km/h');
});
test('the forecast strip has one column per day', async () => {
  fresh(); net(() => json(WX));
  eq((await paint('weather')).querySelectorAll('.wx-day').length, 5);
});
test('the request carries the configured coordinates', async () => {
  fresh(); cfg.loc = { name: 'Ohrid', lat: 41.117, lon: 20.801 };
  net(() => json(WX));
  await paint('weather');
  has(window.__net.calls[0], 'latitude=41.117');
  has(window.__net.calls[0], 'longitude=20.801');
});
test('a successful response is cached', async () => {
  fresh(); localStorage.removeItem('portal.cache.wx');
  net(() => json(WX));
  await paint('weather');
  eq(cache.get('wx').v.current.weather_code, 0);
});
test('with no network the cached reading is shown, flagged as stale', async () => {
  fresh(); net(() => json(WX)); await paint('weather');
  net(dead);
  const h = (await paint('weather')).textContent;
  has(h, '21°'); has(h, T.offline);
});
test('with no network and no cache it reports failure', async () => {
  fresh(); localStorage.removeItem('portal.cache.wx');
  net(dead);
  has((await paint('weather')).innerHTML, 'err');
});
test('with no location it asks for one instead of calling out', async () => {
  fresh(); cfg.loc = null; net(() => json(WX));
  has((await paint('weather')).textContent, T.noLocation);
  eq(window.__net.calls.length, 0);
});
test('a 200 response with the wrong body counts as a failure', async () => {
  fresh(); localStorage.removeItem('portal.cache.wx');
  net(() => json({ error: true, reason: 'Minutely API request limit exceeded' }));
  const b = await paint('weather');
  has(b.innerHTML, 'err', 'a rate-limit body must not be rendered as weather');
});
test('a wrong body does not overwrite a good cached reading', async () => {
  fresh(); net(() => json(WX)); await paint('weather');
  net(() => json({ error: true }));
  has((await paint('weather')).textContent, '21°', 'falls back to the last good reading');
});
test('an async card that fails shows an error instead of spinning for ever', async () => {
  fresh(); renderGrid();
  net(() => json({ nothing: 'useful' }));
  await paint('weather');
  const card = document.querySelector('#grid .card[data-id="weather"]');
  safeRender(descriptor('weather'), $('.card-body', card));
  await sleep(60);
  hasnt($('.card-body', card).textContent, T.loading, 'must not be left on the loading state');
});
test('weather codes map to a symbol and a description', () => {
  eq(wmo(0)[1], 'Clear'); eq(wmo(95)[1], 'Thunderstorm');
  eq(wmo(4242)[1], '—', 'an unknown code must not crash');
});
test('descriptions follow the interface language', async () => {
  fresh(); cfg.lang = 'mk'; T = I18N.mk; net(() => json(WX));
  has((await paint('weather')).textContent, 'Ведро');
  fresh();
});

/* ═════════ 4. sun ═════════ */
g('Sun');

test('sunrise and sunset are shown as HH:MM', async () => {
  fresh(); sunData = WX;
  const h = (await paint('sun')).textContent;
  has(h, '05:30'); has(h, '19:45');
});
test('daylight length is computed', async () => {
  fresh(); sunData = WX;
  has((await paint('sun')).textContent, '14h 15m');
});
test('solar noon is the midpoint', async () => {
  fresh(); sunData = WX;
  has((await paint('sun')).textContent, '12:37');
});
test('the progress bar is clamped to 100% after sunset', async () => {
  fresh(); sunData = WX;                       // fixture is in 2020
  const w = (await paint('sun')).querySelector('.sun-bar i').style.width;
  eq(parseFloat(w), 100);
});
test('the progress bar is clamped to 0% before sunrise', async () => {
  fresh();
  const future = dayOff(1);
  sunData = { daily: { sunrise: [future + 'T05:30'], sunset: [future + 'T19:45'] } };
  eq(parseFloat((await paint('sun')).querySelector('.sun-bar i').style.width), 0);
});
test('it falls back to the cached weather when nothing is loaded yet', async () => {
  fresh(); sunData = null; cache.set('wx', WX);
  has((await paint('sun')).textContent, '05:30');
});
test('with no data at all it shows the loading state', async () => {
  fresh(); sunData = null; localStorage.removeItem('portal.cache.wx');
  has((await paint('sun')).textContent, T.loading);
});
test('all four rows are labelled', async () => {
  fresh(); sunData = WX;
  const h = (await paint('sun')).textContent;
  [T.sunrise, T.sunset, T.noon, T.daylight].forEach(l => has(h, l));
});
test('the weather card feeds the sun card', async () => {
  fresh(); sunData = null; net(() => json(WX));
  await paint('weather');
  ok(sunData, 'weather must publish its daily block for the sun card');
});
test('labels follow the interface language', async () => {
  fresh(); cfg.lang = 'mk'; T = I18N.mk; sunData = WX;
  has((await paint('sun')).textContent, 'Изгрев');
  fresh();
});

/* ═════════ 5. exchange rates ═════════ */
g('Exchange rates');

test('the request carries base and symbols', async () => {
  fresh(); net(() => json(FX));
  await paint('rates');
  has(window.__net.calls[0], 'base=EUR');
  has(window.__net.calls[0], 'USD');
});
test('the base currency is never requested against itself', async () => {
  fresh(); cfg.base = 'EUR'; cfg.symbols = 'EUR,USD';
  net(() => json(FX)); await paint('rates');
  const syms = new URL(window.__net.calls[0]).searchParams.get('symbols').split(',');
  no(syms.includes('EUR'), 'EUR is the base, asking for it is pointless');
});
test('MKD is never requested from the ECB, which does not publish it', async () => {
  fresh(); net(() => json(FX)); await paint('rates');
  const syms = new URL(window.__net.calls[0]).searchParams.get('symbols').split(',');
  no(syms.includes('MKD'));
});
test('no symbol is requested twice', async () => {
  fresh(); cfg.base = 'USD'; cfg.symbols = 'EUR,MKD,GBP';
  net(() => json({ base: 'USD', date: '2026-08-07', rates: { EUR: 0.867, GBP: 0.744 } }));
  await paint('rates');
  const syms = new URL(window.__net.calls[0]).searchParams.get('symbols').split(',');
  eq(syms.length, new Set(syms).size, 'duplicate symbols in ' + syms);
});
test('MKD comes from the euro peg when the base is EUR', async () => {
  fresh(); net(() => json(FX));
  has((await paint('rates')).textContent, '61.50');
});
test('MKD is derived through the euro when the base is not EUR', async () => {
  fresh(); cfg.base = 'USD'; cfg.symbols = 'MKD';
  net(() => json({ base: 'USD', date: '2026-08-07', rates: { EUR: 0.8670 } }));
  has((await paint('rates')).textContent, (0.8670 * 61.5).toFixed(2));
});
test('the pegged rate is labelled as such', async () => {
  fresh(); net(() => json(FX));
  has((await paint('rates')).innerHTML, 'class="tag"');
});
test('small rates get four decimals, large ones two', async () => {
  fresh(); cfg.symbols = 'GBP,MKD';
  net(() => json(FX));
  const txt = (await paint('rates')).textContent;
  has(txt, '0.8577'); has(txt, '61.50');
});
test('with no network the cached table is shown, flagged as stale', async () => {
  fresh(); net(() => json(FX)); await paint('rates');
  net(dead);
  const h = (await paint('rates')).textContent;
  has(h, '1.1535'); has(h, T.offline);
});
test('with no network and no cache it reports failure', async () => {
  fresh(); localStorage.removeItem('portal.cache.fx'); net(dead);
  has((await paint('rates')).innerHTML, 'err');
});
test('a rate response with no rates block counts as a failure', async () => {
  fresh(); localStorage.removeItem('portal.cache.fx');
  net(() => json({ message: 'service unavailable' }));
  has((await paint('rates')).innerHTML, 'err');
});
test('asking only for the base currency does not call out', async () => {
  fresh(); cfg.base = 'EUR'; cfg.symbols = 'EUR';
  net(() => json(FX));
  await paint('rates');
  eq(window.__net.calls.length, 0, 'nothing to ask for');
});

/* ═════════ 6. news ═════════ */
g('News');

test('headlines are rendered as links', async () => {
  fresh(); net(() => json(NEWS));
  const b = await paint('news');
  ok(b.querySelectorAll('a').length > 0);
  has(b.textContent, 'Headline 0');
});
test('the list is capped at eighteen items', async () => {
  fresh(); net(() => json(NEWS));
  eq((await paint('news')).querySelectorAll('ul.list li').length, 18);
});
test('source and date are shown under each headline', async () => {
  fresh(); net(() => json(NEWS));
  const b = await paint('news');
  has(b.querySelector('.meta').textContent, 'Src');
});
test('links open in a new tab without leaking the opener', async () => {
  fresh(); net(() => json(NEWS));
  const a = (await paint('news')).querySelector('a');
  eq(a.target, '_blank'); has(a.rel, 'noopener');
});
test('the last-updated stamp is shown', async () => {
  fresh(); net(() => json(NEWS));
  has((await paint('news')).textContent, T.updated);
});
test('a missing feeds.json explains how to create it', async () => {
  fresh(); net(dead);
  has((await paint('news')).textContent, 'fetch-feeds.js');
});
test('an empty item list shows the same explanation', async () => {
  fresh(); net(() => json({ updated: 'x', items: [] }));
  has((await paint('news')).textContent, 'fetch-feeds.js');
});
test('a malformed feeds.json does not crash the card', async () => {
  fresh(); net(() => json({ nonsense: true }));
  ok((await paint('news')).textContent.length > 0);
});
test('headline markup is escaped, never executed', async () => {
  fresh();
  net(() => json({ items: [{ title: '<img src=x onerror=alert(1)>', link: 'https://a.b' }] }));
  const b = await paint('news');
  eq(b.querySelectorAll('img').length, 0, 'a headline must not inject an element');
});
test('it fetches the local file, not a remote service', async () => {
  fresh(); net(() => json(NEWS));
  await paint('news');
  eq(window.__net.calls[0], 'feeds.json');
});

/* ═════════ 7. link lists ═════════ */
g('Bookmarks & apps');

const parseList = text => {
  cfg.custom.tmp = { type: 'links', title: 'x', list: text };
  const b = div(); TYPES.links.render(b, cfg.custom.tmp);
  delete cfg.custom.tmp;
  return [...b.querySelectorAll('a')];
};

test('a "Title | URL | icon" line becomes a link', () => {
  fresh();
  const a = parseList('МТК | https://mtc.gov.mk | 🏛️');
  eq(a.length, 1); eq(a[0].getAttribute('href'), 'https://mtc.gov.mk');
  has(a[0].textContent, 'МТК'); has(a[0].textContent, '🏛️');
});
test('the icon is optional', () => {
  fresh(); has(parseList('A | https://a.b')[0].textContent, 'A');
});
test('blank lines and lines without a URL are skipped', () => {
  fresh(); eq(parseList('\n  \nJust a title\nA | https://a.b\n').length, 1);
});
test('surrounding whitespace is trimmed', () => {
  fresh(); eq(parseList('   A    |   https://a.b   ')[0].getAttribute('href'), 'https://a.b');
});
test('a javascript: URL is refused', () => {
  fresh();
  const a = parseList('Evil | javascript:alert(1)');
  no(a.length && /^javascript:/i.test(a[0].getAttribute('href') || ''),
     'javascript: URLs must never become clickable links');
});
test('a relative path to a local app is kept', () => {
  fresh(); eq(parseList('App | ../nevreme/index.html')[0].getAttribute('href'), '../nevreme/index.html');
});
test('titles are escaped', () => {
  fresh();
  const a = parseList('<b>bold</b> | https://a.b');
  eq(a[0].querySelectorAll('b').length, 0);
});
test('the bookmarks card renders every stored bookmark', async () => {
  fresh();
  eq((await paint('bookmarks')).querySelectorAll('a').length, cfg.bookmarks.length);
});
test('the apps card renders one tile per app', async () => {
  fresh();
  eq((await paint('apps')).querySelectorAll('.tile').length, cfg.apps.length);
});
test('an empty list shows a placeholder rather than nothing', async () => {
  fresh(); cfg.bookmarks = [];
  ok((await paint('bookmarks')).textContent.trim().length > 0);
});
test('an empty app launcher explains itself instead of showing a bare dash', async () => {
  fresh(); cfg.apps = [];
  has((await paint('apps')).textContent, T.appsEmpty);
});
test('isLocalHost recognises localhost, 127.0.0.1 and .local, nothing else', () => {
  ok(isLocalHost('localhost')); ok(isLocalHost('127.0.0.1')); ok(isLocalHost('mybox.local'));
  no(isLocalHost('ljupcho1982.github.io'));
  no(isLocalHost('example.com'));
});
test('the shipped app-launcher defaults never point off-site on a public deployment', () => {
  // this file is itself served from localhost during the test run, so the
  // guard is exercised directly rather than through the live default
  no(isLocalHost('ljupcho1982.github.io'), 'sanity: the real deployment host is not local');
  ok(LOCAL_APPS.every(a => a.url.startsWith('../')), 'every local-only tile is a relative sibling path');
});
test('the editor round-trips a list through its text form', () => {
  fresh();
  const text = cfg.bookmarks.map(x => [x.title, x.url, x.icon].filter(Boolean).join(' | ')).join('\n');
  const back = text.split('\n').map(line => {
    const p = line.split('|').map(s => s.trim());
    return p[0] && p[1] ? { title: p[0], url: p[1], icon: p[2] || '' } : null;
  }).filter(Boolean);
  eq(back.length, cfg.bookmarks.length);
  eq(back[0].url, cfg.bookmarks[0].url);
});

/* ═════════ 8. to do ═════════ */
g('To do');

const todoBox = async () => { const b = div(); await WIDGETS.todo.render(b); return b; };

test('a task is added by the button', async () => {
  fresh(); const b = await todoBox();
  b.querySelector('#todoIn').value = 'kupi mleko';
  b.querySelector('#todoAdd').click();
  eq(cfg.todo.length, 1); eq(cfg.todo[0].text, 'kupi mleko');
});
test('Enter adds a task too', async () => {
  fresh(); const b = await todoBox();
  b.querySelector('#todoIn').value = 'plati smetka';
  b.querySelector('#todoIn').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  eq(cfg.todo.length, 1);
});
test('the input is cleared after adding', async () => {
  fresh(); const b = await todoBox();
  b.querySelector('#todoIn').value = 'x'; b.querySelector('#todoAdd').click();
  eq(b.querySelector('#todoIn').value, '');
});
test('whitespace-only tasks are ignored', async () => {
  fresh(); const b = await todoBox();
  b.querySelector('#todoIn').value = '    '; b.querySelector('#todoAdd').click();
  eq(cfg.todo.length, 0);
});
test('a task is trimmed', async () => {
  fresh(); const b = await todoBox();
  b.querySelector('#todoIn').value = '  raboti  '; b.querySelector('#todoAdd').click();
  eq(cfg.todo[0].text, 'raboti');
});
test('ticking a task marks it done and persists', async () => {
  fresh(); cfg.todo = [{ text: 'a', done: false }];
  const b = await todoBox();
  const cb = b.querySelector('.todo-item input');
  cb.checked = true; cb.dispatchEvent(new Event('change'));
  eq(cfg.todo[0].done, true);
  eq(JSON.parse(localStorage.getItem(KEY)).todo[0].done, true);
});
test('a done task is struck through', async () => {
  fresh(); cfg.todo = [{ text: 'a', done: true }];
  ok((await todoBox()).querySelector('.todo-item').classList.contains('done'));
});
test('the × removes the right task', async () => {
  fresh(); cfg.todo = [{ text: 'a' }, { text: 'b' }, { text: 'c' }];
  const b = await todoBox();
  b.querySelectorAll('.todo-item .x')[1].click();
  eq(cfg.todo.map(x => x.text), ['a', 'c']);
});
test('an empty list shows the empty state', async () => {
  fresh(); cfg.todo = [];
  has((await todoBox()).textContent, T.noTodo);
});
test('task text is escaped', async () => {
  fresh(); cfg.todo = [{ text: '<script>x</script' + '>' }];
  eq((await todoBox()).querySelectorAll('script').length, 0);
});
test('order is preserved across a re-render', async () => {
  fresh(); cfg.todo = [{ text: '1' }, { text: '2' }, { text: '3' }];
  const rows = [...(await todoBox()).querySelectorAll('.todo-item span')].map(s => s.textContent);
  eq(rows, ['1', '2', '3']);
});

/* ═════════ 9. notes ═════════ */
g('Notes');

test('the stored note is loaded into the box', async () => {
  fresh(); cfg.notes = 'zdravo';
  eq((await paint('notes')).querySelector('textarea').value, 'zdravo');
});
test('typing saves after the debounce', async () => {
  fresh();
  const b = await paint('notes');
  const ta = b.querySelector('textarea');
  ta.value = 'nova beleshka'; ta.dispatchEvent(new Event('input'));
  await sleep(500);
  eq(cfg.notes, 'nova beleshka');
  eq(JSON.parse(localStorage.getItem(KEY)).notes, 'nova beleshka');
});
test('saving is debounced, not fired on every keystroke', async () => {
  fresh();
  const ta = (await paint('notes')).querySelector('textarea');
  ta.value = 'a'; ta.dispatchEvent(new Event('input'));
  ta.value = 'ab'; ta.dispatchEvent(new Event('input'));
  eq(cfg.notes, '', 'not yet');
  await sleep(500);
  eq(cfg.notes, 'ab', 'only the final value');
});
test('the placeholder is set', async () => {
  fresh();
  eq((await paint('notes')).querySelector('textarea').placeholder, T.notesPh);
});
test('newlines are kept', async () => {
  fresh(); cfg.notes = 'a\nb';
  eq((await paint('notes')).querySelector('textarea').value, 'a\nb');
});
test('markup in a note is never interpreted', async () => {
  fresh(); cfg.notes = '<b>x</b>';
  eq((await paint('notes')).querySelectorAll('b').length, 0);
});
test('an empty note renders an empty box, not "undefined"', async () => {
  fresh(); delete cfg.notes;
  eq((await paint('notes')).querySelector('textarea').value, '');
});
test('the note survives a re-render', async () => {
  fresh(); cfg.notes = 'stay';
  await paint('notes');
  eq((await paint('notes')).querySelector('textarea').value, 'stay');
});
test('a very long note is not truncated', async () => {
  fresh(); cfg.notes = 'x'.repeat(20000);
  eq((await paint('notes')).querySelector('textarea').value.length, 20000);
});
test('the placeholder follows the interface language', async () => {
  fresh(); cfg.lang = 'mk'; T = I18N.mk;
  eq((await paint('notes')).querySelector('textarea').placeholder, I18N.mk.notesPh);
  fresh();
});

/* ═════════ 10. cards you add ═════════ */
g('Custom cards');

test('every card type can be added', () => {
  fresh();
  Object.keys(TYPES).forEach(k => addCard(k));
  eq(Object.keys(cfg.custom).length, Object.keys(TYPES).length);
});
test('cards added in the same millisecond get distinct ids', () => {
  fresh();
  for (let i = 0; i < 5; i++) addCard('note');
  eq(Object.keys(cfg.custom).length, 5, 'ids collided');
  eq(cfg.order.filter(id => id.startsWith('x:')).length, 5);
});
test('a new card goes to the front of the grid', () => {
  fresh(); addCard('note');
  ok(cfg.order[0].startsWith('x:'));
});
test('a note renders its text', () => {
  fresh(); const b = div();
  TYPES.note.render(b, { type: 'note', text: 'line1\nline2' });
  has(b.innerHTML, 'line1'); has(b.innerHTML, '<br>');
});
test('an empty card explains what to do', () => {
  fresh(); const b = div();
  TYPES.note.render(b, { type: 'note' });
  has(b.textContent, T.emptyCard);
});
test('a countdown counts the days to a future date', () => {
  fresh(); const b = div();
  const d = dayOff(10);
  TYPES.countdown.render(b, { type: 'countdown', date: d });
  has(b.querySelector('.cd-num').textContent, '10');
  has(b.textContent, T.daysLeft);
});
test('a countdown says "today" on the day', () => {
  fresh(); const b = div();
  TYPES.countdown.render(b, { type: 'countdown', date: dayOff(0) });
  has(b.textContent, T.today);
});
test('a past countdown counts backwards and is dimmed', () => {
  fresh(); const b = div();
  const d = dayOff(-3);
  TYPES.countdown.render(b, { type: 'countdown', date: d });
  has(b.textContent, T.daysAgo);
  ok(b.querySelector('.cd').classList.contains('past'));
});
test('a world clock shows the time in its zone', () => {
  fresh(); const b = div();
  TYPES.clock.render(b, { type: 'clock', tz: 'Asia/Tokyo' });
  ok(/^\d{2}:\d{2}$/.test(b.querySelector('.wclock').textContent.trim()));
});
test('an unknown time zone is reported, not thrown', () => {
  fresh(); const b = div();
  TYPES.clock.render(b, { type: 'clock', tz: 'Mars/Olympus' });
  has(b.textContent, T.badTz);
});
test('an embed frames its address and offers a way out', () => {
  fresh(); const b = div();
  TYPES.embed.render(b, { type: 'embed', url: 'https://example.org', h: 200 });
  eq(b.querySelector('iframe').getAttribute('src'), 'https://example.org');
  has(b.querySelector('iframe').style.height, '200px');
  has(b.textContent, T.openTab);
});
test('an embed refuses a javascript: address', () => {
  fresh(); const b = div();
  TYPES.embed.render(b, { type: 'embed', url: 'javascript:alert(1)' });
  const src = b.querySelector('iframe')?.getAttribute('src') || '';
  no(/^javascript:/i.test(src), 'a javascript: URL must never be framed');
});
test('an embed with no address says so', () => {
  fresh(); const b = div();
  TYPES.embed.render(b, { type: 'embed' });
  has(b.textContent, T.noUrl);
});
test('a card is edited and saved through its dialog', () => {
  fresh(); addCard('note');
  const id = Object.keys(cfg.custom)[0];
  editCard(id);
  document.querySelector('#fld_title').value = 'Мои лозинки';
  document.querySelector('#fld_text').value = 'tajna';
  document.querySelector('#cardDlg form').requestSubmit(document.querySelector('#cardDlg [value=save]'));
  eq(cfg.custom[id].title, 'Мои лозинки');
  eq(cfg.custom[id].text, 'tajna');
  document.querySelector('#cardDlg').close();
});
test('a blank title falls back to the type name', () => {
  fresh(); addCard('note');
  const id = Object.keys(cfg.custom)[0];
  editCard(id);
  document.querySelector('#fld_title').value = '   ';
  document.querySelector('#cardDlg form').requestSubmit(document.querySelector('#cardDlg [value=save]'));
  eq(cfg.custom[id].title, T.t_note);
  document.querySelector('#cardDlg').close();
});
test('deleting a card removes it from both the map and the order', () => {
  fresh(); addCard('note');
  const id = Object.keys(cfg.custom)[0];
  const c = window.confirm; window.confirm = () => true;
  removeCard(id);
  window.confirm = c;
  eq(cfg.custom[id], undefined);
  no(cfg.order.includes(id));
});
test('cancelling the delete confirmation keeps the card', () => {
  fresh(); addCard('note');
  const id = Object.keys(cfg.custom)[0];
  const c = window.confirm; window.confirm = () => false;
  removeCard(id);
  window.confirm = c;
  ok(cfg.custom[id]);
});
test('a card of an unknown type is skipped instead of breaking the grid', () => {
  fresh();
  cfg.custom['x:zzz'] = { type: 'nosuchtype', title: 'x' };
  cfg.order.unshift('x:zzz');
  eq(descriptor('x:zzz'), null);
  renderGrid();
  ok(document.querySelectorAll('#grid .card').length > 0, 'the rest of the grid still renders');
});

/* ═════════ 11. hide, restore, reorder ═════════ */
g('Hide, restore, reorder');

test('removing a built-in hides it rather than destroying it', () => {
  fresh(); removeCard('rates');
  ok(cfg.off.includes('rates'));
  ok(DEFAULTS.order.includes('rates'), 'still a known card');
});
test('hiding twice does not duplicate the entry', () => {
  fresh(); removeCard('rates'); removeCard('rates');
  eq(cfg.off.filter(x => x === 'rates').length, 1);
});
test('a hidden card is not rendered', () => {
  fresh(); removeCard('news'); renderGrid();
  eq(document.querySelector('#grid .card[data-id="news"]'), null);
});
test('a hidden card is offered for restoring', () => {
  fresh(); removeCard('news'); openAdd();
  has(document.querySelector('#hiddenList').textContent, T.news);
  document.querySelector('#addDlg').close();
});
test('restoring brings it back', () => {
  fresh(); removeCard('news'); openAdd();
  document.querySelector('#hiddenList button').click();
  no(cfg.off.includes('news'));
  ok(document.querySelector('#grid .card[data-id="news"]'));
  document.querySelector('#addDlg').close();
});
test('nothing hidden shows a message, not an empty box', () => {
  fresh(); openAdd();
  has(document.querySelector('#hiddenList').textContent, T.nothingHidden);
  document.querySelector('#addDlg').close();
});
test('moving a card forward drops it before the target', () => {
  fresh(); cfg.order = ['a', 'b', 'c', 'd'];
  moveCard('a', 'c');
  eq(cfg.order, ['b', 'a', 'c', 'd']);
});
test('moving a card backward drops it before the target', () => {
  fresh(); cfg.order = ['a', 'b', 'c', 'd'];
  moveCard('d', 'b');
  eq(cfg.order, ['a', 'd', 'b', 'c']);
});
test('moving onto itself changes nothing', () => {
  fresh(); cfg.order = ['a', 'b', 'c'];
  no(moveCard('b', 'b'));
  eq(cfg.order, ['a', 'b', 'c']);
});
test('moving an unknown card changes nothing', () => {
  fresh(); cfg.order = ['a', 'b'];
  no(moveCard('ghost', 'a'));
  eq(cfg.order, ['a', 'b']);
});
test('a new card type appears even if the saved order predates it', () => {
  fresh(); cfg.order = ['weather'];
  renderGrid();
  ok(cfg.order.includes('news'), 'unknown-to-the-order cards get appended');
});
test('a stale id in the order is dropped on render', () => {
  fresh(); cfg.order = ['ghost', ...DEFAULTS.order];
  renderGrid();
  no(cfg.order.includes('ghost'));
});

/* ═════════ 12. language ═════════ */
g('Language');

test('both languages define exactly the same keys', () => {
  const en = Object.keys(I18N.en).sort(), mk = Object.keys(I18N.mk).sort();
  eq(mk, en, 'a missing key would show an English string, or worse, a raw key');
});
test('no translation is left empty', () => {
  Object.entries(I18N).forEach(([lang, map]) =>
    Object.entries(map).forEach(([k, v]) => ok(String(v).trim(), `${lang}.${k} is empty`)));
});
test('an unknown key falls back to the key itself', () => {
  eq(t('definitely_not_a_key'), 'definitely_not_a_key');
});
test('switching language switches the card titles', () => {
  fresh(); cfg.lang = 'mk'; applyChrome();
  eq(WIDGETS.weather.title(), 'Време');
  cfg.lang = 'en'; applyChrome();
  eq(WIDGETS.weather.title(), 'Weather');
});
test('applyChrome sets the document language', () => {
  fresh(); cfg.lang = 'mk'; applyChrome();
  eq(document.documentElement.lang, 'mk');
  cfg.lang = 'en'; applyChrome();
});
test('every custom type has a name and a description in both languages', () => {
  Object.keys(TYPES).forEach(k => {
    ok(I18N.en['t_' + k], 'en t_' + k); ok(I18N.en['d_' + k], 'en d_' + k);
    ok(I18N.mk['t_' + k], 'mk t_' + k); ok(I18N.mk['d_' + k], 'mk d_' + k);
  });
});
test('every editable field has a label in both languages', () => {
  Object.values(TYPES).forEach(ty => ty.fields.forEach(f => {
    ok(I18N.en['f_' + f.k], 'en f_' + f.k);
    ok(I18N.mk['f_' + f.k], 'mk f_' + f.k);
  }));
});
test('every built-in card has a title in both languages', () => {
  Object.keys(WIDGETS).forEach(id => { ok(I18N.en[id], 'en ' + id); ok(I18N.mk[id], 'mk ' + id); });
});
test('the greeting changes with the hour', () => {
  fresh();
  const at = h => { const d = new Date(); d.setHours(h); return d.getHours(); };
  ok(at(9) === 9);
  tickClock();
  ok(document.querySelector('#greeting').textContent.length > 3);
});
test('the search placeholder is translated', () => {
  fresh(); cfg.lang = 'mk'; applyChrome();
  eq(document.querySelector('#q').placeholder, 'Барај');
  cfg.lang = 'en'; applyChrome();
  eq(document.querySelector('#q').placeholder, 'Search');
});

/* ═════════ 13. appearance ═════════ */
g('Appearance');

test('the dark theme is applied to the document', () => {
  fresh(); cfg.theme = 'dark'; applyChrome();
  eq(document.documentElement.dataset.theme, 'dark');
});
test('the light theme is applied to the document', () => {
  fresh(); cfg.theme = 'light'; applyChrome();
  eq(document.documentElement.dataset.theme, 'light');
});
test('auto resolves to a real theme', () => {
  fresh(); cfg.theme = 'auto'; applyChrome();
  ok(['dark', 'light'].includes(document.documentElement.dataset.theme));
});
test('the theme button shows the theme it switches to', () => {
  fresh(); cfg.theme = 'dark'; applyChrome();
  const dark = document.querySelector('#themeBtn').innerHTML;
  cfg.theme = 'light'; applyChrome();
  ok(dark !== document.querySelector('#themeBtn').innerHTML);
});
test('density is applied to the body', () => {
  fresh(); cfg.density = 'cozy'; applyChrome();
  eq(document.body.dataset.density, 'cozy');
  cfg.density = 'compact'; applyChrome();
});
test('the toolbar buttons all carry an icon', () => {
  fresh(); applyChrome();
  ['#addBtn', '#themeBtn', '#settingsBtn', '#goBtn', '#searchIcon', '#geoBtn']
    .forEach(sel => ok(document.querySelector(sel).querySelector('svg'), sel + ' has no icon'));
});
test('every built-in card has an icon of its own', () => {
  Object.keys(WIDGETS).forEach(id => ok(ICON[id], 'no icon for ' + id));
});
test('every custom card type has an icon', () => {
  Object.keys(TYPES).forEach(k => ok(ICON[k], 'no icon for ' + k));
});
test('no icon is accidentally empty', () => {
  Object.entries(ICON).forEach(([k, v]) => ok(v && v.includes('<'), 'empty icon ' + k));
});
test('a rendered card carries its icon and controls', () => {
  fresh(); renderGrid();
  const card = document.querySelector('#grid .card[data-id="weather"]');
  ok(card.querySelector('.card-icon svg'));
  ok(card.querySelector('.tool.close'));
});
test('the time zone list is filled from the browser', () => {
  fillTimeZones();
  ok(document.querySelector('#tzList').childElementCount > 10);
});

/* ═════════ 14. escaping & safety ═════════ */
g('Escaping & safety');

test('esc() neutralises every dangerous character', () => {
  eq(esc('<&>"\''), '&lt;&amp;&gt;&quot;&#39;');
});
test('esc() leaves ordinary text alone', () => {
  eq(esc('Скопје, 21°C'), 'Скопје, 21°C');
});
test('a bookmark title cannot inject markup', async () => {
  fresh(); cfg.bookmarks = [{ title: '<img src=x onerror=1>', url: 'https://a.b' }];
  eq((await paint('bookmarks')).querySelectorAll('img').length, 0);
});
test('an app title cannot inject markup', async () => {
  fresh(); cfg.apps = [{ title: '<img src=x>', url: 'https://a.b' }];
  eq((await paint('apps')).querySelectorAll('img').length, 0);
});
test('a bookmark URL cannot break out of the attribute', async () => {
  fresh(); cfg.bookmarks = [{ title: 'a', url: 'https://a.b" onmouseover="alert(1)' }];
  const a = (await paint('bookmarks')).querySelector('a');
  no(a.getAttribute('onmouseover'));
});
test('a card title cannot inject markup', () => {
  fresh(); cfg.custom['x:1'] = { type: 'note', title: '<img src=x>', text: 'a' };
  cfg.order.unshift('x:1'); renderGrid();
  eq(document.querySelector('#grid .card[data-id="x:1"] .card-head img'), null);
});
test('a location name cannot inject markup', async () => {
  fresh(); cfg.loc = { name: '<img src=x>', lat: 1, lon: 1 };
  net(() => json(WX));
  eq((await paint('weather')).querySelectorAll('img').length, 0);
});
test('a currency code cannot inject markup', async () => {
  fresh(); cfg.symbols = '<IMG>';
  net(() => json({ base: 'EUR', date: 'x', rates: { '<IMG>': 1 } }));
  eq((await paint('rates')).querySelectorAll('img').length, 0);
});
test('a note cannot inject markup', () => {
  fresh(); const b = div();
  TYPES.note.render(b, { type: 'note', text: '<img src=x>' });
  eq(b.querySelectorAll('img').length, 0);
});
test('a caption on a countdown cannot inject markup', () => {
  fresh(); const b = div();
  TYPES.countdown.render(b, { type: 'countdown', date: '2027-01-01', note: '<img src=x>' });
  eq(b.querySelectorAll('img').length, 0);
});
test('the outbound calls are only the three documented hosts', () => {
  const hosts = new Set(window.__net.calls
    .filter(u => /^https?:/.test(u))
    .map(u => new URL(u).host));
  hosts.forEach(h => ok(
    ['api.open-meteo.com', 'geocoding-api.open-meteo.com', 'api.frankfurter.dev',
     'gmail.googleapis.com', 'accounts.google.com'].includes(h),
    'unexpected host ' + h));
});

/* ═════════ 15. mail ═════════ */
g('Mail');

const b64 = str => btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const asMail = () => { mail.token = 'test-token'; mail.exp = Date.now() + 6e5; mail.err = ''; mail.busy = false; };

test('base64url decodes UTF-8, including Cyrillic', () => {
  eq(b64url(b64('Пример на порака')), 'Пример на порака');
});
test('base64url copes with missing padding', () => {
  eq(b64url(b64('abcde').replace(/=+$/, '')), 'abcde');
});
test('base64url returns empty string for garbage rather than throwing', () => {
  eq(b64url('!!!not base64!!!'), '');
});
test('headers are matched case-insensitively', () => {
  const h = [{ name: 'From', value: 'a@b.mk' }, { name: 'SUBJECT', value: 'Zdravo' }];
  eq(headerOf(h, 'from'), 'a@b.mk');
  eq(headerOf(h, 'subject'), 'Zdravo');
  eq(headerOf(h, 'missing'), '');
});
test('a display name is preferred over the address', () => {
  eq(fromName('"Љупчо Семов" <ljupco@example.mk>'), 'Љупчо Семов');
});
test('a bare address is shown as-is', () => {
  eq(fromName('noreply@example.mk'), 'noreply@example.mk');
  eq(fromName('<only@brackets.mk>'), 'only@brackets.mk');
});
test('the plain-text part wins over the HTML part', () => {
  eq(pickBody({ mimeType: 'multipart/alternative', parts: [
    { mimeType: 'text/html',  body: { data: b64('<b>html</b>') } },
    { mimeType: 'text/plain', body: { data: b64('plain wins') } }
  ] }), 'plain wins');
});
test('an HTML-only message is converted to text', () => {
  eq(pickBody({ mimeType: 'text/html', body: { data: b64('<p>Zdravo <b>svet</b></p>') } }), 'Zdravo svet');
});
test('nested multipart messages are walked to the bottom', () => {
  eq(pickBody({ mimeType: 'multipart/mixed', parts: [
    { mimeType: 'multipart/alternative', parts: [
      { mimeType: 'text/plain', body: { data: b64('deep text') } } ] },
    { mimeType: 'application/pdf', body: { attachmentId: 'x' } }
  ] }), 'deep text');
});
test('an empty payload gives an empty body, not a crash', () => {
  eq(pickBody(null), ''); eq(pickBody({}), '');
});
test('script and style blocks are stripped from HTML mail', () => {
  const out = htmlToText('<style>.a{}</style><script>steal()</scr' + 'ipt><p>safe</p>');
  eq(out, 'safe');
});
test('entities in HTML mail are decoded', () => {
  eq(htmlToText('a &amp; b &lt;c&gt; &nbsp;d &#1052;'), 'a & b <c>  d М');
});
test('runs of blank lines are collapsed', () => {
  eq(htmlToText('<p>a</p><p></p><p></p><p></p><p>b</p>'), 'a\n\nb');
});
test('a message from today shows the time, older ones the date', () => {
  fresh();
  ok(/^\d{2}:\d{2}$/.test(mailWhen(new Date().toString())));
  has(mailWhen('Tue, 04 Mar 2025 08:00:00 GMT'), 'Mar');
  eq(mailWhen('not a date'), '');
});
test('without a client ID the card walks through the setup, and never calls out', async () => {
  fresh(); cfg.gmailId = '';
  net(dead);                                   // resets the call log; any call now fails loudly
  const b = await paint('mail');
  has(b.textContent, T.mailSetupLead);
  has(b.textContent, location.origin, 'the exact origin to register must be shown');
  ok(b.querySelector('a[href*="console.cloud.google.com"]'));
  eq(window.__net.calls.length, 0);
});
test('the card is bound to no particular mailbox', () => {
  // whoever signs in is who gets shown: identity comes from /profile,
  // and nothing in the source hard-codes an address
  const src = [gmailAuth, mailRefresh, mailConnect].map(f => f.toString()).join('');
  hasnt(src, 'ljupco', 'no personal address may be baked in');
  has(mailRefresh.toString(), 'profile', 'identity must come from the Gmail profile call');
});
test('a per-user client ID in Settings wins over the shipped default', () => {
  fresh(); cfg.gmailId = '  my-own.apps.googleusercontent.com  ';
  eq(gmailId(), 'my-own.apps.googleusercontent.com', 'trimmed and preferred');
});
test('with no default and no personal ID, none is resolved', () => {
  fresh(); cfg.gmailId = '';
  eq(gmailId(), DEFAULT_GMAIL_ID);
});
test('a connected empty inbox offers to sign in as someone else', async () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = true; asMail();
  mail.who = 'colleague@example.mk'; mail.list = [];
  const b = await paint('mail');
  ok(b.querySelector('#mailSwap'), 'account switching must be reachable');
  has(b.textContent, 'colleague@example.mk');
});
test('switching accounts shows the new mailbox, not the old one', async () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = true; asMail();
  mail.who = 'first@example.mk';
  mail.list = [{ id: '1', from: 'a', subject: 's', date: '', snippet: '' }];
  mail.bodies.set('1', 'text');
  mailDisconnect();                            // what the swap button does first
  eq(mail.who, ''); eq(mail.list.length, 0); eq(mail.bodies.size, 0,
    'nothing of the previous account may survive the switch');
});
test('a shared built-in client ID lets any visitor connect with no setup', () => {
  fresh(); cfg.gmailId = '';
  // simulates the deployed site shipping one client ID for everybody
  eq(gmailId(), DEFAULT_GMAIL_ID, 'falls back to the built-in ID when the user has set none');
});
test('a visitor’s own client ID overrides the shared one', () => {
  fresh(); cfg.gmailId = 'mine.apps.googleusercontent.com';
  eq(gmailId(), 'mine.apps.googleusercontent.com');
});
test('a client ID is trimmed, so a stray space cannot break sign-in', () => {
  fresh(); cfg.gmailId = '  spaced.apps.googleusercontent.com  ';
  eq(gmailId(), 'spaced.apps.googleusercontent.com');
});
test('the signed-in address comes from Gmail, never from a hardcoded name', async () => {
  fresh(); asMail(); mail.who = '';
  net(url => json(url.includes('/profile')
    ? { emailAddress: 'someone.else@gmail.com' }
    : { messages: [] }));
  await mailRefresh();
  eq(mail.who, 'someone.else@gmail.com', 'whoever signs in is the mailbox shown');
});
test('with a client ID but no session it offers to connect', async () => {
  fresh(); cfg.gmailId = 'x.apps.googleusercontent.com'; cfg.mailConnected = false;
  const b = await paint('mail');
  ok(b.querySelector('#mailGo'));
  has(b.textContent, T.mailReadOnly, 'the read-only promise must be visible before signing in');
});
test('only unread inbox mail is requested, and only read scope is used', async () => {
  fresh(); asMail(); mail.who = 'me@x.mk';
  net(url => json(url.includes('/messages?') ? { messages: [] } : {}));
  await mailRefresh();
  has(window.__net.calls[0], 'is%3Aunread');
  has(window.__net.calls[0], 'in%3Ainbox');
  eq(SCOPE, 'https://www.googleapis.com/auth/gmail.readonly');
});
test('a subject containing markup cannot inject an element', async () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = true; asMail();
  mail.list = [{ id: '1', from: '<img src=x>', subject: '<img src=y>', date: '', snippet: '<img src=z>' }];
  eq((await paint('mail')).querySelectorAll('img').length, 0);
});
test('the first check never fires notifications for mail you already had', () => {
  fresh(); localStorage.removeItem('portal.cache.mailSeen');
  const real = window.Notification; const fired = [];
  window.Notification = function (t2, o) { fired.push(t2); };
  window.Notification.permission = 'granted';
  mail.primed = false;
  notifyNew([{ id: 'a', subject: 'A', from: 'x', snippet: '' },
             { id: 'b', subject: 'B', from: 'x', snippet: '' }]);
  window.Notification = real;
  eq(fired.length, 0, 'opening the portal must not blast a notification per unread mail');
});
test('only mail never seen before raises a notification', () => {
  fresh(); localStorage.removeItem('portal.cache.mailSeen');
  const real = window.Notification; const fired = [];
  window.Notification = function (t2, o) { fired.push(t2); };
  window.Notification.permission = 'granted';
  mail.primed = false;
  notifyNew([{ id: 'a', subject: 'Old', from: 'x', snippet: '' }]);        // primes
  notifyNew([{ id: 'a', subject: 'Old', from: 'x', snippet: '' },
             { id: 'b', subject: 'Nova poraka', from: 'x', snippet: '' }]);
  window.Notification = real;
  eq(fired, ['Nova poraka']);
});
test('notifications stay silent when they are switched off', () => {
  fresh(); cfg.mailNotify = false;
  localStorage.removeItem('portal.cache.mailSeen');
  const real = window.Notification; const fired = [];
  window.Notification = function (t2) { fired.push(t2); };
  window.Notification.permission = 'granted';
  mail.primed = true;
  notifyNew([{ id: 'zz', subject: 'X', from: 'x', snippet: '' }]);
  window.Notification = real;
  eq(fired.length, 0);
});
test('the access token is never written to storage', async () => {
  fresh(); asMail();
  net(() => json({ messages: [] }));
  await mailRefresh();
  const dump = JSON.stringify(localStorage);
  hasnt(dump, 'test-token', 'the token must live in memory only');
});
test('a signed-in card offers refresh and sign-out in its header', () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = true;
  const icons = descriptor('mail').tools.map(t2 => t2.icon);
  eq(icons, ['refresh', 'signout'], 'sign-out must sit in the header, which never scrolls away');
});
test('a signed-out card offers no header tools', () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = false;
  eq(descriptor('mail').tools.length, 0);
});
test('the sign-out tool carries its own tooltip, not the refresh one', () => {
  fresh(); cfg.gmailId = 'x'; cfg.mailConnected = true;
  renderGrid();
  const card = document.querySelector('#grid .card[data-id="mail"]');
  const titles = [...card.querySelectorAll('.card-head .tool')].map(b => b.title);
  has(titles.join('|'), T.mailSignOut);
});
test('signing out wipes every trace of the mailbox from the browser', () => {
  fresh(); asMail(); cfg.mailConnected = true;
  mail.who = 'someone@gmail.com';
  mail.list = [{ id: '1', from: 'a', subject: 'secret subject', snippet: 's', date: '' }];
  mail.bodies.set('1', 'secret body text');
  mail.open = '1';
  cache.set('mailSeen', ['1', '2']);
  mailSignOut();
  eq(mail.token, null); eq(mail.who, ''); eq(mail.list.length, 0);
  eq(mail.bodies.size, 0); eq(mail.open, null);
  eq(cfg.mailConnected, false);
  eq(cache.get('mailSeen'), null, 'the seen-ids record is per-account and must go too');
  hasnt(JSON.stringify(localStorage), 'secret', 'nothing readable left behind');
});
test('after signing out, the next account primes quietly instead of alerting', () => {
  fresh(); asMail(); cfg.mailConnected = true; mail.primed = true;
  mailSignOut();
  no(mail.primed, 'a fresh sign-in must not fire a notification per existing unread mail');
});
test('signing out stops the background polling', () => {
  fresh(); cfg.mailConnected = true; cfg.mailPoll = 1;
  mailSchedule();
  ok(mail.timer, 'polling was running');
  mailSignOut();
  net(dead);
  eq(window.__net.calls.length, 0, 'no further calls are scheduled');
});
test('signing out leaves the card offering to connect again', async () => {
  fresh(); cfg.gmailId = 'x'; asMail(); cfg.mailConnected = true;
  mailSignOut();
  ok((await paint('mail')).querySelector('#mailGo'), 'the way back in stays visible');
});
test('the client ID survives signing out, so getting back in is one press', () => {
  fresh(); cfg.gmailId = 'keepme.apps.googleusercontent.com'; asMail(); cfg.mailConnected = true;
  mailSignOut();
  eq(cfg.gmailId, 'keepme.apps.googleusercontent.com');
  eq(JSON.parse(localStorage.getItem(KEY)).mailConnected, false, 'the signed-out state persists a reload');
});
test('disconnecting clears the session and the cached messages', () => {
  fresh(); asMail(); cfg.mailConnected = true;
  mail.list = [{ id: '1', from: 'a', subject: 'b', snippet: '', date: '' }];
  mail.bodies.set('1', 'text');
  mailDisconnect();
  eq(mail.token, null); eq(mail.list.length, 0); eq(mail.bodies.size, 0);
  eq(cfg.mailConnected, false);
});

/* ── runner ───────────────────────────────────────────── */

(async () => {
  const out = document.getElementById('out');
  let pass = 0, fail = 0, last = null;
  const groups = {};

  for (const c of CASES) {
    if (c.group !== last) { last = c.group; out.append(Object.assign(document.createElement('div'), { className: 'g', textContent: c.group })); }
    groups[c.group] = groups[c.group] || { p: 0, f: 0 };
    const row = document.createElement('div');
    try {
      await c.fn();
      document.querySelectorAll('dialog[open]').forEach(d => d.close());  // a test may leave one up
      pass++; groups[c.group].p++;
      row.className = 'p'; row.textContent = '  PASS  ' + c.name;
    } catch (e) {
      fail++; groups[c.group].f++;
      row.className = 'f';
      row.innerHTML = '  FAIL  ' + c.name + '<span class="why">' + e.message.replace(/</g, '&lt;') + '</span>';
    }
    out.append(row);
  }

  document.getElementById('sum').innerHTML =
    `<b class="${fail ? 'f' : 'p'}">${pass} passed, ${fail} failed</b> of ${CASES.length} — ` +
    Object.entries(groups).map(([k, v]) => `${k} ${v.p}/${v.p + v.f}`).join(' · ');

  window.__results = { pass, fail, total: CASES.length, groups,
    failures: [...document.querySelectorAll('.f')].map(n => n.textContent.trim()) };
})();

})();
