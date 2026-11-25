// Runs against every built course (dist/*/index.html) and the engine fixture (tests/.build).
import { test, expect } from '@playwright/test';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const pages = [];
for (const base of ['tests/.build', 'dist']) {
  if (!existsSync(base)) continue;
  for (const slug of readdirSync(base)) {
    const f = resolve(base, slug, 'index.html');
    if (existsSync(f)) pages.push({ name: `${base}/${slug}`, url: `file://${f}` });
  }
}

async function open(page, url, hash = '') {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + hash);
  const data = JSON.parse(await page.locator('#course-data').textContent());
  const lessons = data.chapters.flatMap((c) => c.lessons.filter((l) => l.available).map((l) => ({ ...l, chapter: c.id })));
  return { errors, data, lessons };
}

for (const p of pages) {
  test.describe(p.name, () => {
    test.use({ reducedMotion: 'reduce' });

    test('every step and quiz renders, without console errors or overflow', async ({ page }) => {
      const { errors, lessons } = await open(page, p.url);
      expect(lessons.length).toBeGreaterThan(0);
      for (const l of lessons) {
        await page.goto(`${p.url}#/${l.chapter}/${l.id}/1`);
        for (let i = 0; i < l.steps.length; i++) {
          await expect(page.locator('[data-step]').first()).toHaveAttribute('data-step', l.steps[i].id);
          await expect(page.locator('.stage svg .obj').first()).toBeAttached();
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `horizontal overflow at ${l.id}/${l.steps[i].id}`).toBeLessThanOrEqual(0);
          await page.waitForTimeout(80);
          const overlaps = await page.evaluate(() => {
            const boxes = [...document.querySelectorAll('.stage .obj')]
              .filter((g) => (g.classList.contains('t-label') || g.classList.contains('t-text')) && getComputedStyle(g).opacity !== '0')
              .map((g) => ({ k: g.dataset.key, r: g.querySelector('text').getBoundingClientRect() }));
            const out = [];
            for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
              const A = boxes[a].r, B = boxes[b].r;
              if (A.left < B.right - 1 && B.left < A.right - 1 && A.top < B.bottom - 1 && B.top < A.bottom - 1) out.push(`${boxes[a].k}/${boxes[b].k}`);
            }
            return out;
          });
          expect(overlaps, `overlapping labels at ${l.id}/${l.steps[i].id}`).toEqual([]);
          await page.locator('#next').click();
        }
        await expect(page.locator('[data-step="quiz"]')).toBeVisible();
        const qs = page.locator('.q');
        await expect(qs).toHaveCount(l.quiz.length);
        for (let qi = 0; qi < l.quiz.length; qi++) {
          const q = qs.nth(qi);
          await q.locator('input[type=radio]').nth(l.quiz[qi].answer).check();
          await q.getByRole('button').click();
          await expect(q.locator('.opt.right')).toHaveCount(1);
          await expect(q.locator('.feedback b.ok')).toBeVisible();
        }
      }
      expect(errors).toEqual([]);
    });

    test('steps carry no source links; annex lists production sources', async ({ page }) => {
      const { data, lessons } = await open(page, p.url);
      for (const l of lessons) {
        await page.goto(`${p.url}#/${l.chapter}/${l.id}/1`);
        for (let i = 0; i < l.steps.length; i++) {
          expect(await page.locator('[data-step] a[href^="http"]').count(), `link in step ${l.steps[i].id}`).toBe(0);
          await page.locator('#next').click();
        }
      }
      await page.goto(`${p.url}#/sources`);
      const n = lessons.reduce((a, l) => a + l.sources.length, 0) + (data.referentials || []).length;
      await expect(page.locator('.annex a[href^="http"]')).toHaveCount(n);
    });

    test('further reading appears after the quiz', async ({ page }) => {
      const { lessons } = await open(page, p.url);
      for (const l of lessons) {
        await page.goto(`${p.url}#/${l.chapter}/${l.id}/quiz`);
        await expect(page.locator('.further li')).toHaveCount((l.furtherReading || []).length);
      }
    });

    test('formulas are pre-rendered MathML', async ({ page }) => {
      await open(page, p.url);
      expect(await page.locator('script[src]').count()).toBe(0);
      expect(await page.locator('link[rel=stylesheet]').count()).toBe(0);
      const html = await page.content();
      expect(html).not.toMatch(/katex-error/);
    });

    test('keyboard navigation', async ({ page }) => {
      const { lessons } = await open(page, p.url);
      const l = lessons[0];
      await page.goto(`${p.url}#/${l.chapter}/${l.id}/1`);
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-step]').first()).toHaveAttribute('data-step', l.steps[1].id);
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('[data-step]').first()).toHaveAttribute('data-step', l.steps[0].id);
    });

    test('theme toggle switches to dark and back', async ({ page }) => {
      await open(page, p.url);
      const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const light = await bg();
      await page.locator('#theme').click(); // auto -> light
      await page.locator('#theme').click(); // light -> dark
      expect(await bg()).not.toBe(light);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('reduced motion disables transitions', async ({ page }) => {
      await open(page, p.url);
      const d = await page.locator('.stage .obj').first().evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(d.split(',').every((x) => parseFloat(x) === 0)).toBe(true);
    });
  });
}

test('atom-builder widget computes Z, A and charge', async ({ page }) => {
  await page.goto(`file://${resolve('tests/.build/demo/index.html')}#/basics/shapes/3`);
  const w = page.locator('[data-widget="atom-builder"]');
  await expect(w.locator('.nuc')).toContainText('C');
  await w.locator('.wrow').nth(0).getByRole('button', { name: /plus|more/ }).click(); // 7 protons
  await expect(w.locator('.nuc')).toContainText('N');
  await expect(w.locator('dd').nth(0)).toHaveText('7');
  await expect(w.locator('dd').nth(1)).toHaveText('13');
  await expect(w.locator('dd').nth(2)).toContainText('+1');
});

test('at least one page to test', () => {
  expect(pages.length).toBeGreaterThan(0);
});
