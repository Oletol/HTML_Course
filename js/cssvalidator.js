/* ==================================================================
   cssvalidator.js – проверка шагов модулей CSS.

   Три слоя:
   1. Синтаксис. Собственный разбор таблицы стилей с номерами строк:
      скобки, двоеточия, точки с запятой. Свойства, значения и селекторы
      проверяет сам браузер (CSS.supports), поэтому список известных
      свойств всегда соответствует текущему браузеру.
   2. Правила. Требования шага читают разобранное дерево:
      какие селекторы и объявления написаны.
   3. Результат. Страница отрисовывается в невидимом изолированном окне
      заданной ширины, и требование измеряет итог: вычисленные стили,
      размеры, контраст. Решение засчитывается по результату,
      даже если записано иначе, чем в образце.

   Требование шага:
     { id, label, test: async ctx => bool, where: ctx => ({ file, line }) | null, hints[] }
   ctx:
     ctx.html        – контекст HTML (как в validator.js: doc, q, qa, lineOf…)
     ctx.css         – { text, tree, rules, decls, lineOf(re) }
     ctx.measure(w)  – Promise<{ doc, q, qa, cs(el|sel), rect(el|sel) }> для ширины w
   ================================================================== */

import { makeContext, diagnose as diagnoseHtml } from './validator.js';
import { buildDocument } from './preview.js';
import { NAMED } from './colors.js';

/* ---------- Разбор ---------- */
export function stripCssComments(text) {
  return String(text ?? '').replace(/\/\*[\s\S]*?(\*\/|$)/g, m => m.replace(/[^\n]/g, ' '));
}

const lineAt = (text, i) => text.slice(0, i).split('\n').length;

export function parseCss(text) {
  const src = stripCssComments(text);
  const root = { type: 'root', children: [], decls: [], line: 1 };
  const stack = [root];
  const errors = [];
  let buf = '';
  let bufStart = -1;
  let paren = 0;
  let quote = null;

  const top = () => stack[stack.length - 1];
  const flushDecl = () => {
    const raw = buf;
    const start = bufStart;
    buf = ''; bufStart = -1;
    if (!raw.trim()) return;
    const node = top();
    const lead = raw.length - raw.trimStart().length;
    const line = lineAt(src, start + lead);
    if (node.type === 'root') {
      if (raw.trim().startsWith('@')) node.children.push({ type: 'at-statement', prelude: raw.trim(), line });
      else errors.push({ line, kind: 'stray', text: raw.trim() });
      return;
    }
    const i = raw.indexOf(':');
    if (i === -1) { errors.push({ line, kind: 'no-colon', text: raw.trim() }); return; }
    const prop = raw.slice(0, i).trim();
    let value = raw.slice(i + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    value = value.replace(/!\s*important\s*$/i, '').trim();
    node.decls.push({ prop, value, important, line, raw: raw.trim() });
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quote) { buf += ch; if (ch === quote && src[i - 1] !== '\\') quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; if (bufStart < 0) bufStart = i; buf += ch; continue; }
    if (ch === '(') paren++;
    if (ch === ')') paren = Math.max(0, paren - 1);

    if (ch === '{' && paren === 0) {
      const prelude = buf.trim();
      const lead = buf.length - buf.trimStart().length;
      const line = bufStart >= 0 ? lineAt(src, bufStart + lead) : lineAt(src, i);
      const node = { type: prelude.startsWith('@') ? 'at' : 'rule', prelude, line, decls: [], children: [], parent: top() };
      top().children.push(node);
      stack.push(node);
      buf = ''; bufStart = -1;
      continue;
    }
    if (ch === '}' && paren === 0) {
      flushDecl();
      if (stack.length === 1) errors.push({ line: lineAt(src, i), kind: 'extra-brace' });
      else stack.pop();
      continue;
    }
    if (ch === ';' && paren === 0) { flushDecl(); continue; }
    if (bufStart < 0 && !/\s/.test(ch)) bufStart = i;
    buf += ch;
  }
  if (buf.trim()) {
    if (stack.length > 1) flushDecl();
    else errors.push({ line: lineAt(src, bufStart), kind: 'stray', text: buf.trim() });
  }
  for (let k = stack.length - 1; k > 0; k--) errors.push({ line: stack[k].line, kind: 'unclosed', text: stack[k].prelude });

  /* Плоский список правил и объявлений с контекстом (@media и т. п.) */
  const rules = [];
  const decls = [];
  const walk = (node, context) => {
    for (const ch of node.children) {
      if (ch.type === 'rule') {
        const selectors = splitSelectors(ch.prelude);
        const rule = { ...ch, selectors, context };
        rules.push(rule);
        ch.decls.forEach(d => decls.push({ ...d, rule, context }));
        walk(ch, context);
      } else if (ch.type === 'at') {
        ch.decls.forEach(d => decls.push({ ...d, rule: ch, context: [...context, ch.prelude] }));
        walk(ch, [...context, ch.prelude]);
      }
    }
  };
  walk(root, []);
  return { text: String(text ?? ''), clean: src, tree: root, rules, decls, errors };
}

