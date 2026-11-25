#!/usr/bin/env node
// Validates every pipeline file against schema/course.schema.json, then runs
// the rules JSON Schema cannot express. Exit code 1 if anything fails.
//
// Usage: node scripts/validate.mjs [--require-scenes] [--root <dir>]
//   --require-scenes  every step must have a non-empty `scene` (use before build)
//   --root            directory holding inputs/, courses/, work/ (default: repo root)

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootArg = process.argv.indexOf('--root');
const ROOT = rootArg > -1 ? resolve(process.argv[rootArg + 1]) : REPO;
const REQUIRE_SCENES = process.argv.includes('--require-scenes');
const MAX_WORDS = 90;
const ROLES = Object.keys(JSON.parse(readFileSync(join(REPO, 'engine/palette.json'), 'utf8')).roles);
const WIDGETS = []; // widget types the engine implements; none yet

const errors = [];
const fail = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);
let checked = 0;

// ---------- schema ----------
const schema = JSON.parse(readFileSync(join(REPO, 'schema/course.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
ajv.addSchema(schema);
const validator = (def) => ajv.getSchema(`${schema.$id}#/$defs/${def}`);
// Compile every definition now: a broken schema must fail even with no content yet.
for (const def of Object.keys(schema.$defs)) validator(def);

function checkShape(file, data, def) {
  checked++;
  const v = validator(def);
  if (v(data)) return true;
  for (const e of v.errors) fail(file, `${def}${e.instancePath || ''} ${e.message}${e.params?.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
  return false;
}

function readJson(file) {
  try { return JSON.parse(readFileSync(file, 'utf8')); }
  catch (e) { fail(file, `invalid JSON: ${e.message}`); return null; }
}

const listFiles = (dir, ext) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f)) : [];
const listDirs = (dir) =>
  existsSync(dir) ? readdirSync(dir).map((d) => join(dir, d)).filter((d) => statSync(d).isDirectory()) : [];

// ---------- text helpers ----------
const MATH = /\$[^$]*\$/g;
const stripMath = (s) => s.replace(MATH, ' MATH ');
function wordCount(s) {
  return stripMath(s).split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

// French typography (rule 8). Checked outside $...$ only, except decimals.
function frenchTypography(text) {
  const issues = [];
  const plain = stripMath(text);
  if (/[^  \s][;:!?](?!\/\/)/u.test(plain.replace(/https?:\/\/\S+/g, ''))) issues.push('missing non-breaking space before ; : ! ?');
  if (/ [;:!?]/.test(plain)) issues.push('ordinary space before ; : ! ? (use U+00A0 or U+202F)');
  if (/"/.test(plain)) issues.push('straight double quotes: use « … » with non-breaking spaces');
  if (/«(?![  ])|(?<![  ])»/u.test(plain)) issues.push('« » need non-breaking spaces inside');
  if (/\d\.\d/.test(plain)) issues.push('decimal point: use a decimal comma');
  for (const m of text.match(MATH) || []) {
    if (/\d\.\d/.test(m)) issues.push(`decimal point in math ${m}: write {,} as in 1{,}6`);
  }
  return issues;
}

function displayTexts(lesson) {
  const out = [['title', lesson.title], ['goal', lesson.goal]];
  for (const s of lesson.steps) {
    out.push([`steps/${s.id}/title`, s.title], [`steps/${s.id}/text`, s.text]);
    if (s.callout) out.push([`steps/${s.id}/callout`, s.callout.text]);
    for (const c of s.counters || []) out.push([`steps/${s.id}/counters/${c.key}`, c.label]);
    for (const o of s.scene || []) if (o.text) out.push([`steps/${s.id}/scene/${o.key}`, o.text]);
  }
  for (const q of lesson.quiz) {
    out.push([`quiz/${q.id}/question`, q.question], [`quiz/${q.id}/explanation`, q.explanation]);
    q.options.forEach((o, i) => out.push([`quiz/${q.id}/options/${i}`, o]));
  }
  return out;
}

const dupes = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);

// ---------- inputs ----------
const inputs = new Map(); // slug -> input
for (const file of [...listFiles(join(ROOT, 'inputs'), '.yaml'), ...listFiles(join(ROOT, 'inputs'), '.yml')]) {
  let data;
  try { data = YAML.parse(readFileSync(file, 'utf8')); }
  catch (e) { fail(file, `invalid YAML: ${e.message}`); continue; }
  if (!checkShape(file, data, 'input')) continue;
  if (inputs.has(data.slug)) fail(file, `duplicate slug ${data.slug}`);
  inputs.set(data.slug, data);
  const ids = data.chapters.map((c) => c.id);
  for (const d of dupes(ids)) fail(file, `duplicate chapter id ${d}`);
  for (const k of ['lessonMinutes', 'stepsPerLesson']) {
    const r = data.style?.[k];
    if (r && r[0] > r[1]) fail(file, `style.${k} min > max`);
  }
}

// ---------- courses ----------
for (const courseDir of listDirs(join(ROOT, 'courses'))) {
  const slug = basename(courseDir);
  const input = inputs.get(slug);
  if (!input) fail(courseDir, `no inputs/*.yaml has slug ${slug}`);
  const lang = input?.language ?? '';
  const stepRange = input?.style?.stepsPerLesson;

  for (const chapterDir of listDirs(courseDir)) {
    const chapter = basename(chapterDir);
    if (input && !input.chapters.some((c) => c.id === chapter)) fail(chapterDir, `chapter ${chapter} not in input`);

    let plan = null;
    const planFile = join(chapterDir, 'plan.json');
    if (existsSync(planFile)) {
      const p = readJson(planFile);
      if (p && checkShape(planFile, p, 'plan')) {
        plan = p;
        if (p.course !== slug) fail(planFile, `course "${p.course}" != directory "${slug}"`);
        if (p.chapter !== chapter) fail(planFile, `chapter "${p.chapter}" != directory "${chapter}"`);
        for (const d of dupes(p.lessons.map((l) => l.id))) fail(planFile, `duplicate lesson id ${d}`);
        // Lesson titles are shown in the course tree before the lesson exists.
        if (lang.startsWith('fr')) {
          for (const l of p.lessons) for (const issue of frenchTypography(l.title)) fail(planFile, `lessons/${l.id}/title: ${issue}`);
        }
      }
    }

    for (const file of listFiles(chapterDir, '.json').filter((f) => basename(f) !== 'plan.json')) {
      const lesson = readJson(file);
      if (!lesson || !checkShape(file, lesson, 'lesson')) continue;
      const at = (m) => fail(file, m);

      if (basename(file, '.json') !== lesson.id) at(`file name must be ${lesson.id}.json`);
      if (lesson.course !== slug) at(`course "${lesson.course}" != directory "${slug}"`);
      if (lesson.chapter !== chapter) at(`chapter "${lesson.chapter}" != directory "${chapter}"`);
      if (!plan) at('no valid plan.json in this chapter');
      else if (!plan.lessons.some((l) => l.id === lesson.id)) at(`lesson ${lesson.id} not in plan.json`);

      if (stepRange && (lesson.steps.length < stepRange[0] || lesson.steps.length > stepRange[1]))
        at(`${lesson.steps.length} steps, input allows ${stepRange[0]}-${stepRange[1]}`);

      const sourceIds = lesson.sources.map((s) => s.id);
      for (const d of dupes(sourceIds)) at(`duplicate source id ${d}`);
      for (const d of dupes(lesson.steps.map((s) => s.id))) at(`duplicate step id ${d}`);
      for (const d of dupes(lesson.quiz.map((q) => q.id))) at(`duplicate quiz id ${d}`);

      for (const s of lesson.steps) {
        const where = `steps/${s.id}`;
        const n = wordCount(s.text);
        if (n > MAX_WORDS) at(`${where}/text has ${n} words (max ${MAX_WORDS})`);
        if (s.notationLine != null && s.notationLine >= lesson.notation.length)
          at(`${where}/notationLine ${s.notationLine} out of range (notation has ${lesson.notation.length} lines)`);
        for (const id of s.sourceIds || []) if (!sourceIds.includes(id)) at(`${where}/sourceIds: unknown source ${id}`);
        for (const d of dupes((s.counters || []).map((c) => c.key))) at(`${where}: duplicate counter key ${d}`);

        const scene = s.scene || [];
        if (REQUIRE_SCENES && scene.length === 0) at(`${where}: no scene (stager has not run)`);
        const keys = scene.map((o) => o.key);
        for (const d of dupes(keys)) at(`${where}: duplicate scene key ${d}`);
        if (scene.filter((o) => o.accent).length > 1) at(`${where}: more than one accent object (one focus per step)`);
        if (s.widget && !WIDGETS.includes(s.widget.type)) at(`${where}/widget: type ${s.widget.type} is not implemented by the engine (available: ${WIDGETS.join(', ') || 'none'})`);
        for (const o of scene) {
          if (o.role && !ROLES.includes(o.role)) at(`${where}/scene/${o.key}: unknown role ${o.role} (engine/palette.json: ${ROLES.join(', ')})`);
          if (o.parent && !scene.some((g) => g.key === o.parent && g.type === 'group'))
            at(`${where}/scene/${o.key}: parent ${o.parent} is not a group in this step`);
          if (o.type === 'arrow' && !(o.pos && o.to)) at(`${where}/scene/${o.key}: arrow needs pos and to`);
          if ((o.type === 'label' || o.type === 'text') && !o.text) at(`${where}/scene/${o.key}: ${o.type} needs text`);
        }
      }

      for (const q of lesson.quiz) {
        if (q.answer >= q.options.length) at(`quiz/${q.id}: answer ${q.answer} out of range`);
        if (dupes(q.options).length) at(`quiz/${q.id}: duplicate options`);
      }

      if (lang.startsWith('fr')) {
        for (const [path, text] of displayTexts(lesson))
          for (const issue of frenchTypography(text)) at(`${path}: ${issue}`);
      }
    }
  }
}

// ---------- review reports ----------
for (const courseDir of listDirs(join(ROOT, 'work'))) {
  const walk = (dir) => {
    for (const d of listDirs(dir)) walk(d);
    for (const f of listFiles(dir, '.json')) {
      const r = readJson(f);
      if (r) checkShape(f, r, 'review');
    }
  };
  const reviews = join(courseDir, 'reviews');
  if (existsSync(reviews)) walk(reviews);
}

// ---------- report ----------
if (errors.length) {
  console.error(`validate: ${errors.length} problem(s) in ${checked} file(s)`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`validate: OK (${checked} file(s) checked${REQUIRE_SCENES ? ', scenes required' : ''})`);
