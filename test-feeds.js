/* Tests for fetch-feeds.js — the Node side of the portal.
   Run:  node test-feeds.js                                              */

const { clean, tag, parse, collate, readFeeds } = require('./fetch-feeds.js');

let pass = 0, fail = 0, group = '';
const g = n => { group = n; console.log('\n' + n); };
const show = v => JSON.stringify(v);

function test(name, fn) {
  try { fn(); pass++; console.log('  PASS  ' + name); }
  catch (e) { fail++; console.log('  FAIL  ' + name + '\n          ' + e.message); }
}
function eq(a, b, msg) {
  if (show(a) !== show(b)) throw new Error(`${msg ? msg + ': ' : ''}expected ${show(b)}, got ${show(a)}`);
}
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy, got ' + show(v)); }

/* ── fixtures ─────────────────────────────────────────── */

const RSS = `<?xml version="1.0"?><rss version="2.0"><channel>
  <title>Пример извор</title>
  <item>
    <title><![CDATA[Prva vest &amp; druga]]></title>
    <link>https://example.mk/1</link>
    <pubDate>Fri, 07 Aug 2026 09:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Vtora vest</title>
    <link>https://example.mk/2</link>
    <pubDate>Fri, 07 Aug 2026 08:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Bez link</title>
  </item>
  <item>
    <guid isPermaLink="true">https://example.mk/3</guid>
    <title>Samo guid</title>
  </item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Source</title>
  <entry>
    <title>Atom one</title>
    <link rel="alternate" href="https://atom.example/one"/>
    <link rel="edit" href="https://atom.example/edit/one"/>
    <updated>2026-08-07T07:00:00Z</updated>
  </entry>
  <entry>
    <title>Atom two &lt;tagged&gt;</title>
    <link href="https://atom.example/two"/>
    <published>2026-08-06T07:00:00Z</published>
  </entry>
</feed>`;

/* ── clean() ──────────────────────────────────────────── */
g('clean()');

test('strips HTML tags', () => eq(clean('<b>bold</b> text'), 'bold text'));
test('unwraps CDATA', () => eq(clean('<![CDATA[raw & wild]]>'), 'raw & wild'));
test('decodes named entities', () => eq(clean('a &amp; b &lt;c&gt;'), 'a & b <c>'));
test('decodes numeric entities', () => eq(clean('&#1055;&#1088;&#1086;'), 'Про'));
test('collapses whitespace and trims', () => eq(clean('  a\n\n   b  '), 'a b'));
test('leaves an unknown entity visible rather than mangling it', () => ok(clean('&weird;').includes('&weird;')));
test('handles an empty or missing value', () => { eq(clean(''), ''); eq(clean(undefined), ''); });

/* ── tag() ────────────────────────────────────────────── */
g('tag()');

test('reads a simple element', () => eq(tag('<title>Hi</title>', 'title'), 'Hi'));
test('reads an element that has attributes', () => eq(tag('<title type="text">Hi</title>', 'title'), 'Hi'));
test('returns empty string when the element is absent', () => eq(tag('<a>x</a>', 'title'), ''));

/* ── parse() RSS ──────────────────────────────────────── */
g('parse() — RSS');

test('reads every usable item', () => eq(parse(RSS, '').length, 3, 'the item with no link must be dropped'));
test('decodes the title', () => eq(parse(RSS, '')[0].title, 'Prva vest & druga'));
test('reads the link', () => eq(parse(RSS, '')[0].link, 'https://example.mk/1'));
test('reads the date as ISO', () => ok(parse(RSS, '')[0].date.startsWith('2026-08-07')));
test('falls back to a permalink guid when there is no link', () =>
  ok(parse(RSS, '').some(i => i.link === 'https://example.mk/3')));
test('an item with no date still comes through', () => {
  const i = parse(RSS, '').find(x => x.title === 'Samo guid');
  ok(i); eq(i.date, null);
});
test('takes the channel title as the source', () => eq(parse(RSS, '')[0].source, 'Пример извор'));
test('a supplied label wins over the channel title', () => eq(parse(RSS, 'MOJ')[0].source, 'MOJ'));

/* ── parse() Atom ─────────────────────────────────────── */
g('parse() — Atom');

test('reads Atom entries', () => eq(parse(ATOM, '').length, 2));
test('prefers the alternate link over other rels', () =>
  eq(parse(ATOM, '')[0].link, 'https://atom.example/one'));
test('falls back to the only link when there is no alternate', () =>
  eq(parse(ATOM, '')[1].link, 'https://atom.example/two'));
test('reads <updated> as the date', () => ok(parse(ATOM, '')[0].date.startsWith('2026-08-07')));
test('reads <published> when there is no <updated>', () => ok(parse(ATOM, '')[1].date.startsWith('2026-08-06')));
test('decodes entities in Atom titles', () => eq(parse(ATOM, '')[1].title, 'Atom two <tagged>'));
test('garbage in gives an empty list, not a crash', () => eq(parse('not xml at all', ''), []));
test('an empty feed gives an empty list', () => eq(parse('<rss><channel></channel></rss>', ''), []));

/* ── collate() ────────────────────────────────────────── */
g('collate()');

const mix = [
  { title: 'old',  link: 'a', date: '2026-08-01T00:00:00Z' },
  { title: 'new',  link: 'b', date: '2026-08-07T00:00:00Z' },
  { title: 'mid',  link: 'c', date: '2026-08-04T00:00:00Z' },
  { title: 'dupe', link: 'b', date: '2026-08-06T00:00:00Z' },
  { title: 'none', link: 'd', date: null }
];

test('sorts newest first', () => eq(collate(mix).map(i => i.title), ['new', 'mid', 'old', 'none']));
test('drops a repeated link', () => eq(collate(mix).filter(i => i.link === 'b').length, 1));
test('keeps the newest of two items sharing a link', () => eq(collate(mix)[0].title, 'new'));
test('undated items sink to the bottom', () => eq(collate(mix).at(-1).title, 'none'));
test('respects the cap', () => eq(collate(mix, 2).length, 2));
test('an empty input gives an empty list', () => eq(collate([]), []));
test('does not mutate the input array', () => {
  const before = mix.map(i => i.title);
  collate(mix);
  eq(mix.map(i => i.title), before);
});

/* ── readFeeds() ──────────────────────────────────────── */
g('readFeeds()');

const feeds = readFeeds();

test('reads the shipped feeds.txt', () => ok(feeds.length >= 5));
test('every entry has an http(s) URL', () => feeds.forEach(f => ok(/^https?:\/\//.test(f.url), f.url)));
test('the label before the pipe is kept', () => ok(feeds.some(f => f.label === 'BBC World')));
test('commented lines are ignored', () => ok(!feeds.some(f => f.label && f.label.includes('МИА'))));
test('no entry is a comment or blank', () => feeds.forEach(f => ok(f.url && !f.url.startsWith('#'))));

/* ── result ───────────────────────────────────────────── */

console.log(`\n${pass} passed, ${fail} failed of ${pass + fail}`);
process.exit(fail ? 1 : 0);
