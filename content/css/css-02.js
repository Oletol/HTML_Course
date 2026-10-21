/* ==================================================================
   Шаг css-02 · Селекторы и классы
   Модуль «CSS: оформление». Продолжает оба файла шага css-01
   (starter: previous для HTML и CSS).

   Что делает студент:
   – добавляет класс lead первому абзацу в main (index.html);
   – оформляет .lead, группу заголовков, ссылки навигации
     через комбинатор и внешние ссылки через селектор атрибута;
   – обходится без селекторов по id.

   Проверки по результату (c.measure) смотрят на отрисованную
   страницу: какие элементы на самом деле выбирает селектор
   и какой получился размер шрифта.
   ================================================================== */

import { diagnoseCss } from '../../js/cssvalidator.js';
import {
  linked, syntax, rulesFor, cssLine, htmlLine, addToHead, STYLE_LINK,
  hasIdSelector, hasCombinator, pick
} from './shared.js';

const HEADING = /^h[1-6]$/i;

/* Строка первого абзаца внутри main – туда указывает подсказка */
function firstMainParagraphLine(c) {
  const src = c.html.clean;
  const main = src.search(/<main\b/i);
  if (main < 0) return htmlLine(c, /<body\b/i);
  const rest = src.slice(main).search(/<p\b/i);
  const at = rest < 0 ? main : main + rest;
  return { file: 'html', line: src.slice(0, at).split('\n').length };
}

/* Правило, у которого есть объявления и хотя бы один подходящий селектор */
const someRule = (c, test) => c.css.rules.some(r => r.decls.length > 0 && r.selectors.some(test));

/* ---------- Правильный вариант ---------- */

