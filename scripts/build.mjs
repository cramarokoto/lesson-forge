#!/usr/bin/env node
// Builds one self-contained page per course: dist/<slug>/index.html.
// Formulas are rendered to MathML at build time (KaTeX), so the page needs no
// CDN, no font files and no runtime math library.
//
// Usage: node scripts/build.mjs [--root <dir>] [--out <dir>] [--slug <slug>]
//   --root  directory holding inputs/ and courses/ (default: repo root)
//   --out   output directory (default: <repo>/dist)
// Lessons whose steps are not all staged (no scene yet) are listed as "coming soon".

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import katex from 'katex';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, def) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : def; };
const ROOT = resolve(arg('--root', REPO));
const OUT = resolve(arg('--out', join(REPO, 'dist')));
const ONLY = arg('--slug');

const engine = (f) => readFileSync(join(REPO, 'engine', f), 'utf8');
const palette = JSON.parse(engine('palette.json')).roles;
const i18n = JSON.parse(engine('i18n.json'));

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const errors = [];
function tex(src, where) {
  try { return katex.renderToString(src, { output: 'mathml', throwOnError: true, strict: 'error' }); }
  catch (e) { errors.push(`${where}: KaTeX: ${e.message}`); return esc(src); }
}
// Plain text with inline $...$ math -> HTML.
const rich = (text, where) => String(text ?? '').split(/(\$[^$]+\$)/g)
  .map((part) => (/^\$[^$]+\$$/.test(part) ? tex(part.slice(1, -1), where) : esc(part))).join('');

function loadInputs() {
  const dir = join(ROOT, 'inputs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => YAML.parse(readFileSync(join(dir, f), 'utf8')));
}
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));

function buildCourse(input) {
  const lang = input.language.split('-')[0];
  const ui = i18n[lang] ?? i18n.en;
  const chapters = [];
  let index = 0;
  for (const ch of input.chapters) {
    const dir = join(ROOT, 'courses', input.slug, ch.id);
    const planFile = join(dir, 'plan.json');
    if (!existsSync(planFile)) continue;
    const plan = readJson(planFile);
    const lessons = plan.lessons.map((pl) => {
      index++;
      const file = join(dir, `${pl.id}.json`);
      const base = { id: pl.id, index, title: pl.title, available: false, search: pl.title.toLowerCase(), steps: [] };
      if (!existsSync(file)) return base;
      const l = readJson(file);
      if (!l.steps.every((st) => (st.scene || []).length)) return base; // not staged yet
      const w = (p) => `${input.slug}/${ch.id}/${l.id}/${p}`;
      return {
        id: l.id, index, title: l.title, goal: l.goal, available: true,
        search: [l.title, l.goal, ...l.steps.map((st) => `${st.title} ${st.text}`)].join(' ').toLowerCase(),
        notationHtml: l.notation.map((n, i) => tex(n, w(`notation/${i}`))),
        steps: l.steps.map((st) => ({
          id: st.id, tag: st.tag,
          titleHtml: rich(st.title, w(`${st.id}/title`)),
          textHtml: rich(st.text, w(`${st.id}/text`)),
          callout: st.callout ? { kind: st.callout.kind, html: rich(st.callout.text, w(`${st.id}/callout`)) } : null,
          notationLine: st.notationLine ?? null,
          counters: (st.counters || []).map((c) => ({ key: c.key, labelHtml: rich(c.label, w(`${st.id}/counters`)), value: c.value, unit: c.unit || '', changed: !!c.changed })),
          sceneDescription: st.sceneDescription,
          scene: st.scene,
          sourceIds: st.sourceIds || [],
        })),
        quiz: l.quiz.map((q) => ({
          id: q.id, answer: q.answer,
          questionHtml: rich(q.question, w(`quiz/${q.id}`)),
          optionsHtml: q.options.map((o, i) => rich(o, w(`quiz/${q.id}/${i}`))),
          explanationHtml: rich(q.explanation, w(`quiz/${q.id}/explanation`)),
        })),
        sources: l.sources.map(({ id, title, url, accessed }) => ({ id, title, url, accessed })),
      };
    });
    chapters.push({ id: ch.id, title: ch.title, lessons });
  }
  if (!chapters.length) return null;

  const data = {
    course: { slug: input.slug, title: input.subject, subtitle: input.chapters.length === 1 ? input.chapters[0].title : '', language: input.language },
    ui, palette, chapters,
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="${esc(input.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(input.subject)}</title>
<style>${engine('style.css')}</style>
</head>
<body>
<script type="application/json" id="course-data">${json}</script>
<script>${engine('app.js')}</script>
</body>
</html>
`;
}

let built = 0;
for (const input of loadInputs()) {
  if (ONLY && input.slug !== ONLY) continue;
  const html = buildCourse(input);
  if (!html) continue;
  const out = join(OUT, input.slug, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  built++;
  console.log(`build: ${out} (${(html.length / 1024).toFixed(0)} KB)`);
}
if (errors.length) {
  console.error(`build: ${errors.length} formula error(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
if (!built) console.log('build: no course with a plan yet, nothing to build');
