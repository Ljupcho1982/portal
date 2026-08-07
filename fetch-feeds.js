#!/usr/bin/env node
/* fetch-feeds.js — reads feeds.txt, writes feeds.json for the news card.
 *
 *   node fetch-feeds.js
 *
 * Why a script instead of fetching in the page: browsers block cross-origin
 * fetches of news sites (CORS). Node has no such restriction. This keeps the
 * page 100% static — and the last fetch stays readable with no network.
 *
 * No dependencies. No API keys. Node 18+ (uses built-in fetch).
 */

const fs = require('node:fs');
const path = require('node:path');

const HERE     = __dirname;
const FEEDFILE = path.join(HERE, 'feeds.txt');
const OUTFILE  = path.join(HERE, 'feeds.json');
const PER_FEED = 6;      // most recent N items kept per feed
const TOTAL    = 40;     // hard cap on the output
const TIMEOUT  = 12000;

/* ── read feeds.txt ─────────────────────────────────── */

function readFeeds() {
  if (!fs.existsSync(FEEDFILE)) {
    console.error(`feeds.txt not found next to ${path.basename(__filename)}`);
    process.exit(1);
  }
  return fs.readFileSync(FEEDFILE, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.lastIndexOf('|');
      if (i > 0 && /^https?:/i.test(l.slice(i + 1).trim()))
        return { label: l.slice(0, i).trim(), url: l.slice(i + 1).trim() };
      return { label: '', url: l };
    })
    .filter(f => /^https?:/i.test(f.url));
}

/* ── tiny RSS / Atom parser ─────────────────────────── */

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", nbsp: ' ' };

function clean(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&(\w+);/g, (m, n) => ENT[n] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
};

function parse(xml, sourceLabel) {
  const isAtom = /<feed[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml);
  const source = sourceLabel || clean(tag(xml, 'title')) || '';
  const blocks = xml.match(isAtom ? /<entry[\s\S]*?<\/entry>/gi : /<item[\s\S]*?<\/item>/gi) || [];

  return blocks.map(b => {
    let link = '';
    if (isAtom) {
      const m = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
             || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = m ? m[1] : '';
    } else {
      link = clean(tag(b, 'link')) || (b.match(/<guid[^>]*>([^<]*https?:[^<]*)<\/guid>/i)?.[1] || '').trim();
    }
    const dateRaw = clean(tag(b, 'pubDate')) || clean(tag(b, 'updated')) ||
                    clean(tag(b, 'published')) || clean(tag(b, 'dc:date'));
    const d = dateRaw ? new Date(dateRaw) : null;
    return {
      title: clean(tag(b, 'title')),
      link,
      source,
      date: d && !isNaN(d) ? d.toISOString() : null
    };
  }).filter(i => i.title && i.link);
}

/* ── fetch one feed ─────────────────────────────────── */

async function grab(feed) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), TIMEOUT);
  try {
    const r = await fetch(feed.url, {
      signal: c.signal,
      headers: { 'user-agent': 'Portal/1.0 (personal start page; feed reader)' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const items = parse(await r.text(), feed.label).slice(0, PER_FEED);
    console.log(`  ok    ${String(items.length).padStart(2)} · ${feed.label || feed.url}`);
    return items;
  } catch (e) {
    console.log(`  fail   - · ${feed.label || feed.url}  (${e.message})`);
    return [];
  } finally { clearTimeout(id); }
}

/* newest first, dated items ahead of undated ones, no duplicate links */
function collate(all, cap = TOTAL) {
  const sorted = [...all].sort((a, b) =>
    (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0));
  const seen = new Set();
  return sorted.filter(i => !seen.has(i.link) && seen.add(i.link)).slice(0, cap);
}

/* ── main ───────────────────────────────────────────── */

async function main() {
  const feeds = readFeeds();
  if (!feeds.length) { console.error('No feeds in feeds.txt'); process.exit(1); }

  console.log(`Fetching ${feeds.length} feed(s)…`);
  const all = (await Promise.all(feeds.map(grab))).flat();

  if (!all.length) {
    console.error('Nothing fetched — feeds.json left untouched.');
    process.exit(fs.existsSync(OUTFILE) ? 0 : 1);
  }

  const items = collate(all);

  fs.writeFileSync(OUTFILE, JSON.stringify({ updated: new Date().toISOString(), items }, null, 1));
  console.log(`\nWrote ${items.length} items → ${path.relative(process.cwd(), OUTFILE)}`);
}

if (require.main === module) main();
else module.exports = { clean, tag, parse, collate, readFeeds };
