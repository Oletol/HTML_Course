/* ==================================================================
   Шаг css-04 · Современные селекторы
   Модуль «CSS: оформление». Продолжает оба файла шага css-03
   (starter: previous для HTML и CSS).

   Что делает студент:
   – оформляет h2 и h3 внутри main одним селектором с :is();
   – задаёт отступ списков селектором :where() с нулевым весом;
   – разделяет пункты списков отступом, кроме последнего, через :not();
   – выделяет фоном раздел с таблицей через :has().

   Проверки по результату смотрят, какие элементы выбирает селектор
   на отрисованной странице: :not() должен действительно исключать
   часть элементов, :has() – выбирать только разделы с таблицей.
   ================================================================== */

import { diagnoseCss } from '../../js/cssvalidator.js';
import { linked, syntax, cssLine, addToHead, STYLE_LINK, pick } from './shared.js';

const lastLine = c => ({ file: 'css', line: Math.max(1, c.css.text.split('\n').length) });

/* Правило с объявлениями, хотя бы один селектор которого проходит проверку */
const someSelector = (c, test) => c.css.rules.some(r => r.decls.length > 0 && r.selectors.some(test));

/* Селектор без псевдокласса :not(…) – чтобы сравнить, кого он исключил */
const withoutNot = s => s.replace(/:not\((?:[^()]|\([^()]*\))*\)/gi, '').trim() || '*';

/* Цвет фона: прозрачный фон считается отсутствием фона */
const isTransparent = bg => !bg || bg === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(bg);

/* Новые правила для правильного варианта */
const BASE_RULES = [
  '@layer base {',
  '  /* Отступ списков: :where() не добавляет веса, класс легко его перекроет */',
  '  :where(ul, ol) {',
  '    padding-inline-start: 1.5em;',
  '  }',
  '}'
].join('\n');

const COMPONENT_RULES = [
  '@layer components {',
  '  /* Заголовки разделов */',
  '  main :is(h2, h3) {',
  '    color: #1A40E7;',
  '  }',
  '',
  '  /* Интервал между пунктами, кроме последнего */',
  '  li:not(:last-child) {',
  '    margin-block-end: 0.25em;',
  '  }',
  '',
  '  /* Раздел, в котором есть таблица */',
  '  section:has(table) {',
  '    background-color: #F3F5FE;',
  '  }',
  '}'
].join('\n');

