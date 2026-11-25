#!/usr/bin/env node
// Merges `sourcesChecked` from every review report into work/<slug>/verified-sources.json,
// a cache of pages a fact-checker confirmed. Later reviews may reuse an entry
// confirmed 30 days ago or less instead of fetching the page again.
// Usage: node scripts/sources-cache.mjs <slug>
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: sources-cache.mjs <slug>'); process.exit(1); }
const file = join(ROOT, 'work', slug, 'verified-sources.json');
const cache = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
const key = (e) => `${e.url}\u0000${e.supports}`;
const byKey = new Map(cache.map((e) => [key(e), e]));
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : f.endsWith('.json') ? [p] : [];
});
const reviews = join(ROOT, 'work', slug, 'reviews');
let added = 0;
for (const f of existsSync(reviews) ? walk(reviews) : []) {
  const r = JSON.parse(readFileSync(f, 'utf8'));
  for (const e of r.sourcesChecked || []) {
    const old = byKey.get(key(e));
    if (!old || old.accessed < e.accessed) { byKey.set(key(e), { ...e, by: r.reviewer }); added++; }
  }
}
const list = [...byKey.values()].sort((a, b) => a.url.localeCompare(b.url));
writeFileSync(file, `${JSON.stringify(list, null, 2)}\n`);
console.log(`sources cache: ${list.length} entries (${added} new or refreshed) -> ${file}`);