/* Добавить класс lead первому абзацу в main, сохранив его другие классы */
function addLeadClass(html) {
  const main = html.search(/<main\b/i);
  if (main < 0) return html;
  const re = /<p\b([^>]*)>/i;
  const tail = html.slice(main);
  const m = tail.match(re);
  if (!m) return html;
  const attrs = m[1];
  let tag;
  const cls = attrs.match(/\sclass\s*=\s*(["'])(.*?)\1/i);
  if (cls) {
    if (/(^|\s)lead(\s|$)/.test(cls[2])) return html;
    const value = `${cls[2].trim()} lead`.trim();
    tag = `<p${attrs.replace(cls[0], ` class="${value}"`)}>`;
  } else {
    tag = `<p class="lead"${attrs}>`;
  }
  return html.slice(0, main) + tail.replace(re, tag);
}

/* Убрать из таблицы стилей селекторы по id: из группы – только их,
   правило целиком – если других селекторов в нём нет */
function dropIdSelectors(css, rules) {
  let out = css;
  for (const r of rules) {
    if (!r.selectors.some(hasIdSelector)) continue;
    const at = out.indexOf(r.prelude);
    if (at < 0) continue;
    const keep = r.selectors.filter(s => !hasIdSelector(s));
    if (keep.length) {
      out = out.slice(0, at) + keep.join(',\n') + out.slice(at + r.prelude.length);
      continue;
    }
    const open = out.indexOf('{', at);
    let depth = 0, end = open;
    for (; end < out.length; end++) {
      if (out[end] === '{') depth++;
      if (out[end] === '}' && --depth === 0) break;
    }
    out = out.slice(0, at) + out.slice(end + 1).replace(/^[ \t]*\n/, '');
  }
  return out;
}

const NEW_RULES = [
  '/* Заголовки */',
  'h1,',
  'h2,',
  'h3 {',
  '  line-height: 1.2;',
  '}',
  '',
  '/* Вводный абзац */',
  '.lead {',
  '  font-size: 1.25rem;',
  '}',
  '',
  '/* Ссылки навигации */',
  'nav a {',
  '  font-weight: 700;',
  '  text-decoration: none;',
  '}',
  '',
  '/* Внешние ссылки */',
  'a[href^="https"] {',
  '  text-decoration-style: dotted;',
  '}',
  ''
].join('\n');

/* Если таблица стилей пустая или с ошибками – начать с правил шага 1 */
function baseCss(title) {
  return [
    `/* ${title} – основная таблица стилей */`,
    '',
    'body {',
    '  font-family: "PT Sans", Arial, sans-serif;',
    '}',
    '',
    'p {',
    '  line-height: 1.5;',
    '}',
    ''
  ].join('\n');
}

export default {
  title: 'Селекторы и классы',
  files: ['html', 'css'],

  theory: `
<h2>Селекторы и классы</h2>
<p class="lead">Селектор определяет, к каким элементам страницы применяется правило. Точный селектор оформляет нужные элементы и не затрагивает остальные, поэтому выбор селектора – первое решение при написании любого правила.</p>

<h3>Простые селекторы</h3>
<ul class="parts">
  <li><code class="parts__tag">p</code>Селектор по типу элемента. Выбирает все элементы с этим тегом. Подходит для базового оформления – шрифт документа, интервал абзацев, вид ссылок.</li>
  <li><code class="parts__tag">.lead</code>Селектор по классу. Выбирает элементы с атрибутом <code>class="lead"</code> независимо от тега. Основной инструмент оформления.</li>
  <li><code class="parts__tag">#content</code>Селектор по идентификатору. Выбирает единственный элемент с <code>id="content"</code>. В оформлении не применяется, причины изложены ниже.</li>
  <li><code class="parts__tag">*</code>Универсальный селектор. Выбирает все элементы. Применяется в сбросе стилей.</li>
</ul>

<h3>Классы</h3>
<p>Класс задаётся атрибутом <code>class</code> и может повторяться на странице сколько угодно раз. У одного элемента может быть несколько классов через пробел: <code>class="note note--warning"</code>. Тег и класс записываются слитно, если правило должно действовать только на элементы определённого типа: <code>p.lead</code> выбирает только абзацы с классом <code>lead</code>.</p>
<pre><code>&lt;p class="lead"&gt;Центр объединяет исследователей диалектной речи.&lt;/p&gt;

.lead {
  font-size: 1.25rem;
}</code></pre>
<p>Имя класса описывает назначение элемента, а не его вид. Класс <code>.warning</code> останется верным, если предупреждение станет синим, а класс <code>.red-text</code> в этом случае начнёт вводить в заблуждение. Имена принято писать латиницей, строчными буквами, слова разделять дефисом. Регистр имеет значение: <code>.Lead</code> и <code>.lead</code> – разные классы. Система именования БЭМ рассматривается в шаге «Сброс стилей и методология БЭМ».</p>

<h3>Идентификаторы в оформлении</h3>
<p>Атрибут <code>id</code> уникален на странице, поэтому правило с селектором <code>#content</code> нельзя применить ко второму элементу. Кроме того, у селектора по <code>id</code> очень высокий вес: перекрыть его можно только ещё более тяжёлым селектором, и таблица стилей постепенно усложняется. Вес селекторов подробно рассматривается в следующем шаге. Идентификаторы остаются в разметке для своих задач – якорные ссылки, связь <code>label</code> с полем формы, обращение из скриптов.</p>

<h3>Группировка</h3>
<p>Если несколько селекторов получают одинаковое оформление, их перечисляют через запятую в одном правиле. Каждый селектор группы принято писать с новой строки.</p>
<pre><code>h1,
h2,
h3 {
  line-height: 1.2;
}</code></pre>
<p>Если один из селекторов группы записан с ошибкой, браузер отбрасывает всё правило целиком.</p>

<h3>Комбинаторы</h3>
<p>Комбинатор связывает два селектора и описывает отношение элементов в дереве документа.</p>
<table class="rubric">
  <caption>Четыре комбинатора</caption>
  <thead>
    <tr><th scope="col">Запись</th><th scope="col">Комбинатор</th><th scope="col">Что выбирает</th></tr>
  </thead>
  <tbody>
    <tr><td><code>nav a</code></td><td>потомок (пробел)</td><td>ссылки внутри <code>nav</code> на любой глубине вложенности</td></tr>
    <tr><td><code>section &gt; p</code></td><td>дочерний</td><td>абзацы, вложенные непосредственно в <code>section</code>, без абзацев внутри <code>blockquote</code></td></tr>
    <tr><td><code>h2 + p</code></td><td>соседний</td><td>абзац, который стоит сразу после <code>h2</code></td></tr>
    <tr><td><code>h2 ~ p</code></td><td>родственный</td><td>все абзацы после <code>h2</code> у того же родителя</td></tr>
  </tbody>
</table>
<p>Браузер читает селектор справа налево: <code>nav a</code> означает «ссылки, у которых среди предков есть <code>nav</code>». Комбинатор позволяет оформить элементы по их месту в структуре, не добавляя классы в разметку. Длинные цепочки вида <code>body main section ul li a</code> зависят от разметки и перестают работать при любом её изменении, поэтому цепочку ограничивают двумя-тремя звеньями.</p>

<h3>Селекторы атрибутов</h3>
<p>Селектор атрибута выбирает элементы по их данным – адресу ссылки, языку фрагмента, типу поля.</p>
<table class="rubric">
  <caption>Основные формы записи</caption>
  <thead>
    <tr><th scope="col">Запись</th><th scope="col">Что выбирает</th></tr>
  </thead>
  <tbody>
    <tr><td><code>[target]</code></td><td>элементы с атрибутом <code>target</code> с любым значением</td></tr>
    <tr><td><code>[lang="en"]</code></td><td>значение точно равно <code>en</code></td></tr>
    <tr><td><code>[href^="https"]</code></td><td>значение начинается с <code>https</code></td></tr>
    <tr><td><code>[href$=".pdf"]</code></td><td>значение заканчивается на <code>.pdf</code></td></tr>
    <tr><td><code>[href*="wikipedia"]</code></td><td>значение содержит <code>wikipedia</code></td></tr>
  </tbody>
</table>
<p>Флаг <code>i</code> перед закрывающей скобкой отключает учёт регистра: <code>a[href$=".pdf" i]</code> выберет и ссылку на файл <code>.PDF</code>. Внешние ссылки на странице – типичный пример: адрес начинается с <code>https</code>, а ссылки внутри сайта – с <code>#</code> или имени файла.</p>

<div class="callout callout--code">
  <strong class="callout__title">Приём проверки селектора</strong>
  <p>Перед тем как писать объявления, полезно убедиться, что селектор выбирает именно нужные элементы. Временно добавьте в правило объявление <code>outline: 2px solid red;</code> – рамка обведёт выбранные элементы и не сдвинет соседние. Когда селектор проверен, объявление удаляется.</p>
</div>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>точка в атрибуте разметки: <code>class=".lead"</code> вместо <code>class="lead"</code>;</li>
    <li>пропущена точка в селекторе: <code>lead</code> браузер понимает как тег <code>&lt;lead&gt;</code>;</li>
    <li>пробел между тегом и классом: <code>p .lead</code> выбирает элементы с классом внутри абзаца, а не абзац с классом;</li>
    <li>запятая вместо пробела: <code>nav, a</code> оформляет навигацию и все ссылки страницы.</li>
  </ul>
</div>
`,

  task: [
    'Оформите отдельные части своей страницы точными селекторами.',
    'Во вкладке `index.html` добавьте класс `lead` первому абзацу внутри `main`. Во вкладке `style.css` увеличьте размер шрифта абзаца с этим классом; оформите заголовки разных уровней одним правилом с группировкой; оформите ссылки навигации селектором с комбинатором так, чтобы остальные ссылки не изменились; выделите внешние ссылки селектором атрибута по началу адреса. Селекторы по `id` не используйте.'
  ],

  starter: { html: 'previous', css: 'previous' },

  checks: [
    linked,
    syntax,
    {
      id: 'leadClass',
      label: 'У первого абзаца в `main` есть класс `lead`',
      test: c => Boolean(c.html.q('main p')?.classList.contains('lead')),
      where: firstMainParagraphLine,
      hints: [
        'Класс добавляется в разметку атрибутом `class` у открывающего тега. Нужен первый абзац `p` внутри `main`.',
        'Имя класса в атрибуте пишется без точки: точка нужна только в селекторе CSS.',
        'Образец: `<p class="lead">Первый абзац раздела…</p>`. Если у абзаца уже есть класс, новый добавляется через пробел: `class="intro lead"`.'
      ]
    },
    {
      id: 'leadSize',
      label: 'Размер шрифта абзаца `.lead` больше, чем у остальных абзацев',
      test: async c => {
        if (!rulesFor(c, s => /\.lead(?![-\w])/.test(s)).length) return false;
        const m = await c.measure(1280);
        const lead = m.q('main p.lead');
        if (!lead) return false;
        const other = m.q('main p:not(.lead)') || m.doc.body;
        return parseFloat(m.cs(lead).fontSize) > parseFloat(m.cs(other).fontSize);
      },
      where: c => cssLine(c, /\.lead(?![-\w])/) ?? { file: 'css', line: Math.max(1, c.css.text.split('\n').length) },
      hints: [
        'Нужно правило с селектором по классу `.lead` и свойством `font-size`. Размер должен быть больше, чем у обычных абзацев.',
        'Селектор по классу начинается с точки. Проверьте, что класс в разметке и в селекторе написан одинаково, с учётом регистра.',
        'Образец: `.lead { font-size: 1.25rem; }`'
      ]
    },
    {
      id: 'grouping',
      label: 'Заголовки разных уровней оформлены одним правилом с группировкой',
      test: c => c.css.rules.some(r => r.decls.length > 0 &&
        new Set(r.selectors.map(s => s.trim().toLowerCase()).filter(s => HEADING.test(s))).size >= 2),
      where: c => cssLine(c, /(^|[\s,}])h[1-6]\s*,/i) ?? { file: 'css', line: Math.max(1, c.css.text.split('\n').length) },
      hints: [
        'Нужно одно правило, селектор которого перечисляет через запятую несколько уровней заголовков.',
        'Селекторы группы разделяются запятой, после последнего запятая не ставится. Внутри правила – хотя бы одно объявление.',
        'Образец: `h1,` `h2,` `h3 {` на отдельных строках, затем `line-height: 1.2;` и `}`.'
      ]
    },
    {
      id: 'navLinks',
      label: 'Ссылки навигации оформлены селектором с комбинатором, другие ссылки он не затрагивает',
      test: async c => {
        const m = await c.measure(1280);
        const navLinks = m.qa('nav a');
        if (!navLinks.length) return false;
        return someRule(c, s => {
          if (!hasCombinator(s) || hasIdSelector(s)) return false;
          const got = pick(m, s);
          return navLinks.every(a => got.includes(a)) && got.every(el => el.closest('nav'));
        });
      },
      where: c => cssLine(c, /nav[^{,]*[\s>]a[^{,]*\{/i) ?? { file: 'css', line: Math.max(1, c.css.text.split('\n').length) },
      hints: [
        'Нужно правило, которое выбирает все ссылки внутри `nav` и только их. Селектор `a` без комбинатора изменит все ссылки страницы.',
        'Комбинатор «потомок» записывается пробелом между двумя селекторами: сначала предок, затем нужный элемент. Запятая вместо пробела превращает селектор в группу.',
        'Образец: `nav a { text-decoration: none; }`'
      ]
    },
    {
      id: 'externalLinks',
      label: 'Внешние ссылки выделены селектором атрибута `href^=`',
      test: async c => {
        const m = await c.measure(1280);
        return someRule(c, s => {
          if (!/\[\s*href\s*\^=/i.test(s)) return false;
          const got = pick(m, s);
          return got.length > 0 && got.every(el => /^https?:/i.test(el.getAttribute('href') || ''));
        });
      },
      where: c => cssLine(c, /\[\s*href/i) ?? { file: 'css', line: Math.max(1, c.css.text.split('\n').length) },
      hints: [
        'Внешняя ссылка отличается адресом: он начинается с `https`. Нужно правило, селектор которого выбирает ссылки по началу значения `href`.',
        'Начало значения проверяет запись `^=` в квадратных скобках. Значение берётся в кавычки. Если на странице нет внешней ссылки, добавьте её в `index.html`.',
        'Образец: `a[href^="https"] { text-decoration-style: dotted; }`'
      ]
    },
    {
      id: 'noId',
      label: 'В таблице стилей нет селекторов по `id`',
      test: c => c.css.rules.every(r => r.selectors.every(s => !hasIdSelector(s))),
      where: c => {
        const r = c.css.rules.find(x => x.selectors.some(hasIdSelector));
        return r ? { file: 'css', line: r.line } : null;
      },
      hints: [
        'В одном из селекторов есть знак `#` – обращение по идентификатору. Оформление задаётся через классы, теги и комбинаторы.',
        'Замените селектор по `id` селектором по классу: добавьте элементу класс в `index.html` и обратитесь к нему через точку. Атрибут `id` в разметке остаётся.',
        'Было: `#content { … }`. Стало: `<main id="content" class="content">` в разметке и `.content { … }` в таблице стилей.'
      ]
    }
  ],

  solution: c => {
    let html = c.html.raw;
    if (!STYLE_LINK.test(html)) html = addToHead(html, '<link rel="stylesheet" href="style.css">');
    html = addLeadClass(html);

    let css = c.css.text;
    if (!css.trim() || diagnoseCss(css).length) {
      const title = (c.html.text('h1') || 'Мой проект').replace(/\*\//g, '');
      css = baseCss(title);
    } else {
      css = dropIdSelectors(css, c.css.rules);
    }
    css = `${css.replace(/\s*$/, '')}\n\n${NEW_RULES}`;
    return { html, css };
  },

  quiz: [
    {
      q: 'Какие элементы выбирает селектор `nav a`?',
      options: [
        'Ссылки внутри `nav` на любом уровне',
        'Только ссылки – прямые потомки `nav`',
        'Элементы `nav` и все ссылки страницы',
        'Ссылки, которые стоят сразу после `nav`'
      ],
      correct: 0,
      explain: 'Пробел – комбинатор «потомок»: подходит любая ссылка, у которой среди предков есть `nav`. Прямых потомков выбирает `>`, группу задаёт запятая.'
    },
    {
      q: 'Что выбирает селектор `h2, p`?',
      options: [
        'Все `h2` и все абзацы',
        'Абзацы, вложенные в `h2`',
        'Абзацы сразу после `h2`',
        'Только `h2` с абзацем внутри'
      ],
      correct: 0,
      explain: 'Запятая перечисляет селекторы группы: правило действует на каждый из них. Отношения между элементами задают комбинаторы.'
    },
    {
      q: 'Какое имя класса для блока с предупреждением лучше соответствует принятым правилам?',
      options: ['`.warning`', '`.red-bold`', '`.Предупреждение`', '`.big_red_text`'],
      correct: 0,
      explain: 'Имя описывает назначение, а не вид, и записывается латиницей строчными буквами. При смене цвета `.warning` останется верным.'
    },
    {
      q: 'Какой селектор выбирает ссылки на файлы PDF?',
      options: ['`a[href$=".pdf"]`', '`a[href^=".pdf"]`', '`a[href|=".pdf"]`', '`a[type~=".pdf"]`'],
      correct: 0,
      explain: '`$=` проверяет окончание значения. `^=` проверяет начало, а запись без знака требует полного совпадения адреса со строкой `.pdf`.'
    },
    {
      q: 'Почему в оформлении не используют селекторы по `id`?',
      options: [
        'У них слишком высокий вес',
        'Браузеры не поддерживают такие селекторы',
        'Атрибут `id` недопустим в разметке',
        'Они не работают во внешнем файле стилей'
      ],
      correct: 0,
      explain: 'Селектор по `id` перекрывается только ещё более тяжёлым селектором. К тому же правило нельзя применить повторно: `id` на странице уникален.'
    }
  ],

  passScore: 0.8
};
