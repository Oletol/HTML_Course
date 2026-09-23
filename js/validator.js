/* ==================================================================
   validator.js – проверка кода студента.

   Код разбирается через DOMParser: документ строится, но скрипты не
   выполняются и ресурсы не загружаются. Поэтому проверка безопасна.

   Каждое требование шага – объект:
     { id, label, test(ctx), where(ctx)?, hints[] }
   test  – выполнено ли требование;
   where – номер строки, к которой относится требование (для подсветки),
           или null, если показать нечего.

   ctx:
     ctx.doc          – разобранный документ (браузер уже «достроил»
                        пропущенные html/head/body!)
     ctx.raw          – исходный текст
     ctx.clean        – текст без HTML-комментариев (строки сохранены)
     ctx.q(sel)       – первый элемент или null
     ctx.qa(sel)      – массив элементов
     ctx.text(sel)    – текст элемента без крайних пробелов
     ctx.wrote(tag)   – открывающий тег написан вручную
     ctx.closed(tag)  – закрывающий тег написан вручную
     ctx.pos(re)      – позиция первого совпадения в clean или -1
     ctx.lineOf(re)   – номер строки первого совпадения или null

   Кроме требований, analyze() ищет типичные ошибки набора
   (diagnose): опечатки в тегах, атрибутах и значениях, незакрытые
   кавычки и угловые скобки, лишние закрывающие теги у пустых элементов.
   ================================================================== */

export function stripComments(code) {
  return code.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
}

function lineAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

export function makeContext(code) {
  const raw = String(code ?? '');
  const clean = stripComments(raw);
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  return {
    doc, raw, clean,
    q: sel => doc.querySelector(sel),
    qa: sel => Array.from(doc.querySelectorAll(sel)),
    text: sel => (doc.querySelector(sel)?.textContent || '').trim(),
    wrote: tag => new RegExp(`<${tag}(?=[\\s>/])`, 'i').test(clean),
    closed: tag => new RegExp(`</${tag}\\s*>`, 'i').test(clean),
    pos: re => { const m = clean.match(re); return m ? m.index : -1; },
    lineOf: re => { const m = clean.match(re); return m ? lineAt(clean, m.index) : null; }
  };
}

/* ---------- Справочники для поиска опечаток ---------- */
const KNOWN_TAGS = new Set(('a abbr address area article aside audio b base bdi bdo blockquote body br button ' +
  'canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset ' +
  'figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd label ' +
  'legend li link main map mark menu meta meter nav noscript object ol optgroup option output p picture pre ' +
  'progress q rp rt ruby s samp script search section select slot small source span strong style sub summary ' +
  'sup svg table tbody td template textarea tfoot th thead time title tr track u ul var video wbr math').split(' '));

const KNOWN_ATTRS = ('accept action alt async autocomplete autofocus charset checked cite class cols colspan ' +
  'content controls coords crossorigin datetime decoding default defer dir disabled download draggable enctype ' +
  'for form headers height hidden high href hreflang id inert inputmode integrity label lang list loading loop ' +
  'low max maxlength media method min minlength multiple muted name novalidate open optimum pattern placeholder ' +
  'poster preload readonly referrerpolicy rel required reversed role rows rowspan sandbox scope selected size ' +
  'sizes span spellcheck src srcdoc srclang srcset start step style tabindex target title translate type ' +
  'usemap value width wrap').split(' ');

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'source', 'track', 'wbr']);

const META_NAMES = ['viewport', 'description', 'author', 'keywords', 'robots', 'theme-color',
  'color-scheme', 'generator', 'referrer', 'application-name'];

