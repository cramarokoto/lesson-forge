#!/usr/bin/env node
// Screenshots every step of one lesson so the stager can see its scenes.
// Usage: node scripts/snapshot.mjs <slug> <chapter> <lesson> [--mobile] [--sheet]
// Writes work/<slug>/captures/<chapter>/<lesson>/sN.png (1280×850, or 390×844).
// --sheet also writes sheet.png: all steps on one image (one image to read instead of N).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [slug, chapter, lesson] = process.argv.slice(2);
if (!lesson) { console.error('usage: snapshot.mjs <slug> <chapter> <lesson> [--mobile]'); process.exit(1); }
const mobile = process.argv.includes('--mobile');
const sheet = process.argv.includes('--sheet');
execFileSync('node', [join(ROOT, 'scripts/build.mjs'), '--slug', slug], { stdio: 'inherit' });
const l = JSON.parse(readFileSync(join(ROOT, 'courses', slug, chapter, `${lesson}.json`), 'utf8'));
const out = join(ROOT, 'work', slug, 'captures', chapter, lesson);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 850 }, reducedMotion: 'reduce' });
for (let i = 0; i < l.steps.length; i++) {
  await page.goto(`file://${join(ROOT, 'dist', slug, 'index.html')}#/${chapter}/${lesson}/${i + 1}`);
  await page.waitForTimeout(150);
  const file = join(out, `${l.steps[i].id}${mobile ? '-mobile' : ''}.png`);
  await page.locator(mobile ? 'body' : '.stage').screenshot({ path: file });
  console.log(file);
}
if (sheet) {
  const { readFileSync: rf } = await import('node:fs');
  const imgs = l.steps.map((st) => `<figure><img src="data:image/png;base64,${rf(join(out, `${st.id}${mobile ? '-mobile' : ''}.png`)).toString('base64')}"><figcaption>${st.id}: ${st.title.replace(/</g, '&lt;')}</figcaption></figure>`).join('');
  const p2 = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await p2.setContent(`<style>body{margin:0;font:14px system-ui;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px;background:#fff}figure{margin:0}img{width:100%;border:1px solid #ccc}figcaption{padding:2px 4px}</style>${imgs}`);
  const file = join(out, 'sheet.png');
  await p2.screenshot({ path: file, fullPage: true });
  console.log(file);
}
await browser.close();
