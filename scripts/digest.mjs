#!/usr/bin/env node
// Compact, review-ready view of a lesson: everything a reviewer reads, without scene
// coordinates. Cuts a lesson from ~40k to ~4k tokens. Usage: node scripts/digest.mjs <lesson.json>
import { readFileSync } from 'node:fs';
const l = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const o = [];
o.push(`# ${l.id} — ${l.title}`, `Goal: ${l.goal}`, '', '## Notation');
l.notation.forEach((n, i) => o.push(`${i}. ${n}`));
for (const s of l.steps) {
  o.push('', `## ${s.id} [${s.tag}] ${s.title}`, `Takeaway: ${s.takeaway ?? '(missing)'}`, `Text: ${s.text}`);
  if (s.callout) o.push(`Callout (${s.callout.kind}): ${s.callout.text}`);
  if (s.notationLine != null) o.push(`Notation line: ${s.notationLine}`);
  if (s.counters?.length) o.push(`Counters: ${s.counters.map((c) => `${c.label} = ${c.value}${c.unit ? ' ' + c.unit : ''}${c.changed ? '*' : ''}`).join(' | ')}`);
  o.push(`Scene: ${s.sceneDescription}`);
  const texts = (s.scene || []).filter((x) => x.text).map((x) => `${x.accent ? '**' : ''}${x.text}${x.accent ? '**' : ''}`);
  if (texts.length) o.push(`Scene labels: ${texts.join(' · ')}`);
  if (s.widget) o.push(`Widget: ${JSON.stringify(s.widget)}`);
  if (s.sourceIds?.length) o.push(`Sources: ${s.sourceIds.join(', ')}`);
}
o.push('', '## Quiz');
for (const q of l.quiz) {
  o.push(`- ${q.id}: ${q.question}`);
  q.options.forEach((x, i) => o.push(`  ${i === q.answer ? '[x]' : '[ ]'} ${x}`));
  o.push(`  Explanation: ${q.explanation}`);
}
o.push('', '## Sources');
for (const s of l.sources) o.push(`- ${s.id}: ${s.title} — ${s.url} (${s.accessed})${s.supports ? ' — ' + s.supports : ''}`);
if (l.furtherReading?.length) { o.push('', '## Further reading'); for (const r of l.furtherReading) o.push(`- ${r.title} (${r.provider}) — ${r.url} — ${r.why}`); }
console.log(o.join('\n'));