function distance(a, b) {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function closest(word, list) {
  const w = word.toLowerCase();
  const limit = w.length <= 4 ? 1 : 2;
  let best = null, bestD = Infinity;
  for (const cand of list) {
    const d = distance(w, cand);
    if (d < bestD) { bestD = d; best = cand; }
  }
  return bestD > 0 && bestD <= limit ? best : null;
}

/* ---------- Поиск типичных ошибок набора ---------- */
export function diagnose(code) {
  const clean = stripComments(String(code ?? ''));
  const out = [];
  const add = (index, message) => out.push({ line: lineAt(clean, index), message });

  /* Объявление типа документа */
  const dt = clean.match(/<!doctype[^>]*>/i);
  if (dt && !/^<!doctype\s+html\s*>$/i.test(dt[0])) {
    add(dt.index, `Объявление записано с ошибкой: \`${dt[0]}\`. Правильно: \`<!DOCTYPE html>\`.`);
  }

  /* Незакрытые угловые скобки: после «<тег» встречается новая «<» раньше, чем «>» */
  const tagStart = /<\/?[a-zA-Z][\w-]*/g;
  let m;
  while ((m = tagStart.exec(clean))) {
    const gt = clean.indexOf('>', m.index + 1);
    const lt = clean.indexOf('<', m.index + 1);
    if (gt === -1 || (lt !== -1 && lt < gt)) {
      add(m.index, `Тег \`${m[0]}\` не закрыт угловой скобкой \`>\`.`);
    }
  }

  /* Каждый тег целиком: имя, атрибуты, кавычки */
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^<>]*)>/g;
  while ((m = tagRe.exec(clean))) {
    const [whole, slash, rawName, rest] = m;
    const name = rawName.toLowerCase();

    if (!KNOWN_TAGS.has(name) && !name.includes('-')) {
      const guess = closest(name, KNOWN_TAGS);
      add(m.index, guess
        ? `Тега \`<${slash}${rawName}>\` нет в HTML. Может быть, \`<${slash}${guess}>\`?`
        : `Браузер не знает тега \`<${slash}${rawName}>\`.`);
      continue;
    }

    if (slash && VOID_TAGS.has(name)) {
      add(m.index, `У \`<${name}>\` нет закрывающего тега – \`</${name}>\` можно удалить.`);
      continue;
    }
    if (slash) continue;

    if ((rest.match(/"/g) || []).length % 2 === 1) {
      add(m.index, `В теге \`<${rawName}>\` не закрыта кавычка.`);
      continue;
    }

    const attrRe = /([^\s"'=<>\/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+))?/g;
    let a;
    while ((a = attrRe.exec(rest))) {
      const attr = a[1].toLowerCase();
      const value = (a[3] ?? a[4] ?? a[2] ?? '').trim();
      if (!attr.includes('-') && !KNOWN_ATTRS.includes(attr)) {
        const guess = closest(attr, KNOWN_ATTRS);
        if (guess) add(m.index, `Атрибута \`${a[1]}\` нет. Может быть, \`${guess}\`?`);
      }
      if (name === 'meta' && attr === 'name' && value && !META_NAMES.includes(value.toLowerCase())) {
        const guess = closest(value, META_NAMES);
        if (guess) add(m.index, `\`${value}\` – похоже на опечатку. Может быть, \`${guess}\`?`);
      }
      if (name === 'meta' && attr === 'charset' && value && value.toLowerCase() !== 'utf-8') {
        add(m.index, `Кодировка записана как \`${value}\`. Правильно: \`utf-8\`, через дефис.`);
      }
    }
  }

  /* Одна запись на строку и сообщение, по порядку строк */
  const seen = new Set();
  return out
    .filter(d => { const k = d.line + d.message; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => x.line - y.line)
    .slice(0, 6);
}

export function analyze(code, checks) {
  const ctx = makeContext(code);
  const results = checks.map(c => {
    let ok = false, line = null;
    try { ok = Boolean(c.test(ctx)); } catch { ok = false; }
    if (!ok && c.where) { try { line = c.where(ctx) ?? null; } catch { line = null; } }
    return { id: c.id, ok, line };
  });
  return { results, diagnostics: diagnose(code) };
}

/* Совместимость: только результаты требований */
export function runChecks(code, checks) {
  return analyze(code, checks).results;
}

/* ---------- Сравнение двух вариантов кода по строкам ----------
   Возвращает номера строк варианта b, которых нет в варианте a
   (пробелы, регистр и вид кавычек не учитываются). */
export function changedLines(a, b) {
  const norm = s => s.trim().replace(/\s+/g, ' ').replace(/\s*([<>])\s*/g, '$1')
    .replace(/'/g, '"').toLowerCase();
  const A = String(a).split('\n').map(norm);
  const B = String(b).split('\n').map(norm);
  const n = A.length, k = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(k + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = k - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const kept = new Set();
  let i = 0, j = 0;
  while (i < n && j < k) {
    if (A[i] === B[j]) { kept.add(j); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const out = [];
  B.forEach((line, idx) => { if (line && !kept.has(idx)) out.push(idx + 1); });
  return out;
}