export default {
  title: 'Современные селекторы',
  files: ['html', 'css'],

  theory: `
<h2>Современные селекторы</h2>
<p class="lead">Псевдоклассы <code>:is()</code>, <code>:where()</code>, <code>:not()</code> и <code>:has()</code> принимают список селекторов в скобках. Они сокращают длинные группы, управляют весом правил и позволяют выбрать элемент по его содержимому – задачу, которая раньше решалась только скриптом.</p>

<h3>Псевдокласс :is()</h3>
<p><code>:is()</code> подходит к элементу, если к нему подходит любой селектор из списка. Он сокращает группы, в которых повторяется общая часть.</p>
<pre><code>/* Группа из шага 2 */
main h2,
main h3 {
  color: #1A40E7;
}

/* То же через :is() */
main :is(h2, h3) {
  color: #1A40E7;
}</code></pre>
<p>Вес <code>:is()</code> равен весу самого тяжёлого селектора в скобках: <code>:is(h2, .title)</code> весит 0, 1, 0 даже для элемента <code>h2</code> без класса. Список в скобках прощает ошибки: неверный селектор отбрасывается, остальные продолжают действовать. Обычная группа через запятую при ошибке в одном селекторе отбрасывается целиком.</p>

<h3>Псевдокласс :where()</h3>
<p><code>:where()</code> выбирает те же элементы, что и <code>:is()</code>, но его вес всегда нулевой, что бы ни стояло в скобках. Такие правила задают умолчания, которые перекрывает любой класс.</p>
<pre><code>:where(ul, ol) {
  padding-inline-start: 1.5em;
}

.nav-list {
  padding-inline-start: 0;  /* 0, 1, 0 больше 0, 0, 0 */
}</code></pre>
<p>Свойство <code>padding-inline-start</code> – логический аналог отступа слева, подробно логические свойства рассматриваются в шаге «Блочная модель и логические свойства». <code>:where()</code> – основа современного сброса стилей, о нём следующий шаг.</p>

<h3>Псевдокласс :not()</h3>
<p><code>:not()</code> исключает элементы, к которым подходит селектор в скобках. Вместо двух правил – общего и отменяющего – пишется одно.</p>
<pre><code>/* Интервал между пунктами, кроме последнего */
li:not(:last-child) {
  margin-block-end: 0.25em;
}

/* Ссылки, ведущие за пределы страницы */
a:not([href^="#"]) {
  text-underline-offset: 0.2em;
}</code></pre>
<p>В скобках можно перечислить несколько селекторов: <code>p:not(.lead, .note)</code> выбирает абзацы без обоих классов. Вес <code>:not()</code>, как и у <code>:is()</code>, равен весу самого тяжёлого селектора в скобках. Псевдокласс <code>:last-child</code> выбирает элемент, последний среди детей своего родителя, <code>:first-child</code> – первый.</p>

<h3>Псевдокласс :has()</h3>
<p><code>:has()</code> выбирает элемент по тому, что находится внутри него или после него. Селектор в скобках отсчитывается от самого элемента.</p>
<table class="rubric">
  <caption>Примеры :has()</caption>
  <thead>
    <tr><th scope="col">Селектор</th><th scope="col">Что выбирает</th></tr>
  </thead>
  <tbody>
    <tr><td><code>section:has(table)</code></td><td>разделы, в которых есть таблица</td></tr>
    <tr><td><code>figure:has(figcaption)</code></td><td>иллюстрации с подписью</td></tr>
    <tr><td><code>h2:has(+ p)</code></td><td>заголовки, за которыми сразу идёт абзац</td></tr>
    <tr><td><code>p:has(&gt; a)</code></td><td>абзацы, в которых ссылка вложена непосредственно</td></tr>
  </tbody>
</table>
<p>Так разделы одного вида получают разное оформление в зависимости от содержимого, без отдельных классов в разметке. В шаге «Собственные флажки и переключатели» <code>:has()</code> понадобится, чтобы менять вид подписи при выборе флажка. Вес <code>:has()</code> считается так же, как у <code>:is()</code>.</p>

<h3>Вес в сравнении</h3>
<table class="rubric">
  <caption>Вес селекторов с псевдоклассами</caption>
  <thead>
    <tr><th scope="col">Селектор</th><th scope="col">Вес</th></tr>
  </thead>
  <tbody>
    <tr><td><code>main :is(h2, h3)</code></td><td>0, 0, 2</td></tr>
    <tr><td><code>:is(h2, .title)</code></td><td>0, 1, 0</td></tr>
    <tr><td><code>:where(#content, .title) p</code></td><td>0, 0, 1</td></tr>
    <tr><td><code>li:not(:last-child)</code></td><td>0, 1, 1</td></tr>
    <tr><td><code>section:has(table)</code></td><td>0, 0, 2</td></tr>
  </tbody>
</table>

<div class="callout callout--code">
  <strong class="callout__title">Проверка поддержки</strong>
  <p>Все четыре псевдокласса поддерживаются современными браузерами, <code>:has()</code> – с конца 2023 года. Для старых браузеров правило можно поместить в условие <code>@supports selector(:has(a)) { … }</code>: браузер без поддержки пропустит блок, и страница останется в базовом оформлении.</p>
</div>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>пробел перед псевдоклассом: <code>section :has(table)</code> ищет элементы с таблицей внутри раздела, а не сам раздел;</li>
    <li>ожидание, что правило с <code>:where()</code> перекроет правило с классом;</li>
    <li>двоеточие пропущено или скобки не закрыты: <code>li:not(:last-child</code>;</li>
    <li>для исключения написано отменяющее правило вместо <code>:not()</code>.</li>
  </ul>
</div>
`,

  task: [
    'Сократите и уточните селекторы с помощью псевдоклассов со списком.',
    'Во вкладке `style.css` оформите заголовки `h2` и `h3` внутри `main` одним селектором с `:is()`. В слое `base` задайте отступ списков `ul` и `ol` селектором `:where()`. Разделите пункты списков отступом снизу, кроме последнего пункта, с помощью `:not()`. Выделите фоном раздел, в котором есть таблица, селектором `:has()`: разделы без таблицы фон получить не должны.'
  ],

  starter: { html: 'previous', css: 'previous' },

  checks: [
    linked,
    syntax,
    {
      id: 'isHeadings',
      label: 'Заголовки разных уровней в `main` оформлены одним селектором с `:is()`',
      test: async c => {
        const m = await c.measure(1280);
        return someSelector(c, s => {
          if (!/:is\(/i.test(s)) return false;
          const got = pick(m, s);
          const tags = new Set(got.filter(el => /^H[1-6]$/.test(el.tagName) && el.closest('main')).map(el => el.tagName));
          return tags.size >= 2;
        });
      },
      where: c => cssLine(c, /:is\(/i) ?? lastLine(c),
      hints: [
        'Нужно правило с объявлениями, селектор которого содержит `:is()` и выбирает заголовки по крайней мере двух уровней внутри `main`.',
        'В скобках `:is()` селекторы перечисляются через запятую. Общая часть – `main` и пробел – пишется один раз перед псевдоклассом.',
        'Образец: `main :is(h2, h3) { color: #1A40E7; }`'
      ]
    },
    {
      id: 'whereLists',
      label: 'Отступ списков задан селектором с `:where()`',
      test: async c => {
        const m = await c.measure(1280);
        return someSelector(c, s => /:where\(/i.test(s) &&
          pick(m, s).some(el => el.tagName === 'UL' || el.tagName === 'OL'));
      },
      where: c => cssLine(c, /:where\(/i) ?? cssLine(c, /@layer\s+base\s*\{/i) ?? lastLine(c),
      hints: [
        'Нужно правило, селектор которого содержит `:where()` и выбирает списки `ul` и `ol`.',
        'Внутри правила задайте отступ, например `padding-inline-start`. Правило удобнее разместить в слое `base`: это умолчание, которое классы смогут перекрыть.',
        'Образец: `:where(ul, ol) { padding-inline-start: 1.5em; }`'
      ]
    },
    {
      id: 'notItems',
      label: 'Пункты списков разделены отступом, кроме последнего: селектор с `:not()`',
      test: async c => {
        const m = await c.measure(1280);
        return someSelector(c, s => {
          if (!/:not\(/i.test(s)) return false;
          const got = pick(m, s);
          const all = pick(m, withoutNot(s));
          return got.some(el => el.tagName === 'LI') && got.length > 0 && got.length < all.length;
        });
      },
      where: c => cssLine(c, /:not\(/i) ?? lastLine(c),
      hints: [
        'Нужно правило для пунктов `li`, из которого `:not()` исключает часть пунктов, например последний в каждом списке.',
        'Псевдокласс `:last-child` выбирает последний элемент среди детей родителя. Внутри `:not()` он исключает такие пункты. Пробела между `li` и `:not` нет.',
        'Образец: `li:not(:last-child) { margin-block-end: 0.25em; }`'
      ]
    },
    {
      id: 'hasTable',
      label: 'Раздел с таблицей выделен фоном через `:has()`, другие разделы фона не получили',
      test: async c => {
        const m = await c.measure(1280);
        const withTable = m.qa('main section').filter(s => s.querySelector('table'));
        const without = m.qa('main section').filter(s => !s.querySelector('table'));
        if (!withTable.length) return false;
        const ruled = someSelector(c, s => /:has\(/i.test(s) &&
          withTable.every(el => pick(m, s).includes(el)) &&
          pick(m, s).every(el => el.querySelector('table')));
        if (!ruled) return false;
        const bg = m.cs(withTable[0]).backgroundColor;
        if (isTransparent(bg)) return false;
        return without.every(el => m.cs(el).backgroundColor !== bg);
      },
      where: c => cssLine(c, /:has\(/i) ?? lastLine(c),
      hints: [
        'Нужно правило, селектор которого содержит `:has()` и выбирает разделы `section`, в которых есть таблица, с объявлением `background-color`.',
        'Псевдокласс пишется слитно с тегом: `section:has(table)`. С пробелом селектор выберет не раздел, а элементы внутри него. Если таблицы на странице нет, верните её из модуля HTML.',
        'Образец: `section:has(table) { background-color: #F3F5FE; }`'
      ]
    }
  ],

  solution: c => {
    let html = c.html.raw;
    if (!STYLE_LINK.test(html)) html = addToHead(html, '<link rel="stylesheet" href="style.css">');

    const title = (c.html.text('h1') || 'Мой проект').replace(/\*\//g, '');
    let css = c.css.text;
    if (!css.trim() || diagnoseCss(css).length) {
      css = [
        `/* ${title} – основная таблица стилей */`,
        '',
        '@layer base, components;',
        '',
        '@layer base {',
        '  body {',
        '    font-family: "PT Sans", Arial, sans-serif;',
        '    color: #14161E;',
        '  }',
        '',
        '  p {',
        '    line-height: 1.5;',
        '  }',
        '}'
      ].join('\n');
    }
    css = `${css.replace(/\s*$/, '')}\n\n${BASE_RULES}\n\n${COMPONENT_RULES}\n`;
    return { html, css };
  },

  quiz: [
    {
      q: 'Какой вес у селектора `:where(#content) p`?',
      options: ['0, 0, 1', '1, 0, 1', '0, 1, 1', '1, 1, 1'],
      correct: 0,
      explain: '`:where()` обнуляет вес всего, что стоит в скобках, поэтому остаётся только тег `p`.'
    },
    {
      q: 'Что выбирает селектор `section:has(table)`?',
      options: [
        'Разделы, в которых есть таблица',
        'Таблицы, вложенные в разделы страницы',
        'Разделы, стоящие сразу перед таблицей',
        'Все разделы, если есть хоть одна таблица'
      ],
      correct: 0,
      explain: '`:has()` выбирает сам элемент по его содержимому. Таблицы внутри разделов выбирает селектор `section table`.'
    },
    {
      q: 'Какие элементы выбирает `li:not(:last-child)`?',
      options: [
        'Все пункты, кроме последнего в списке',
        'Только последний пункт каждого списка',
        'Пункты всех списков, кроме последнего',
        'Пункты, у которых нет вложенных списков'
      ],
      correct: 0,
      explain: '`:last-child` – последний ребёнок своего родителя, `:not()` его исключает. Остаются все пункты каждого списка, кроме последнего.'
    },
    {
      q: 'Чем `:is(h2, h3)` отличается от `:where(h2, h3)`?',
      options: [
        'У `:where()` нулевой вес',
        'Набором элементов, которые выбираются',
        '`:where()` работает только в слоях',
        '`:is()` не допускает запятую в скобках'
      ],
      correct: 0,
      explain: 'Оба выбирают одни и те же элементы. `:is()` берёт вес самого тяжёлого селектора в скобках, `:where()` всегда весит 0, 0, 0.'
    },
    {
      q: 'Какой селектор выбирает заголовки `h2`, за которыми сразу следует абзац?',
      options: ['`h2:has(+ p)`', '`p:has(+ h2)`', '`h2:not(~ p)`', '`h2 ~ p:is(p)`'],
      correct: 0,
      explain: 'Селектор в скобках `:has()` отсчитывается от самого заголовка: `+ p` – абзац сразу после него. `h2 + p` выбрал бы сам абзац.'
    }
  ],

  passScore: 0.8
};
