/* ==================================================================
   Шаг css-03 · Каскад, наследование, специфичность
   Модуль «CSS: оформление». Продолжает оба файла шага css-02
   (starter: previous для HTML и CSS).

   Что делает студент:
   – объявляет порядок слоёв @layer base, components в начале файла;
   – задаёт цвет текста body в слое base и видит, что его наследуют
     элементы страницы;
   – задаёт цвет абзацам разделов правилом section p;
   – добавляет класс note одному абзацу и в слое components
     перекрывает им цвет из section p;
   – обходится без !important.

   Проверки по результату сравнивают вычисленный браузером цвет
   элементов с цветом из нужного правила: так видно, какое
   объявление на самом деле победило в каскаде.
   ================================================================== */

import { diagnoseCss } from '../../js/cssvalidator.js';
import {
  linked, syntax, rulesFor, cssLine, htmlLine, addToHead, STYLE_LINK,
  selectorSkeleton, hasCombinator, pick, inLayer, computedColor, addClassToParagraph
} from './shared.js';

const NOTE = /\.note(?![-\w])/;
const lastLine = c => ({ file: 'css', line: Math.max(1, c.css.text.split('\n').length) });

/* Последнее объявление свойства prop среди правил */
const lastDecl = (rules, prop) => rules.flatMap(r => r.decls.filter(d => d.prop.toLowerCase() === prop)).at(-1) || null;

/* Объявление @layer со списком слоёв – первое в файле, base раньше components */
function layerStatement(c) {
  const kids = c.css.tree.children;
  const i = kids.findIndex(k => k.type === 'at-statement' && /^@layer\b/i.test(k.prelude));
  if (i < 0) return { ok: false, node: null };
  const before = kids.slice(0, i).every(k => k.type === 'at-statement' && /^@(import|charset)\b/i.test(k.prelude));
  const names = kids[i].prelude.replace(/^@layer/i, '').split(',').map(s => s.trim().toLowerCase());
  const b = names.indexOf('base');
  const co = names.indexOf('components');
  return { ok: before && b >= 0 && co > b, node: kids[i] };
}