export function splitSelectors(prelude) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of prelude) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/* ---------- Справочники браузера ---------- */
let PROPS = null;
function knownProps() {
  if (PROPS) return PROPS;
  const set = new Set();
  const style = document.documentElement.style;
  for (const k in style) {
    if (/^\d+$/.test(k) || typeof style[k] !== 'string') continue;
    const kebab = k.replace(/^webkit/, '-webkit-').replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    if (!kebab.startsWith('-webkit-')) set.add(kebab);
  }
  PROPS = [...set];
  return PROPS;
}

function distance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return dp[b.length];
}
function closest(word, list) {
  const limit = word.length <= 5 ? 1 : 2;
  let best = null, bestD = Infinity;
  for (const c of list) { const d = distance(word, c); if (d < bestD) { bestD = d; best = c; } }
  return bestD > 0 && bestD <= limit ? best : null;
}

const AT_RULES = ['media', 'container', 'supports', 'layer', 'font-face', 'keyframes', 'import', 'property',
  'page', 'namespace', 'charset', 'scope', 'starting-style', 'counter-style', 'font-feature-values'];
const DESCRIPTOR_BLOCKS = /^@(font-face|page|property|counter-style|font-feature-values)\b/i;
const UNITLESS = new Set(['line-height', 'font-weight', 'opacity', 'z-index', 'flex-grow', 'flex-shrink', 'order',
  'flex', 'scale', 'aspect-ratio', 'zoom', 'orphans', 'widows', 'tab-size', 'animation-iteration-count',
  'column-count', 'fill-opacity', 'stroke-opacity', 'grid-row', 'grid-column', 'grid-row-start', 'grid-row-end',
  'grid-column-start', 'grid-column-end', 'counter-increment', 'counter-reset', 'initial-letter']);
const PSEUDO_ELEMENTS = /::?(before|after|placeholder|marker|selection|first-line|first-letter|backdrop|file-selector-button|cue|part\([^)]*\)|slotted\([^)]*\))/gi;

const insideKeyframes = node => { for (let n = node; n; n = n.parent) if (/^@(-webkit-)?keyframes\b/i.test(n.prelude || '')) return true; return false; };
const insideDescriptors = node => { for (let n = node; n; n = n.parent) if (DESCRIPTOR_BLOCKS.test(n.prelude || '')) return true; return false; };

