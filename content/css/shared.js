/* ==================================================================
   content/css/shared.js – общие помощники для шагов модулей CSS.

   Шаг CSS описывает два файла: files: ['html', 'css'].
   starter: { html: 'previous' | 'html-module', css: 'previous' | '' }
     'html-module' – код, сданный на последнем учебном шаге модуля HTML;
     'previous'    – код, сданный на предыдущем шаге модуля CSS.
   solution(ctx) возвращает { html, css }.
   ================================================================== */

import { BASE_PAGE } from './base-page.js';
export { BASE_PAGE };

/* Правила, у которых хотя бы один селектор проходит проверку */
export function rulesFor(c, test) {
  const t = typeof test === 'string' ? (s => s.trim() === test) : test instanceof RegExp ? (s => test.test(s)) : test;
  return c.css.rules.filter(r => r.selectors.some(t));
}

/* Объявление свойства в правилах для селектора (последнее по порядку) */
export function declFor(c, selector, prop) {
  const list = rulesFor(c, selector).flatMap(r => r.decls.filter(d => d.prop.toLowerCase() === prop));
  return list[list.length - 1] || null;
}

export const cssLine = (c, re) => {
  const l = c.css.lineOf(re);
  return l ? { file: 'css', line: l } : null;
};
export const htmlLine = (c, re) => {
  const l = c.html.lineOf(re);
  return l ? { file: 'html', line: l } : null;
};

/* Требование «таблица стилей без синтаксических ошибок» проверяет
   слой диагностики; здесь – «подключение style.css на месте». */
export const STYLE_LINK = /<link\b[^>]*rel\s*=\s*["']?[^"'>]*stylesheet[^>]*href\s*=\s*["']?(?:\.\/)?style\.css|<link\b[^>]*href\s*=\s*["']?(?:\.\/)?style\.css[^>]*rel\s*=\s*["']?[^"'>]*stylesheet/i;

export const linked = {
  id: 'linked',
  label: 'Таблица стилей подключена: `<link rel="stylesheet" href="style.css">` в `head`',
  test: c => c.html.qa('head > link').some(l => /(^|\s)stylesheet(\s|$)/i.test(l.getAttribute('rel') || '') &&
    /^(\.\/)?style\.css$/.test((l.getAttribute('href') || '').trim())),
  where: c => htmlLine(c, /<\/head\s*>/i),
  hints: [
    'Стили из вкладки `style.css` применяются, только если страница подключает этот файл.',
    'В `head` нужен пустой элемент `link` с двумя атрибутами: `rel="stylesheet"` и `href="style.css"`.',
    'Образец: `<link rel="stylesheet" href="style.css">` перед строкой `</head>`.'
  ]
};

/* Вставить строку перед </head> */
export function addToHead(html, line) {
  return html.replace(/\n?([ \t]*)<\/head\s*>/i, (m, pad) => `\n${pad}  ${line}\n${pad}</head>`);
}

/* Цвет, вычисленный браузером, в виде { r, g, b, a } */
export function rgbOf(value) {
  const m = String(value || '').match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
}
