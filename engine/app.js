/* lesson-forge engine runtime. No dependencies. Data comes pre-rendered from scripts/build.mjs. */
(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('course-data').textContent);
  const T = D.ui;
  const $ = (sel, el = document) => el.querySelector(sel);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null) el.append(k.nodeType ? k : document.createTextNode(k));
    return el;
  };
  const SVG = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs = {}) => {
    const el = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
    return el;
  };

  // ---------- storage (best effort) ----------
  const KEY = `lesson-forge:${D.course.slug}`;
  const store = (() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* private mode */ } };
  store.seen ??= {}; store.quiz ??= {};

  // ---------- theme ----------
  const THEMES = ['auto', 'light', 'dark'];
  const applyTheme = () => {
    const t = store.theme || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const btn = $('#theme');
    const sep = D.course.language.startsWith('fr') ? ' : ' : ': ';
    if (btn) btn.textContent = `${T.theme}${sep}${T['theme' + t[0].toUpperCase() + t.slice(1)]}`;
  };
  const isDark = () => {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const roleColor = (role) => (D.palette[role] || D.palette.neutral)[isDark() ? 'dark' : 'light'];

  // ---------- model ----------
  const lessons = D.chapters.flatMap((c) => c.lessons.map((l) => ({ ...l, chapter: c.id })));
  const available = lessons.filter((l) => l.available);
  const find = (ch, id) => available.find((l) => l.chapter === ch && l.id === id);
  let cur = { lesson: null, step: 0 }; // step === lesson.steps.length means quiz

  function parseHash() {
    const [ch, id, st] = location.hash.replace(/^#\/?/, '').split('/');
    const lesson = find(ch, id) || available[0] || null;
    if (!lesson) return { lesson: null, step: 0 };
    let step = st === 'quiz' ? lesson.steps.length : Math.max(0, (parseInt(st, 10) || 1) - 1);
    step = Math.min(step, lesson.steps.length);
    return { lesson, step };
  }
  const go = (lesson, step) => {
    const st = step >= lesson.steps.length ? 'quiz' : String(step + 1);
    location.hash = `#/${lesson.chapter}/${lesson.id}/${st}`;
  };

  // ---------- layout ----------
  const app = h('div', { class: 'app' });
  const header = h('header', { class: 'top' },
    h('button', { class: 'btn menu-btn', id: 'menu', 'aria-expanded': 'false', onclick: () => {
      const open = tree.classList.toggle('open');
      $('#menu').setAttribute('aria-expanded', String(open));
    } }, T.menu),
    h('div', { class: 'brand' }, D.course.title, h('small', {}, D.course.subtitle || '')),
    h('div', { class: 'spacer' }),
    h('a', { class: 'btn', href: '#/sources', id: 'annex-link' }, T.annex),
    h('button', { class: 'btn', id: 'theme', onclick: () => {
      store.theme = THEMES[(THEMES.indexOf(store.theme || 'auto') + 1) % THEMES.length];
      save(); applyTheme(); render();
    } }));
  const tree = h('nav', { class: 'tree', 'aria-label': T.menu });
  const stageCol = h('main', { class: 'stage-col' });
  const panels = h('aside', { class: 'panels' });
  app.append(header, tree, stageCol, panels);
  document.body.append(app);

  // ---------- tree ----------
  const search = h('input', { class: 'search', type: 'search', placeholder: T.search, 'aria-label': T.search, oninput: () => renderTree() });
  function progressOf(l) {
    const seen = (store.seen[`${l.chapter}/${l.id}`] || []).length;
    return { seen, total: l.steps.length, done: !!store.quiz[`${l.chapter}/${l.id}`]?.done };
  }
  function renderTree() {
    const q = search.value.trim().toLowerCase();
    tree.replaceChildren(search);
    let n = 0;
    for (const c of D.chapters) {
      const items = c.lessons.filter((l) => !q || l.search.includes(q));
      if (!items.length) continue;
      tree.append(h('div', { class: 'chapter' }, h('h2', {}, c.title), ...items.map((l) => {
        n++;
        const p = l.available ? progressOf({ ...l, chapter: c.id }) : null;
        const active = cur.lesson && cur.lesson.id === l.id && cur.lesson.chapter === c.id;
        return h('button', {
          class: 'lesson-link', disabled: !l.available, 'aria-current': active ? 'true' : null,
          onclick: () => { tree.classList.remove('open'); go(find(c.id, l.id), 0); },
        },
        h('span', { class: `num${p?.done ? ' done' : ''}` }, p?.done ? '✓' : String(l.index)),
        h('span', {}, l.title,
          h('span', { class: 'meta' }, l.available ? `${p.seen}/${p.total}` : T.soon),
          l.available ? h('span', { class: 'bar' }, h('i', { style: `width:${(100 * p.seen) / p.total}%` })) : null));
      })));
    }
    return n;
  }

  // ---------- scene ----------
  const U = 30;
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  const proj = ([x, y, z]) => [(x - y) * C30 * U, (x + y) * S30 * U - z * U];
  const svg = s('svg', { viewBox: `${-9.4 * U} ${-6.6 * U} ${18.8 * U} ${17.4 * U}`, role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  const layer = s('g');
  const defs = s('defs');
  const marker = s('marker', { id: 'arrowhead', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
  marker.append(s('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'context-stroke' }));
  defs.append(marker);
  svg.append(defs, layer);
  const nodes = new Map(); // key -> { el, type, timer }

  // Light comes from the upper left. Colors are shaded per face, spheres get a radial gradient,
  // raised objects cast a soft shadow on the floor, flat plates get a visible thickness.
  const hex = (c) => c.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
  const mix = (c, t, a) => '#' + hex(c).map((v, i) => Math.round(v + (t[i] - v) * a).toString(16).padStart(2, '0')).join('');
  const light = (c, a) => mix(c, [255, 255, 255], a);
  const dark = (c, a) => mix(c, [0, 0, 0], a);
  function gradient(color) {
    const id = `g${color.slice(1)}`;
    if (!defs.querySelector(`#${id}`)) {
      const g = s('radialGradient', { id, cx: '35%', cy: '30%', r: '75%', fx: '30%', fy: '25%' });
      [[0, light(color, 0.55)], [0.45, color], [1, dark(color, 0.35)]].forEach(([o, c]) => g.append(s('stop', { offset: o, 'stop-color': c })));
      defs.append(g);
    }
    return `url(#${id})`;
  }
  const P = (x, y, z) => proj([x, y, z]).join(',');
  let clipN = 0;
  // Rounded rectangle in the plane z = zt, as a list of [x, y] points (counter-clockwise).
  function roundedRect(w, d, r) {
    r = Math.max(0, Math.min(r, w / 2, d / 2));
    const pts = [], n = r > 0 ? 6 : 0;
    for (const [cx, cy, a0] of [[w / 2 - r, -d / 2 + r, -90], [w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180]]) {
      for (let i = 0; i <= n; i++) {
        const a = ((a0 + (90 * i) / (n || 1)) * Math.PI) / 180;
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        if (!n) break;
      }
    }
    return pts;
  }
  // Extruded rounded plate: dark sides facing the viewer, light top, optional inset cells,
  // labels on the front face and shadows of resting objects clipped to the top.
  function plate(g, o, color, kind) {
    const dims = o.dims || [o.size ?? 1, o.size ?? 1];
    const th = o.height ?? (kind === 'board' ? 0.4 : 0.14);
    const rr = o.radius ?? (kind === 'board' ? 0.3 : 0.12);
    const pts = roundedRect(dims[0], dims[1], rr);
    const ring = (z) => pts.map(([x, y]) => P(x, y, z)).join(' ');
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      const nx = y2 - y1, ny = -(x2 - x1); // outward normal of a CCW polygon in this frame
      if (nx + ny <= 1e-9) continue; // faces away from the viewer
      const shade = 0.18 + 0.22 * (ny / Math.hypot(nx, ny) > nx / Math.hypot(nx, ny) ? 1 : 0.4);
      g.append(s('polygon', { points: [P(x1, y1, th), P(x2, y2, th), P(x2, y2, 0), P(x1, y1, 0)].join(' '), fill: dark(color, kind === 'board' ? 0.55 + shade * 0.4 : shade), stroke: dark(color, 0.75), 'stroke-width': 0.6, 'stroke-linejoin': 'round' }));
    }
    const top = ring(th);
    g.append(s('polygon', { class: 'fill edge', points: top, fill: kind === 'board' ? light(color, 0.72) : light(color, 0.1) }));
    if (o.slots) {
      const n = o.slots, cw = dims[0] / n, pad = Math.min(cw, dims[1]) * 0.12;
      for (let i = 0; i < n; i++) {
        const cx = -dims[0] / 2 + cw * (i + 0.5);
        const cell = roundedRect(cw - 2 * pad, dims[1] - 2 * pad, Math.min(cw, dims[1]) * 0.12).map(([x, y]) => P(cx + x, y, th)).join(' ');
        g.append(s('polygon', { class: 'slot', points: cell, fill: light(roleColor(o.slotRole || o.role), 0.8), stroke: roleColor(o.slotRole || o.role), 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }));
      }
    }
    if (o.sideLabels?.length) {
      const n = o.sideLabels.length, step = dims[0] / n;
      o.sideLabels.forEach((txt, i) => {
        const [tx, ty] = proj([-dims[0] / 2 + step * (i + 0.5), dims[1] / 2, th / 2]);
        const t = s('text', { class: 'side-label', 'text-anchor': 'middle', 'dominant-baseline': 'middle', transform: `matrix(${C30},${S30},0,1,${tx},${ty})` });
        t.textContent = txt; g.append(t);
      });
    }
    if (o.shadows?.length) {
      const id = `clip${++clipN}`;
      const cp = s('clipPath', { id }); cp.append(s('polygon', { points: top })); defs.append(cp);
      const sg = s('g', { 'clip-path': `url(#${id})` });
      for (const [dx, dy, r, op] of o.shadows) {
        const [cx, cy] = proj([dx, dy, th]);
        sg.append(s('ellipse', { class: 'shadow', cx, cy, rx: r * C30 * U * 1.1, ry: r * S30 * U * 1.1, fill: '#0b1220', 'fill-opacity': op }));
      }
      g.append(sg);
    }
  }
  // Floor shadow, drawn at unit radius and scaled, so size and height changes animate.
  function floorShadow(g, o) {
    const sh = s('g', { class: 'shadowg' });
    sh.append(s('ellipse', { class: 'shadow', rx: C30 * U * 1.1, ry: S30 * U * 1.1, fill: '#0b1220' }));
    g.append(sh);
  }
  function placeShadow(el, o) {
    const sh = el.querySelector('.shadowg');
    if (!sh) return;
    const z = o.abs?.[2] ?? 0, r = o.type === 'cube' ? (o.size ?? 1) * 0.75 : (o.size ?? 1) / 2;
    const bottom = z - (o.type === 'sphere' ? (o.size ?? 1) / 2 : 0);
    const show = o.shadow !== false && !o.support && (o.shadow === true || (bottom <= 1 && (z > 0.01 || o.type === 'cube')));
    sh.style.transform = `translate(0px, ${z * U}px) scale(${r})`;
    sh.style.opacity = show ? String(Math.max(0.08, 0.28 - z * 0.03)) : '0';
  }
  function shapeFor(o) {
    const g = s('g', { class: 'shape' });
    const color = roleColor(o.role);
    const size = o.size ?? 1;
    switch (o.type) {
      case 'sphere': {
        const r = U / 2;
        floorShadow(g, o);
        const sc = s('g', { class: 'scaler' }); g.append(sc);
        sc.append(s('circle', { class: 'fill', r, fill: gradient(color), 'data-color': color }),
          s('ellipse', { cx: -r * 0.32, cy: -r * 0.38, rx: r * 0.28, ry: r * 0.18, fill: '#fff', 'fill-opacity': 0.45, transform: 'rotate(-30)' }));
        sc.style.transform = `scale(${size})`;
        break;
      }
      case 'cube': {
        const e = 1, h = 0.5;
        floorShadow(g, o);
        const sc = s('g', { class: 'scaler' }); g.append(sc); sc.style.transform = `scale(${size})`;
        const top = [P(-h, -h, e), P(h, -h, e), P(h, h, e), P(-h, h, e)].join(' ');
        const left = [P(-h, h, e), P(h, h, e), P(h, h, 0), P(-h, h, 0)].join(' ');
        const right = [P(h, -h, e), P(h, h, e), P(h, h, 0), P(h, -h, 0)].join(' ');
        sc.append(s('polygon', { class: 'fill edge face-l', points: left, fill: dark(color, 0.3), 'data-color': color }),
          s('polygon', { class: 'fill edge face-r', points: right, fill: dark(color, 0.15), 'data-color': color }),
          s('polygon', { class: 'fill edge face-t', points: top, fill: light(color, 0.12), 'data-color': color }));
        break;
      }
      case 'tile': plate(g, o, color, 'tile'); break;
      case 'board': plate(g, o, color, 'board'); break;
      case 'ring': {
        const rx = size * Math.SQRT2 * C30 * U, ry = size * Math.SQRT2 * S30 * U;
        g.append(s('ellipse', { rx, ry: ry + 2, cy: 2, fill: 'none', stroke: dark(color, 0.35), 'stroke-width': 2.5, 'stroke-opacity': 0.5, 'vector-effect': 'non-scaling-stroke' }),
          s('ellipse', { class: 'ring', rx, ry, stroke: color }));
        break;
      }
      case 'arrow': {
        const [x1, y1] = proj(o.pos), [x2, y2] = proj(o.to);
        // pathLength=1 makes the dash pattern independent of scale, so the draw-on effect is exact.
        const ln = s('line', { class: 'arrow', x1: 0, y1: 0, x2: x2 - x1, y2: y2 - y1, 'marker-end': 'url(#arrowhead)', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 });
        g.append(ln);
        requestAnimationFrame(() => requestAnimationFrame(() => ln.setAttribute('stroke-dashoffset', 0)));
        break;
      }
      case 'label': {
        g.append(s('circle', { class: 'dot', r: 2.5 }), s('line', { x1: 0, y1: 0, x2: 0, y2: -14, stroke: 'currentColor', 'stroke-opacity': 0.4 }));
        const t = s('text', { y: -19, 'text-anchor': 'middle' }); t.textContent = o.text; g.append(t);
        break;
      }
      case 'text': {
        const t = s('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }); t.textContent = o.text; g.append(t);
        break;
      }
      default: break;
    }
    return g;
  }
  const signature = (o) => JSON.stringify([o.type, o.role, roleColor(o.role), o.type === 'sphere' || o.type === 'cube' ? 0 : o.size, o.text, o.shadows, o.dims, o.height, o.radius, o.sideLabels, o.slots, o.slotRole, o.to && o.pos && proj(o.to).map((v, i) => v - proj(o.pos)[i])]);
  const typeRank = { board: 0, tile: 1, ring: 2, cube: 3, sphere: 3, arrow: 4, text: 5, label: 6 };

  // Frame the whole lesson once, so the camera stays still between steps.
  const frames = new WeakMap();
  function frameLesson(lesson) {
    if (frames.has(lesson)) return frames.get(lesson);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = ([x, y], r = 0) => { x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); };
    for (const st of lesson.steps) {
      const byKey = new Map(st.scene.map((o) => [o.key, o]));
      for (const o of st.scene) {
        if (o.type === 'group') continue;
        const off = (o.parent && byKey.get(o.parent)?.pos) || [0, 0, 0];
        const at = (p) => p.map((v, i) => v + off[i]);
        const p = at(o.pos || [5, 5, 0]);
        const r = (o.size ?? 1) * U * (o.type === 'ring' || o.type === 'board' || o.type === 'tile' ? 1.25 : 0.75);
        if (o.type === 'board' || o.type === 'tile') {
          const dm = o.dims || [o.size ?? 1, o.size ?? 1], hx = dm[0] / 2, hy = dm[1] / 2, th = o.height ?? 0.4;
          for (const [dx, dy] of [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]]) { add(proj([p[0] + dx, p[1] + dy, p[2] + th])); add(proj([p[0] + dx, p[1] + dy, p[2]])); }
        } else add(proj(p), o.type === 'label' || o.type === 'text' ? 0 : r);
        if (o.type === 'label') add([proj(p)[0], proj(p)[1] - 30], 0);
        if (o.type === 'label' || o.type === 'text') { const w = (o.text || '').length * 4.5; add([proj(p)[0] - w, proj(p)[1]]); add([proj(p)[0] + w, proj(p)[1]]); }
        if (o.to) add(proj(at(o.to)));
      }
    }
    if (!isFinite(x0)) { x0 = -9.4 * U; y0 = -6.6 * U; x1 = 9.4 * U; y1 = 10.8 * U; }
    const pad = 14, minW = 5 * U, minH = 4 * U;
    let w = Math.max(x1 - x0, minW), hh = Math.max(y1 - y0, minH);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const box = `${cx - w / 2 - pad} ${cy - hh / 2 - pad} ${w + 2 * pad} ${hh + 2 * pad}`;
    frames.set(lesson, box);
    return box;
  }

  function renderScene(step, lesson) {
    svg.setAttribute('viewBox', frameLesson(lesson));
    svg.setAttribute('aria-label', step.sceneDescription || '');
    const byKey = new Map(step.scene.map((o) => [o.key, o]));
    // resolve group offsets
    const abs = (o) => {
      let p = o.pos || [5, 5, 0];
      const g = o.parent && byKey.get(o.parent);
      if (g && g.pos) p = p.map((v, i) => v + g.pos[i]);
      return p;
    };
    const visible = step.scene.filter((o) => o.type !== 'group')
      .map((o) => ({ ...o, abs: abs(o), to: o.to && o.parent && byKey.get(o.parent)?.pos ? o.to.map((v, i) => v + byKey.get(o.parent).pos[i]) : o.to }))
      .sort((a, b) => (typeRank[a.type] ?? 3) - (typeRank[b.type] ?? 3) || (a.abs[0] + a.abs[1] + a.abs[2]) - (b.abs[0] + b.abs[1] + b.abs[2]));
    // Each sphere/cube resting on a board or tile casts its shadow on that plate's top face.
    const plates = visible.filter((o) => o.type === 'board' || o.type === 'tile');
    for (const pl of plates) pl.shadows = [];
    for (const o of visible) {
      if (o.type !== 'sphere' && o.type !== 'cube') continue;
      const bottom = o.type === 'sphere' ? o.abs[2] - (o.size ?? 1) / 2 : o.abs[2];
      let best = null;
      for (const pl of plates) {
        const dm = pl.dims || [pl.size ?? 1, pl.size ?? 1], top = pl.abs[2] + (pl.height ?? (pl.type === 'board' ? 0.4 : 0.14));
        if (Math.abs(o.abs[0] - pl.abs[0]) <= dm[0] / 2 && Math.abs(o.abs[1] - pl.abs[1]) <= dm[1] / 2 && top <= bottom + 0.05 && (!best || top > best.top)) best = { pl, top };
      }
      if (best && o.shadow !== false && (o.shadow === true || bottom - best.top <= 1)) {
        o.support = best.pl.key;
        const z = o.abs[2] - best.top, r = o.type === 'cube' ? (o.size ?? 1) * 0.75 : (o.size ?? 1) / 2;
        best.pl.shadows.push([o.abs[0] - best.pl.abs[0], o.abs[1] - best.pl.abs[1], r, +Math.max(0.1, 0.3 - z * 0.03).toFixed(2)]);
      }
    }

    for (const [key, n] of nodes) {
      if (!visible.some((o) => o.key === key)) {
        n.el.style.opacity = '0';
        clearTimeout(n.timer);
        n.timer = setTimeout(() => { n.el.remove(); nodes.delete(key); }, 480);
      }
    }
    let entering = 0;
    visible.forEach((o, i) => {
      const [x, y] = proj(o.abs);
      let n = nodes.get(o.key);
      const sig = signature({ ...o, pos: o.abs });
      if (n && n.sig !== sig) { n.el.replaceChildren(shapeFor({ ...o, pos: o.abs })); n.sig = sig; }
      if (!n) {
        const el = s('g', { class: `obj t-${o.type}`, 'data-key': o.key });
        el.append(shapeFor({ ...o, pos: o.abs }));
        el.style.transform = `translate(${x}px, ${y - 14}px)`;
        el.style.opacity = '0';
        el.style.transitionDelay = `${Math.min(entering++, 8) * 45}ms`;
        n = { el, sig };
        nodes.set(o.key, n);
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = String(o.opacity ?? 1); el.style.transform = `translate(${x}px, ${y}px)`; }));
      } else {
        clearTimeout(n.timer);
        n.el.style.transitionDelay = '0ms';
        n.el.style.opacity = String(o.opacity ?? 1);
        n.el.style.transform = `translate(${x}px, ${y}px)`;
      }
      n.el.classList.toggle('accent', !!o.accent);
      const sc = n.el.querySelector('.scaler');
      if (sc) sc.style.transform = `scale(${o.size ?? 1})`;
      placeShadow(n.el, o);
      for (const r of n.el.querySelectorAll('.ring')) r.setAttribute('stroke', roleColor(o.role));
      if (layer.children[i] !== n.el) layer.insertBefore(n.el, layer.children[i] || null);
    });
  }

  // ---------- panels ----------
  function stepCard(lesson, i) {
    const st = lesson.steps[i];
    const last = i === lesson.steps.length - 1;
    return h('section', { class: 'card', 'aria-live': 'polite', 'data-step': st.id },
      h('span', { class: `tag ${st.tag}` }, T.tags[st.tag]),
      h('h3', { html: st.titleHtml }),
      h('p', { class: 'step-text', html: st.textHtml }),
      st.takeawayHtml ? h('p', { class: 'takeaway' }, h('b', {}, T.takeaway), ' ', h('span', { html: st.takeawayHtml })) : null,
      st.callout ? h('div', { class: `callout ${st.callout.kind}` }, h('b', {}, T.callouts[st.callout.kind]), h('span', { html: st.callout.html })) : null,
      st.widget ? widget(st.widget) : null,
      h('div', { class: 'nav' },
        h('button', { class: 'btn', id: 'prev', disabled: i === 0, onclick: () => go(lesson, i - 1) }, `← ${T.prev}`),
        h('button', { class: 'btn primary', id: 'next', onclick: () => go(lesson, i + 1) }, last ? `${T.toQuiz} →` : `${T.next} →`)));
  }

  function quizCard(lesson) {
    const k = `${lesson.chapter}/${lesson.id}`;
    const state = (store.quiz[k] ??= { answers: {}, done: false });
    const card = h('section', { class: 'card quiz', 'data-step': 'quiz' }, h('span', { class: 'tag' }, T.quiz));
    lesson.quiz.forEach((q, qi) => {
      const name = `q-${q.id}`;
      const fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
      const opts = q.optionsHtml.map((html, oi) => h('label', { class: 'opt' },
        h('input', { type: 'radio', name, value: oi, checked: state.answers[q.id] === oi }), h('span', { html })));
      const show = () => {
        const a = state.answers[q.id];
        if (a == null) return;
        opts.forEach((el, oi) => { el.classList.toggle('right', oi === q.answer); el.classList.toggle('wrong', oi === a && a !== q.answer); });
        fb.innerHTML = '';
        fb.append(h('b', { class: a === q.answer ? 'ok' : 'ko' }, a === q.answer ? T.correct : T.wrong), ' ', h('span', { html: q.explanationHtml }));
      };
      const check = h('button', { class: 'btn', onclick: () => {
        const sel = card.querySelector(`input[name="${name}"]:checked`);
        if (!sel) return;
        state.answers[q.id] = Number(sel.value);
        state.done = lesson.quiz.every((qq) => state.answers[qq.id] != null);
        save(); show(); renderTree();
      } }, T.check);
      card.append(h('div', { class: 'q', 'data-q': q.id }, h('p', { html: q.questionHtml }), ...opts, check, fb));
      show();
    });
    if ((lesson.furtherReading || []).length) {
      card.append(h('div', { class: 'further' }, h('p', { class: 'panel-title' }, T.further),
        h('ul', {}, lesson.furtherReading.map((r) => h('li', {},
          h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.title), ` — ${r.provider}`, h('br'), h('span', { class: 'why' }, r.why))))));
    }
    const idx = available.indexOf(lesson);
    const nextL = available[idx + 1];
    card.append(h('div', { class: 'nav' },
      h('button', { class: 'btn', id: 'prev', onclick: () => go(lesson, lesson.steps.length - 1) }, `← ${T.prev}`),
      nextL ? h('button', { class: 'btn primary', id: 'next', onclick: () => go(nextL, 0) }, `${T.nextLesson} →`) : h('span', { class: 'done-label' }, state.done ? T.done : '')));
    return card;
  }

  // ---------- annex: production sources, never shown inside steps ----------
  function renderAnnex() {
    renderTree();
    const blocks = D.chapters.flatMap((c) => c.lessons.filter((l) => l.available).map((l) => h('section', { class: 'card' },
      h('h3', {}, l.title), h('ul', { class: 'src' }, l.sources.map((x) => h('li', {},
        h('a', { href: x.url, target: '_blank', rel: 'noopener' }, x.title), ` (${T.accessed} ${x.accessed})`,
        x.supports ? h('span', { class: 'why' }, ` — ${x.supports}`) : null))))));
    stageCol.replaceChildren(h('div', { class: 'annex' },
      h('h1', {}, T.annex), h('p', {}, T.annexIntro),
      ...(D.referentials || []).map((r) => h('section', { class: 'card' }, h('h3', {}, T.referential),
        h('p', {}, h('a', { href: r.url, target: '_blank', rel: 'noopener' }, r.citation), ` (${T.accessed} ${r.accessed})`))),
      ...blocks,
      h('p', {}, h('a', { href: '#/' }, `← ${T.back}`))));
    panels.replaceChildren();
  }

  // ---------- widgets ----------
  const SYMBOLS = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];
  const sup = (n) => String(n).replace(/[0-9]/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  function widget(w) {
    if (w.type !== 'atom-builder') return null;
    const P = w.params || {};
    const st = { p: P.protons ?? 1, n: P.neutrons ?? 0, e: P.electrons ?? 1 };
    const max = { p: 20, n: 30, e: 20, ...(P.max || {}) };
    const out = h('div', { class: 'wout', 'aria-live': 'polite' });
    const row = (k) => {
      const val = h('output', {}, String(st[k]));
      const set = (d) => { st[k] = Math.max(0, Math.min(max[k], st[k] + d)); val.textContent = String(st[k]); show(); };
      return h('div', { class: 'wrow' }, h('span', {}, T.w[k === 'p' ? 'protons' : k === 'n' ? 'neutrons' : 'electrons']),
        h('button', { class: 'btn', 'aria-label': `${T.w.less}`, onclick: () => set(-1) }, '−'), val,
        h('button', { class: 'btn', 'aria-label': `${T.w.more}`, onclick: () => set(1) }, '+'));
    };
    function show() {
      const Z = st.p, A = st.p + st.n, q = st.p - st.e;
      const X = SYMBOLS[Z - 1];
      const charge = q === 0 || P.nucleusOnly ? '' : `${Math.abs(q) > 1 ? sup(Math.abs(q)) : ''}${q > 0 ? '⁺' : '⁻'}`;
      out.replaceChildren(
        Z && X ? h('span', { class: 'nuc' }, h('span', { class: 'ms' }, h('sup', {}, String(A)), h('sub', {}, String(Z))), X, charge) : h('span', {}, Z ? T.w.unknown : '—'),
        h('dl', {}, h('dt', {}, T.w.Z), h('dd', {}, String(Z)), h('dt', {}, T.w.A), h('dd', {}, String(A)),
          ...(P.nucleusOnly ? [] : [h('dt', {}, T.w.charge), h('dd', {}, q === 0 ? `0 (${T.w.neutral})` : `${q > 0 ? '+' : '−'}${Math.abs(q)} e (${q > 0 ? T.w.cation : T.w.anion})`)])));
    }
    show();
    return h('div', { class: 'widget', 'data-widget': w.type }, row('p'), row('n'), P.nucleusOnly ? null : row('e'), out);
  }

  function render() {
    if (location.hash.startsWith('#/sources')) return renderAnnex();
    const { lesson, step } = cur;
    renderTree();
    if (!lesson) {
      stageCol.replaceChildren(h('p', { class: 'empty' }, T.noLesson));
      panels.replaceChildren();
      return;
    }
    const quiz = step >= lesson.steps.length;
    const shown = lesson.steps[Math.min(step, lesson.steps.length - 1)];
    const k = `${lesson.chapter}/${lesson.id}`;
    if (!quiz) {
      const seen = new Set(store.seen[k] || []); seen.add(shown.id); store.seen[k] = [...seen]; save();
      renderTree();
    }
    const seen = new Set(store.seen[k] || []);
    const stage = h('div', { class: 'stage' }); stage.append(svg);
    stageCol.replaceChildren(
      h('div', { class: 'lesson-head' }, h('h1', { html: lesson.titleHtml }), !quiz && step === 0 ? h('p', { html: lesson.goalHtml }) : null),
      stage,
      h('div', { class: 'timeline', role: 'group', 'aria-label': T.step },
        lesson.steps.map((st, i) => h('button', {
          class: seen.has(st.id) ? 'seen' : null, 'aria-current': !quiz && i === step ? 'true' : null,
          'aria-label': `${T.step} ${i + 1}`, onclick: () => go(lesson, i),
        }, String(i + 1))),
        h('button', { class: 'quiz-dot', 'aria-current': quiz ? 'true' : null, onclick: () => go(lesson, lesson.steps.length) }, T.quiz)));
    renderScene(shown, lesson);
    const notation = h('section', { class: 'card notation' }, h('p', { class: 'panel-title' }, T.notation),
      h('ol', {}, lesson.notationHtml.map((html, i) => h('li', { class: !quiz && shown.notationLine === i ? 'on' : null, html }))));
    const counters = (shown.counters || []).length
      ? h('section', { class: 'card counters' }, h('p', { class: 'panel-title' }, T.counters),
        h('dl', {}, shown.counters.flatMap((c) => [h('dt', { html: c.labelHtml }), h('dd', { class: c.changed ? 'changed' : null }, `${c.value}${c.unit ? ' ' + c.unit : ''}`)])))
      : null;
    panels.replaceChildren(quiz ? quizCard(lesson) : stepCard(lesson, step), notation, counters || '');
  }

  addEventListener('hashchange', () => { if (!location.hash.startsWith('#/sources')) cur = parseHash(); render(); });
  addEventListener('keydown', (e) => {
    if (!cur.lesson || e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowRight' && cur.step < cur.lesson.steps.length) go(cur.lesson, cur.step + 1);
    if (e.key === 'ArrowLeft' && cur.step > 0) go(cur.lesson, cur.step - 1);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());

  applyTheme();
  cur = parseHash();
  render();
})();