/* ---------- Диагностика синтаксиса ---------- */
export function diagnoseCss(text) {
  const parsed = parseCss(text);
  const out = [];
  const add = (line, message) => out.push({ file: 'css', line, message });

  for (const e of parsed.errors) {
    if (e.kind === 'unclosed') add(e.line, `Не закрыта фигурная скобка у \`${e.text || 'правила'}\`: не хватает \`}\`.`);
    else if (e.kind === 'extra-brace') add(e.line, 'Лишняя закрывающая скобка `}`.');
    else if (e.kind === 'no-colon') add(e.line, `Пропущено двоеточие между свойством и значением: \`${e.text}\`.`);
    else if (e.kind === 'stray') add(e.line, `Объявление \`${e.text}\` стоит вне фигурных скобок правила.`);
  }

  const visit = node => {
    for (const ch of node.children) {
      if (ch.type === 'at' || ch.type === 'at-statement') {
        const name = (ch.prelude.match(/^@([\w-]+)/) || [])[1]?.toLowerCase();
        if (name && !AT_RULES.includes(name) && !name.startsWith('-webkit-')) {
          const guess = closest(name, AT_RULES);
          add(ch.line, guess ? `Директивы \`@${name}\` нет. Может быть, \`@${guess}\`?` : `Директива \`@${name}\` не распознана.`);
        }
      }
      if (ch.type === 'rule' && !insideKeyframes(ch)) {
        for (const sel of splitSelectors(ch.prelude)) {
          if (sel.includes('&')) continue;
          const test = sel.replace(PSEUDO_ELEMENTS, '').trim() || '*';
          let ok = true;
          try { ok = CSS.supports(`selector(${test})`); } catch { ok = false; }
          if (!ok) add(ch.line, `Селектор \`${sel}\` записан с ошибкой или не поддерживается.`);
        }
      }
      if (ch.type !== 'at-statement') {
        if (!insideDescriptors(ch)) ch.decls.forEach(d => checkDecl(d));
        visit(ch);
      }
    }
  };

  function checkDecl(d) {
    const prop = d.prop.toLowerCase();
    if (prop.startsWith('--')) return;
    if (/\n\s*[a-z-]+\s*:/i.test(d.value)) {
      add(d.line, `Пропущена точка с запятой после \`${d.prop}: ${d.value.split('\n')[0].trim()}\`.`);
      return;
    }
    if (/\s/.test(d.prop)) { add(d.line, `Свойство записано с пробелом: \`${d.prop}\`.`); return; }
    if (!CSS.supports(prop, 'inherit')) {
      const guess = closest(prop, knownProps());
      add(d.line, guess ? `Свойства \`${d.prop}\` нет. Может быть, \`${guess}\`?` : `Свойство \`${d.prop}\` не распознано.`);
      return;
    }
    if (!d.value) { add(d.line, `У свойства \`${d.prop}\` нет значения.`); return; }
    if (/\b(var|env|attr)\(/i.test(d.value)) return;
    if (CSS.supports(prop, d.value)) return;
    if (/^-?\d*\.?\d+$/.test(d.value) && Number(d.value) !== 0 && !UNITLESS.has(prop)) {
      add(d.line, `Число без единицы измерения: \`${d.prop}: ${d.value}\`. Добавьте единицу, например \`${d.value}px\` или \`${d.value}rem\`.`);
      return;
    }
    if (/^[a-z]+$/i.test(d.value) && /color|background|border|outline|fill|stroke|caret|accent/i.test(prop)) {
      const guess = closest(d.value.toLowerCase(), Object.keys(NAMED));
      if (guess) { add(d.line, `Цвета \`${d.value}\` нет в CSS. Может быть, \`${guess}\`?`); return; }
    }
    add(d.line, `Значение \`${d.value}\` не подходит для свойства \`${d.prop}\`.`);
  }

  visit(parsed.tree);
  const seen = new Set();
  return out.filter(d => { const k = d.line + d.message; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.line - b.line);
}

/* ---------- Измерение отрисованной страницы ---------- */
function createMeasurer(html, css, settings) {
  const cache = new Map();
  const frames = [];
  async function measure(width = 1280, extra = {}) {
    const s = { ...settings, ...extra, width };
    const key = JSON.stringify(s);
    if (cache.has(key)) return cache.get(key);
    const promise = new Promise(resolve => {
      const f = document.createElement('iframe');
      f.setAttribute('sandbox', 'allow-same-origin');
      f.setAttribute('aria-hidden', 'true');
      f.tabIndex = -1;
      f.style.cssText = `position:fixed;left:-20000px;top:0;width:${width}px;height:900px;border:0;visibility:hidden;pointer-events:none`;
      frames.push(f);
      f.addEventListener('load', async () => {
        const doc = f.contentDocument;
        const win = f.contentWindow;
        try { await doc.fonts?.ready; } catch { /* ничего */ }
        const el = x => (typeof x === 'string' ? doc.querySelector(x) : x);
        resolve({
          doc, win, width,
          q: sel => doc.querySelector(sel),
          qa: sel => [...doc.querySelectorAll(sel)],
          cs: (x, pseudo) => { const e = el(x); return e ? win.getComputedStyle(e, pseudo || null) : null; },
          rect: x => { const e = el(x); return e ? e.getBoundingClientRect() : null; }
        });
      }, { once: true });
      f.srcdoc = buildDocument(html, css, s);
      document.body.append(f);
    });
    cache.set(key, promise);
    return promise;
  }
  measure.dispose = () => frames.forEach(f => f.remove());
  return measure;
}

/* ---------- Анализ шага ---------- */
export async function analyzeCss({ html, css, checks, settings = {} }) {
  const parsed = parseCss(css);
  const htmlCtx = makeContext(html);
  const measure = createMeasurer(html, css, { theme: settings.theme, motion: settings.motion, dir: settings.dir });
  const cssCtx = {
    ...parsed,
    lineOf: re => { const m = parsed.clean.match(re); return m ? lineAt(parsed.clean, m.index) : null; }
  };
  const ctx = { html: htmlCtx, css: cssCtx, measure };

  const results = [];
  for (const c of checks) {
    let ok = false, where = null;
    try { ok = Boolean(await c.test(ctx)); } catch (err) { console.warn('Проверка', c.id, err); ok = false; }
    if (!ok && c.where) { try { where = c.where(ctx) ?? null; } catch { where = null; } }
    if (typeof where === 'number') where = { file: 'css', line: where };
    results.push({ id: c.id, ok, line: where?.line ?? null, file: where?.file ?? null });
  }
  measure.dispose();

  const diagnostics = [
    ...diagnoseHtml(html).map(d => ({ ...d, file: 'html' })),
    ...diagnoseCss(css)
  ];
  return { results, diagnostics };
}