/* Селектор только из тегов с комбинатором: section p, main section p, section > p */
const typeChain = s => hasCombinator(s) && !/[.#[:]/.test(selectorSkeleton(s));

/* Правила-соперники: цепочка тегов с цветом, которая выбирает абзацы в main */
function sectionColorRules(c, m) {
  return c.css.rules.filter(r =>
    r.decls.some(d => d.prop.toLowerCase() === 'color') &&
    r.selectors.some(s => typeChain(s) && pick(m, s).some(el => el.matches('main p'))));
}

/* Абзац, которому правильный вариант добавляет класс note:
   первый простой абзац раздела – без класса и атрибута style, не в цитате, форме или фигуре */
function noteTarget(doc) {
  return [...doc.querySelectorAll('main section p')].find(p =>
    !p.classList.length && !p.hasAttribute('style') && !p.closest('blockquote, form, figure, details, table'));
}

export default {
  title: 'Каскад, наследование, специфичность',
  files: ['html', 'css'],

  theory: `
<h2>Каскад, наследование, специфичность</h2>
<p class="lead">К одному элементу часто подходят несколько правил с одним и тем же свойством. Каскад – алгоритм, по которому браузер выбирает из них одно значение. Понимание каскада отвечает на самый частый вопрос при вёрстке: почему правило написано, а не применяется.</p>

<h3>Порядок каскада</h3>
<p>Браузер сравнивает конкурирующие объявления по критериям в строгом порядке. Следующий критерий рассматривается, только если предыдущий не выявил победителя.</p>
<ol>
  <li><strong>Происхождение.</strong> Стили сайта перекрывают стили браузера по умолчанию.</li>
  <li><strong>Встроенный стиль.</strong> Атрибут <code>style</code> перекрывает правила таблицы стилей – это вы видели в шаге 1.</li>
  <li><strong>Каскадные слои.</strong> Правило из более позднего слоя побеждает правило из более раннего.</li>
  <li><strong>Специфичность.</strong> Побеждает селектор с большим весом.</li>
  <li><strong>Порядок следования.</strong> При равном весе побеждает правило, записанное ниже.</li>
</ol>

<h3>Специфичность</h3>
<p>Вес селектора записывается тремя числами: количество идентификаторов, количество классов, атрибутов и псевдоклассов, количество тегов. Числа сравниваются слева направо, как разряды. Комбинаторы и универсальный селектор <code>*</code> веса не добавляют.</p>
<table class="rubric">
  <caption>Вес селекторов</caption>
  <thead>
    <tr><th scope="col">Селектор</th><th scope="col">Вес</th></tr>
  </thead>
  <tbody>
    <tr><td><code>p</code></td><td>0, 0, 1</td></tr>
    <tr><td><code>main section p</code></td><td>0, 0, 3</td></tr>
    <tr><td><code>.note</code></td><td>0, 1, 0</td></tr>
    <tr><td><code>p.note</code></td><td>0, 1, 1</td></tr>
    <tr><td><code>a[href^="https"]</code></td><td>0, 1, 1</td></tr>
    <tr><td><code>#content p</code></td><td>1, 0, 1</td></tr>
  </tbody>
</table>
<p>Один класс весит больше любого количества тегов: <code>.note</code> побеждает <code>main section p</code>, где бы ни стояли эти правила. Один идентификатор весит больше любого количества классов – поэтому селекторы по <code>id</code> в оформлении и не используют. Хорошая таблица стилей держит вес селекторов низким и ровным: тогда правила легко перекрывать.</p>

<h3>Наследование</h3>
<p>Часть свойств передаётся от родителя потомкам. Наследуются в основном свойства текста: <code>color</code>, <code>font-family</code>, <code>font-size</code>, <code>line-height</code>, <code>text-align</code>, <code>letter-spacing</code>. Свойства блока – <code>margin</code>, <code>padding</code>, <code>border</code>, <code>background</code>, <code>width</code> – не наследуются: рамка родителя не должна повторяться у каждого вложенного элемента.</p>
<p>Поэтому шрифт и цвет текста задают у <code>body</code> один раз, и их получает вся страница. Унаследованное значение уступает любому правилу, которое выбирает сам элемент, даже правилу браузера. Ссылки не получают цвет <code>body</code> именно поэтому: у них есть собственный цвет из стилей браузера.</p>
<p>Ключевое слово <code>inherit</code> заставляет элемент взять значение родителя, <code>initial</code> возвращает начальное значение свойства, <code>unset</code> действует как <code>inherit</code> для наследуемых свойств и как <code>initial</code> для остальных.</p>

<h3>Каскадные слои</h3>
<p>Директива <code>@layer</code> делит таблицу стилей на слои. Порядок слоёв объявляется один раз в начале файла, и дальше он важнее специфичности: правило из более позднего слоя побеждает, каким бы лёгким ни был его селектор.</p>
<pre><code>@layer base, components;

@layer base {
  section p {
    color: #3A3F4F;
  }
}

@layer components {
  .note {
    color: #8A1C1C;
  }
}</code></pre>
<p>Обычно слоёв несколько: <code>reset</code> – сброс стилей браузера, <code>base</code> – оформление тегов, <code>components</code> – блоки интерфейса, <code>utilities</code> – вспомогательные классы. Правила вне слоёв побеждают все слои. Это удобно для быстрых правок, но легко приводит к путанице: правило вне слоя перекроет правило из <code>components</code> даже с меньшим весом.</p>

<h3>Объявление !important</h3>
<p>Пометка <code>!important</code> после значения поднимает объявление над всеми обычными, а среди важных объявлений порядок слоёв переворачивается. Перекрыть такое объявление можно только другим <code>!important</code>, и таблица стилей быстро превращается в соревнование пометок. Если правило не применяется, причину ищут в каскаде, а не повышают важность.</p>

<div class="callout callout--code">
  <strong class="callout__title">Инструменты разработчика</strong>
  <p>Щёлкните правой кнопкой по элементу в окне результата и выберите «Просмотреть код» (сочетание клавиш <code>F12</code>, на Mac – <code>Cmd</code> + <code>Option</code> + <code>I</code>). На вкладке «Стили» перечислены все правила, которые подходят к элементу, в порядке убывания приоритета. Проигравшие объявления зачёркнуты, рядом указан слой. На вкладке «Вычисленные» – итоговые значения свойств и правило, из которого каждое взято.</p>
</div>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>правило оставлено вне слоёв и перекрывает компонент, хотя его селектор легче;</li>
    <li>порядок слоёв объявлен после правил – тогда он определяется порядком первого упоминания;</li>
    <li>цвет задан каждому тегу отдельно, хотя достаточно задать его у <code>body</code>;</li>
    <li>правило «не работает», и вместо поиска причины добавлен <code>!important</code>.</li>
  </ul>
</div>
`,

  task: [
    'Организуйте таблицу стилей по каскадным слоям и проследите, как браузер выбирает между правилами.',
    'Во вкладке `style.css` сразу после комментария объявите порядок слоёв `@layer base, components;`. В слое `base` задайте цвет текста у `body` – его унаследуют элементы страницы – и отдельный цвет абзацам разделов правилом `section p`. Во вкладке `index.html` добавьте класс `note` одному абзацу внутри раздела, например абзацу с важным условием. В слое `components` задайте для `.note` свой цвет текста: он должен перекрыть цвет из `section p`. Обойдитесь без `!important`.'
  ],

  starter: { html: 'previous', css: 'previous' },

  checks: [
    linked,
    syntax,
    {
      id: 'layerOrder',
      label: 'В начале таблицы стилей объявлен порядок слоёв: `@layer base, components;`',
      test: c => layerStatement(c).ok,
      where: c => {
        const n = layerStatement(c).node;
        return n ? { file: 'css', line: n.line } : { file: 'css', line: 1 };
      },
      hints: [
        'Порядок слоёв объявляется одной строкой до всех правил. Комментарий перед ней допустим.',
        'Имена слоёв перечисляются через запятую от раннего к позднему, строка заканчивается точкой с запятой, фигурных скобок у неё нет.',
        'Образец: `@layer base, components;` сразу после комментария в первой строке.'
      ]
    },
    {
      id: 'bodyColor',
      label: 'Цвет текста задан у `body` в слое `base` и наследуется элементами страницы',
      test: async c => {
        const d = lastDecl(c.css.rules.filter(r => inLayer(r, 'base') &&
          r.selectors.some(s => s.trim().toLowerCase() === 'body')), 'color');
        if (!d) return false;
        const m = await c.measure(1280);
        const want = computedColor(m, d.value);
        const heir = m.q('main li') || m.q('main td') || m.q('main');
        return Boolean(want) && m.cs('body').color === want && Boolean(heir) && m.cs(heir).color === want;
      },
      where: c => cssLine(c, /@layer\s+base\s*\{/i) ?? lastLine(c),
      hints: [
        'Нужно правило для `body` со свойством `color`, расположенное внутри блока `@layer base { … }`.',
        'Если правило есть, а цвет не наследуется, проверьте, нет ли другого правила `body` с цветом вне слоёв: правила вне слоёв побеждают все слои. Цвет пунктов списка не должен задаваться отдельным правилом.',
        'Образец: `@layer base {`, внутри `body { color: #14161E; }`, затем `}`.'
      ]
    },
    {
      id: 'sectionColor',
      label: 'Абзацам разделов задан цвет правилом из тегов с комбинатором, например `section p`',
      test: async c => {
        const m = await c.measure(1280);
        return sectionColorRules(c, m).length > 0;
      },
      where: c => cssLine(c, /section[^{,]*\sp\s*[{,]/i) ?? cssLine(c, /@layer\s+base\s*\{/i) ?? lastLine(c),
      hints: [
        'Нужно правило со свойством `color`, селектор которого составлен из тегов и комбинатора и выбирает абзацы внутри `main`.',
        'Классы здесь не нужны: селектор `section p` весит 0, 0, 2. Удобнее разместить правило в слое `base`.',
        'Образец: внутри `@layer base { … }` правило `section p { color: #3A3F4F; }`.'
      ]
    },
    {
      id: 'noteClass',
      label: 'Одному абзацу внутри раздела добавлен класс `note`',
      test: c => c.html.qa('main section p').some(p => p.classList.contains('note')),
      where: c => htmlLine(c, /class\s*=\s*["'][^"']*\bnote\b/i) ?? htmlLine(c, /<section\b/i),
      hints: [
        'Выберите абзац `p` внутри одного из разделов `section` и добавьте ему атрибут `class`.',
        'Имя класса в атрибуте пишется без точки. Если у абзаца уже есть класс, новый добавляется через пробел.',
        'Образец: `<p class="note">Запись закрывается за сутки до начала.</p>`'
      ]
    },
    {
      id: 'noteWins',
      label: 'Правило `.note` в слое `components` перекрывает цвет из `section p`',
      test: async c => {
        const d = lastDecl(rulesFor(c, s => NOTE.test(s)).filter(r => inLayer(r, 'components')), 'color');
        if (!d) return false;
        const m = await c.measure(1280);
        const el = m.q('main section p.note');
        const want = computedColor(m, d.value);
        if (!el || !want || m.cs(el).color !== want) return false;
        /* Соперник должен действительно выбирать этот абзац и задавать другой цвет */
        return sectionColorRules(c, m).some(r => {
          const rival = computedColor(m, lastDecl([r], 'color').value);
          return rival !== want && r.selectors.some(s => typeChain(s) && pick(m, s).includes(el));
        });
      },
      where: c => cssLine(c, /\.note\b/) ?? cssLine(c, /@layer\s+components\s*\{/i) ?? lastLine(c),
      hints: [
        'Нужно правило `.note` со свойством `color` внутри блока `@layer components { … }`, и его цвет должен отличаться от цвета `section p`.',
        'Если цвет абзаца не меняется, проверьте, не осталось ли правило `section p` или `p` с цветом вне слоёв: такое правило побеждает любой слой. Перенесите его в `base`.',
        'Образец: `@layer components {`, внутри `.note { color: #8A1C1C; }`, затем `}`.'
      ]
    },
    {
      id: 'noImportant',
      label: 'В таблице стилей нет `!important`',
      test: c => c.css.decls.every(d => !d.important),
      where: c => { const d = c.css.decls.find(x => x.important); return d ? { file: 'css', line: d.line } : null; },
      hints: [
        'Пометка `!important` ломает обычный порядок каскада, и её приходится перекрывать новыми пометками.',
        'Удалите `!important` и найдите настоящую причину: правило вне слоя, более тяжёлый селектор соперника или порядок следования. Инструменты разработчика показывают, какое объявление победило.',
        'Было: `color: #8A1C1C !important;`. Стало: `color: #8A1C1C;` и правило в слое `components`.'
      ]
    }
  ],

  solution: c => {
    let html = c.html.raw;
    if (!STYLE_LINK.test(html)) html = addToHead(html, '<link rel="stylesheet" href="style.css">');
    if (!c.html.q('main section p.note')) {
      const target = noteTarget(c.html.doc);
      if (target) html = addClassToParagraph(html, [...c.html.doc.querySelectorAll('p')].indexOf(target), 'note');
    }

    /* Правила прошлых шагов переносятся в слой base целиком;
       если в файле ошибки или уже есть слои – файл собирается заново */
    const title = (c.html.text('h1') || 'Мой проект').replace(/\*\//g, '');
    const text = c.css.text;
    const lead = text.match(/^\s*\/\*[\s\S]*?\*\/[ \t]*\n?/);
    const head = lead ? lead[0].trim() : `/* ${title} – основная таблица стилей */`;
    const clean = text.trim() && !diagnoseCss(text).length && !/@layer\b/i.test(c.css.clean);
    const previous = clean
      ? text.slice(lead ? lead[0].length : 0).replace(/\s*!\s*important/gi, '').trim()
      : ['body {', '  font-family: "PT Sans", Arial, sans-serif;', '}', '', 'p {', '  line-height: 1.5;', '}'].join('\n');
    const indent = s => s.split('\n').map(l => (l.trim() ? `  ${l}` : '')).join('\n');

    const css = [
      head,
      '',
      '@layer base, components;',
      '',
      '@layer base {',
      previous ? `${indent(previous)}\n` : '',
      '  body {',
      '    color: #14161E;',
      '  }',
      '',
      '  section p {',
      '    color: #3A3F4F;',
      '  }',
      '}',
      '',
      '@layer components {',
      '  .note {',
      '    color: #8A1C1C;',
      '  }',
      '}',
      ''
    ].join('\n');
    return { html, css };
  },

  quiz: [
    {
      q: 'У какого селектора наибольший вес?',
      options: ['`.nav .link`', '`nav ul li a`', '`body .nav a`', '`main nav ul a`'],
      correct: 0,
      explain: 'Два класса дают вес 0, 2, 0. Это больше, чем 0, 1, 2 у `body .nav a` и 0, 0, 4 у цепочек из тегов: числа сравниваются слева направо.'
    },
    {
      q: 'Два правила `p` задают абзацам разный цвет и стоят в одном слое. Какое применится?',
      options: [
        'Записанное ниже',
        'Записанное выше',
        'Ни одно из двух',
        'Выбранное браузером случайно'
      ],
      correct: 0,
      explain: 'Слой и вес у правил одинаковы, поэтому решает последний критерий каскада – порядок следования.'
    },
    {
      q: 'Какое свойство, заданное у `body`, наследуют абзацы страницы?',
      options: ['`color`', '`margin`', '`border`', '`padding`'],
      correct: 0,
      explain: 'Наследуются в основном свойства текста. Отступы и рамки к потомкам не переходят.'
    },
    {
      q: 'Объявлено `@layer base, components;`. В `base` – правило `.card p`, в `components` – правило `p`. Какое победит?',
      options: [
        'Из слоя `components`',
        'Из `base`, у него больше вес',
        'Записанное ниже в файле',
        'Ни одно – они конфликтуют'
      ],
      correct: 0,
      explain: 'Порядок слоёв проверяется раньше специфичности: правило из более позднего слоя побеждает при любом весе селектора.'
    },
    {
      q: 'Правило вне слоёв и правило из слоя `components` с большим весом задают цвет одному абзацу. Какое применится?',
      options: [
        'Правило вне слоёв',
        'Правило с большим весом',
        'Правило из `components`',
        'Записанное позже в файле'
      ],
      correct: 0,
      explain: 'Правила вне слоёв побеждают все каскадные слои, поэтому вес до сравнения не доходит.'
    }
  ],

  passScore: 0.8
};
