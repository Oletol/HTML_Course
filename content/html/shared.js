/* ==================================================================
   content/html/shared.js – общие требования и помощники для шагов HTML.

   Каждый следующий шаг продолжает страницу студента из предыдущего:
   в шаге указывается starter: 'previous', и редактор открывается
   с кодом, который студент сдал на прошлом шаге.

   skeleton        – требование «скелет из шага 1 на месте»
   texts(c, sel)   – тексты элементов (без угловых скобок)
   page(c, lines)  – собрать документ: голова (с названием студента) + тело
   appendToBody(c, lines) – добавить строки в конец body студента;
                     если скелет сломан, документ собирается заново
   ================================================================== */

export const FALLBACK_START = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Главная – Мой проект</title>
  </head>
  <body>
    Мой проект
  </body>
</html>`;

export const skeleton = {
  id: 'skeleton',
  label: 'Скелет из шага 1 на месте: `<!DOCTYPE html>`, `lang="ru"`, `charset`, `viewport`, `title`',
  test: c => /^\s*<!doctype\s+html\s*>/i.test(c.clean) &&
    /^ru(-|$)/i.test(c.doc.documentElement.getAttribute('lang') || '') &&
    c.wrote('head') && c.closed('head') && c.wrote('body') && c.closed('body') &&
    Boolean(c.doc.head.firstElementChild?.matches('meta[charset]')) &&
    Boolean(c.q('head > meta[name="viewport" i]')) &&
    c.text('head > title').length >= 3,
  where: c => (c.wrote('head') ? null : 1),
  hints: [
    'Эти элементы проверялись в шаге 1. Сравните начало своего кода с образцом из теории шага 1.',
    'Порядок такой: объявление, `<html lang="ru">`, в `head` сначала `meta charset`, затем `meta viewport` и `title`; видимое содержимое – в `body`.',
    'Если скелет повреждён, нажмите «Начать заново»: редактор откроется с кодом, сданным в шаге 1.'
  ]
};

const safe = t => String(t || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

export function texts(c, sel, minLength = 1) {
  return c.qa(sel).map(el => safe(el.textContent)).filter(t => t.length >= minLength);
}

function titleOf(c) {
  const t = safe(c.text('head > title'));
  return t.length >= 3 && !/^document$/i.test(t) ? t : 'Главная – Мой проект';
}

export function page(c, bodyLines) {
  return [
    '<!DOCTYPE html>',
    '<html lang="ru">',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <meta name="viewport" content="width=device-width, initial-scale=1">',
    `    <title>${titleOf(c)}</title>`,
    '  </head>',
    '  <body>',
    ...bodyLines.map(l => (l ? '    ' + l : '')),
    '  </body>',
    '</html>'
  ].join('\n');
}

export function appendToBody(c, lines) {
  const block = lines.map(l => (l ? '    ' + l : '')).join('\n');
  if (skeleton.test(c)) {
    const i = c.raw.search(/<\/body\s*>(?![\s\S]*<\/body\s*>)/i);
    if (i !== -1) {
      const before = c.raw.slice(0, i).replace(/[ \t]*$/, '');
      return before + (before.endsWith('\n') ? '' : '\n') + block + '\n  ' + c.raw.slice(i);
    }
  }
  const inner = (c.clean.match(/<body[^>]*>([\s\S]*?)(<\/body\s*>|$)/i)?.[1] || '')
    .split('\n').map(l => l.trim()).filter(Boolean);
  return page(c, [...inner, ...lines]);
}

export { safe };

/* Свободный текст прямо в body (например, строка из шага 1) */
export function looseText(c) {
  const n = [...(c.doc.body?.childNodes || [])].find(x => x.nodeType === 3 && x.textContent.trim());
  return n ? safe(n.textContent.trim().split('\n')[0]) : '';
}

/* Если требования прошлого шага не выполнены, сначала применить его решение */
export function baseFor(c, prevStep, makeContext) {
  const ok = prevStep.checks.every(ch => { try { return ch.test(c); } catch { return false; } });
  return ok ? c : makeContext(prevStep.solution(c));
}

/* Требование «сделанное на прошлых шагах сохранено».
   test проверяет наличие элементов, what перечисляет их для студента. */
export function previousKept(stepNo, what, test) {
  return {
    id: 'previous',
    label: `Сохранено сделанное на прошлых шагах: ${what}`,
    test,
    where: () => null,
    hints: [
      'Элементы, созданные в прошлых шагах, должны остаться на странице: новое задание их дополняет.',
      `Проверьте, что на странице есть: ${what}.`,
      `Если структура нарушена, нажмите «Начать заново»: редактор откроется с кодом, сданным в шаге ${stepNo}.`
    ]
  };
}

/* Номер строки, где встречается фрагмент текста */
export function lineOfText(c, fragment) {
  if (!fragment) return null;
  const i = c.clean.indexOf(fragment);
  return i >= 0 ? c.clean.slice(0, i).split('\n').length : null;
}

/* ---------- Чистка head ----------
   Невидимые символы (неразрывный пробел с Option/Alt+Пробел, пробел
   нулевой ширины) и любой текст или элемент, которому не место в head,
   заставляют браузер закрыть head раньше: всё, что ниже, попадает в body,
   и проверки вида «head > meta» не находят метатеги, хотя на экране
   код выглядит правильным. cleanHead убирает такое содержимое из head,
   чтобы решение шага гарантированно проходило проверку. */
export const INVISIBLE = /[\u00A0\u1680\u2000-\u200D\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]/g;
const HEAD_OK = /^(?:<(meta|link|base)\b[^>]*>|<(title|style|script|noscript|template)\b[^>]*>[\s\S]*?<\/\2\s*>|<!--[\s\S]*?-->|[ \t\r\n]+)/i;

export function cleanHead(raw) {
  const open = raw.match(/<head\b[^>]*>/i);
  const close = raw.match(/<\/head\s*>/i);
  if (!open || !close || close.index < open.index) return raw;
  const from = open.index + open[0].length;
  let inner = raw.slice(from, close.index).replace(INVISIBLE, ' ');
  let kept = '';
  while (inner.length) {
    const m = inner.match(HEAD_OK);
    if (m) { kept += m[0]; inner = inner.slice(m[0].length); continue; }
    /* лишний фрагмент: до следующего тега или конца строки */
    const next = inner.slice(1).search(/<|\n/);
    inner = next === -1 ? '' : inner.slice(next + 1);
  }
  kept = kept.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return raw.slice(0, from) + kept + raw.slice(close.index);
}
