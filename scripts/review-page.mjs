#!/usr/bin/env node
// Builds work/<slug>/review/index.html: one page for the owner to review a run
// (escalations, unverified items, plan, findings per round) next to the built
// course (copied as course.html). Usage: node scripts/review-page.mjs <slug>
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) { console.error('usage: review-page.mjs <slug>'); process.exit(1); }
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = (f) => JSON.parse(readFileSync(f, 'utf8'));
const out = join(ROOT, 'work', slug, 'review');
mkdirSync(out, { recursive: true });

const reviewsRoot = join(ROOT, 'work', slug, 'reviews');
const chapters = existsSync(join(ROOT, 'courses', slug)) ? readdirSync(join(ROOT, 'courses', slug)) : [];
let body = '';
const tally = []; // {target, round, reviewer, error, amb}

for (const ch of chapters) {
  const planFile = join(ROOT, 'courses', slug, ch, 'plan.json');
  if (!existsSync(planFile)) continue;
  const plan = J(planFile);
  const targets = existsSync(join(reviewsRoot, ch)) ? readdirSync(join(reviewsRoot, ch)) : [];
  const reviewsOf = (t) => {
    const dir = join(reviewsRoot, ch, t);
    return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => J(join(dir, f))).sort((a, b) => a.round - b.round || a.reviewer.localeCompare(b.reviewer)) : [];
  };
  for (const t of targets) for (const r of reviewsOf(t)) {
    tally.push({ target: t, round: r.round, reviewer: r.reviewer, error: r.findings.filter((f) => f.severity === 'ERROR').length, amb: r.findings.filter((f) => f.severity === 'AMBIGUOUS').length });
  }

  body += `<section class="band"><h2>Plan — ${esc(plan.title)}</h2>
<p class="lede">${plan.lessons.length} lessons. Referential: ${esc(plan.referential.citation)} (<a href="${esc(plan.referential.url)}">annex PDF</a>, fetched ${esc(plan.referential.accessed)}).</p>
<ol class="lessons">${plan.lessons.map((l) => {
    const written = existsSync(join(ROOT, 'courses', slug, ch, `${l.id}.json`));
    return `<li><b>${esc(l.title)}</b>${written ? ' <span class="pill ok">written</span>' : ''}<br><span class="muted">${esc(l.goal)}</span></li>`;
  }).join('')}</ol>
<details><summary>Out of scope (${plan.outOfScope.length})</summary><ul>${plan.outOfScope.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>
<h3>Unverified in the plan (${plan.unverified.length})</h3><ul class="unv">${plan.unverified.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`;

  for (const t of targets) {
    const rs = reviewsOf(t);
    const last = Math.max(...rs.map((r) => r.round));
    const open = rs.filter((r) => r.round === last).flatMap((r) => r.findings.map((f) => ({ ...f, reviewer: r.reviewer })));
    const unv = [...new Set(rs.filter((r) => r.round === last).flatMap((r) => r.unverifiable))];
    body += `<section class="band"><h2>${t === 'plan' ? 'Plan reviews' : `Lesson “${esc(t)}”`}</h2>
<p class="lede">${rs.length} review(s) over ${last} round(s). Findings of the latest round: ${open.length ? `<b>${open.filter((f) => f.severity === 'ERROR').length} ERROR</b>, ${open.filter((f) => f.severity === 'AMBIGUOUS').length} AMBIGUOUS` : 'none'}.</p>
${[...new Set(rs.map((r) => r.round))].map((round) => `<details${round === last ? ' open' : ''}><summary>Round ${round}</summary>${rs.filter((r) => r.round === round).map((r) => `
<h4>${esc(r.reviewer)} <span class="muted">— ${r.findings.length} finding(s)</span></h4>
${r.findings.map((f) => `<article class="f ${f.severity === 'ERROR' ? 'err' : 'amb'}"><header><span class="sev">${f.severity}</span> <code>${esc(f.id)}</code> · ${esc(f.category)} · <code>${esc(f.location)}</code></header>
<p class="q">« ${esc(f.quote)} »</p><p>${esc(f.problem)}</p><p class="muted"><b>Evidence.</b> ${esc(f.evidence)}</p><p><b>Fix.</b> ${esc(f.fix)}</p></article>`).join('')}`).join('')}</details>`).join('')}
${unv.length ? `<h3>Unverifiable (latest round)</h3><ul class="unv">${unv.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</section>`;
  }
}

const report = existsSync(join(ROOT, 'work', slug, 'report.md')) ? readFileSync(join(ROOT, 'work', slug, 'report.md'), 'utf8') : '';
const status = report.match(/<!-- status -->([\s\S]*?)<!-- \/status -->/)?.[1]?.trim() || '';
const course = join(ROOT, 'dist', slug, 'index.html');
const hasCourse = existsSync(course);
if (hasCourse) copyFileSync(course, join(out, 'course.html'));
const maxBar = Math.max(1, ...tally.map((x) => x.error + x.amb));

writeFileSync(join(out, 'index.html'), `<title>Atome pilot review</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,600&display=swap" rel="stylesheet">
<style>
/* VOICE work: a review dossier for one owner
   IDEA a scientific plate: specimen (the lesson) beside its annotated examination
   PICTURE tally of findings per reviewer and round, drawn as ruled bars
   COLOUR white ground, ink, carmine for ERROR, prussian for AMBIGUOUS
   TYPE Literata display + Literata text
   LAYOUT title and verdict, then the tally beside the open-course card; sections stack below */
:root{color-scheme:light dark;--bg:light-dark(#ffffff,#0f1217);--ink:light-dark(#10131a,#e8ebf0);--muted:light-dark(#555d6b,#9aa3b1);--rule:light-dark(#dfe2e7,#2a303a);--err:light-dark(#c1121f,#ff6b74);--amb:light-dark(#0b4f8a,#6fb0ee);--ok:light-dark(#1f7a4c,#5fd19a);--panel:light-dark(#f6f7f9,#161a21)}
:root[data-theme=light]{color-scheme:light}:root[data-theme=dark]{color-scheme:dark}
*{box-sizing:border-box;min-width:0}
body{background:var(--bg);color:var(--ink);font:16px/1.55 Literata,Georgia,serif;overflow-x:clip;margin:0}
.band{padding-block:clamp(24px,3vw,44px);padding-left:max(5vw,16px,env(safe-area-inset-left,0px));padding-right:max(5vw,16px,env(safe-area-inset-right,0px));max-width:1240px;margin:0 auto;border-bottom:1px solid var(--rule)}
h1{font-size:clamp(32px,5vw,48px);line-height:1.05;letter-spacing:-.02em;margin:0 0 12px;font-weight:600}
h2{font-size:26px;line-height:1.15;margin:0 0 8px;font-weight:600}
h3{font-size:18px;margin:22px 0 6px}
h4{font-size:16px;margin:18px 0 6px}
a{color:var(--amb)}
.lede{max-width:70ch;margin:0 0 14px}
.muted{color:var(--muted)}
.top{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:32px;align-items:start}
.status{max-width:70ch;white-space:pre-line}
.card{background:var(--panel);border:1px solid var(--rule);border-radius:10px;padding:18px}
.btn{display:inline-block;background:var(--ink);color:var(--bg);padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600}
.tally{display:grid;grid-template-columns:max-content max-content minmax(0,1fr) max-content;gap:6px 12px;align-items:center;font-size:14px}
.bar{display:flex;height:12px;border-radius:2px;overflow:hidden;background:var(--rule)}
.bar i{display:block;height:100%}.bar .e{background:var(--err)}.bar .a{background:var(--amb)}
.key{font-size:13px;color:var(--muted);margin-top:8px}.key b{display:inline-block;width:10px;height:10px;margin:0 4px 0 10px;vertical-align:middle}
.lessons{padding-left:22px}.lessons li{margin-bottom:6px}
.pill{font-size:12px;padding:1px 8px;border-radius:999px;border:1px solid currentColor}.pill.ok{color:var(--ok)}
.unv li{margin-bottom:4px}
details{margin:10px 0}summary{cursor:pointer;font-weight:600}
.f{border-left:3px solid var(--amb);padding:4px 0 4px 14px;margin:12px 0}.f.err{border-left-color:var(--err)}
.f header{font-size:14px;color:var(--muted)}.f .sev{font-weight:700;color:var(--amb)}.f.err .sev{color:var(--err)}
.f p{margin:4px 0;max-width:80ch}.q{font-style:italic}
code{font-size:13px;overflow-wrap:anywhere}
@media(max-width:760px){.top{grid-template-columns:minmax(0,1fr)}.tally{grid-template-columns:max-content minmax(0,1fr) max-content}.tally .tg{display:none}}
</style>
<section class="band"><h1>“L’atome” pilot: lesson 1 under review</h1>
<div class="top"><div><div class="status">${esc(status)}</div>
${hasCourse ? '<p><a class="btn" href="course.html">Open the built course →</a></p>' : ''}
<p class="muted">Comment on this page to give feedback; the run continues from your answers.</p></div>
<div class="card"><h3 style="margin-top:0">Findings per review</h3><div class="tally">${tally.map((x) => `<span class="tg">${esc(x.target)}</span><span>r${x.round} ${esc(x.reviewer)}</span><span class="bar" role="img" aria-label="${x.error} errors, ${x.amb} ambiguous"><i class="e" style="width:${(100 * x.error) / maxBar}%"></i><i class="a" style="width:${(100 * x.amb) / maxBar}%"></i></span><span>${x.error}·${x.amb}</span>`).join('')}</div>
<div class="key"><b style="background:var(--err)"></b>ERROR<b style="background:var(--amb)"></b>AMBIGUOUS</div></div></div></section>
${body}
`);
console.log(`review page: ${join(out, 'index.html')}${hasCourse ? ' (+ course.html)' : ''}`);
