/* ==================================================================
   Шаг html-11 · Таблицы
   Продолжает страницу студента из шага 10 (starter: 'previous').
   ================================================================== */

import prevStep from './html-10.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';

const firstTable = c => c.q('body table');
const width = row => [...row.children].reduce((s, cell) => s + (parseInt(cell.getAttribute('colspan'), 10) || 1), 0);

export default {
  title: 'Таблицы',

  theory: `
<h2>Таблицы</h2>
<p class="lead">Таблица представляет данные, которые имеют смысл на пересечении строки и столбца: расписание, сравнение, результаты измерений. Разметка таблицы связывает каждую ячейку с её заголовками, и программа экранного доступа может прочитать значение вместе с тем, к чему оно относится.</p>

<h3>Строки, ячейки, заголовки</h3>
<p>Таблица <code>table</code> состоит из строк <code>tr</code>. Строка содержит ячейки данных <code>td</code> и ячейки-заголовки <code>th</code>. Атрибут <code>scope</code> у <code>th</code> указывает, что заголовок относится к столбцу (<code>col</code>) или к строке (<code>row</code>).</p>
<pre><code>&lt;table&gt;
  &lt;caption&gt;Расписание консультаций&lt;/caption&gt;
  &lt;thead&gt;
    &lt;tr&gt;
      &lt;th scope="col"&gt;День&lt;/th&gt;
      &lt;th scope="col"&gt;Время&lt;/th&gt;
      &lt;th scope="col"&gt;Формат&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr&gt;
      &lt;th scope="row"&gt;Вторник&lt;/th&gt;
      &lt;td&gt;15:00–16:30&lt;/td&gt;
      &lt;td&gt;очно&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
      &lt;th scope="row"&gt;Четверг&lt;/th&gt;
      &lt;td&gt;18:00–19:00&lt;/td&gt;
      &lt;td&gt;онлайн&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;</code></pre>

<h3>Подпись и группы строк</h3>
<ul>
  <li><code>caption</code> – название таблицы, первый элемент внутри <code>table</code>. Программа экранного доступа объявляет его до чтения данных.</li>
  <li><code>thead</code> – строки заголовков столбцов, <code>tbody</code> – строки данных, <code>tfoot</code> – итоговые строки, например сумма.</li>
</ul>
<p>Группы строк не меняют внешний вид без CSS, но делают структуру явной: при печати длинной таблицы браузер повторяет <code>thead</code> на каждой странице.</p>

<h3>Объединение ячеек</h3>
<p>Атрибуты <code>colspan</code> и <code>rowspan</code> растягивают ячейку на несколько столбцов или строк: <code>&lt;td colspan="2"&gt;</code>. Число ячеек в каждой строке с учётом объединений должно совпадать, иначе таблица распадается. Сложные объединения затрудняют чтение программой экранного доступа, поэтому таблицу лучше упростить или разделить на несколько.</p>

<h3>Таблица для данных, а не для раскладки</h3>
<p>До появления CSS таблицами размещали элементы страницы по колонкам. Сейчас раскладка выполняется средствами CSS, а таблица используется только для табличных данных. Если строки и столбцы не имеют смысла по отдельности, это не таблица.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>заголовки оформлены <code>td</code> с полужирным текстом вместо <code>th</code>;</li>
    <li>нет <code>caption</code>, и назначение таблицы понятно только из окружающего текста;</li>
    <li>разное число ячеек в строках;</li>
    <li>таблица использована для раскладки блоков на странице.</li>
  </ul>
</div>
`,

  task: [
    'Добавьте в один из разделов `section` своей страницы таблицу с данными по теме проекта: расписание, сравнение вариантов, характеристики, результаты.',
    'У таблицы – подпись `caption`, строка заголовков столбцов в `thead` (не меньше трёх столбцов, `th` с `scope="col"`), не меньше двух строк данных в `tbody`, где первая ячейка каждой строки – заголовок строки `th` с `scope="row"`. Число ячеек во всех строках одинаковое.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(10, '`header` с `nav`, `main` с разделами `section`, `footer`',
      c => Boolean(c.q('body > header nav') && c.q('body > main > section') && c.q('body > footer'))),
    {
      id: 'inSection',
      label: 'Таблица находится внутри `section` в `main`',
      test: c => Boolean(c.q('body > main section table')),
      where: c => c.lineOf(/<table\b/i),
      hints: [
        'Таблица – часть содержания, поэтому она размещается в одном из разделов `section` внутри `main`.',
        'Перенесите таблицу внутрь раздела, к теме которого она относится, до закрывающего `</section>`.',
        'Образец: `<section>`, `<h2>Расписание</h2>`, абзац, затем `<table>…</table>`, затем `</section>`.'
      ]
    },
    {
      id: 'caption',
      label: 'Первый элемент таблицы – `caption` с названием',
      test: c => { const t = firstTable(c); return Boolean(t && t.firstElementChild?.tagName === 'CAPTION' && t.caption.textContent.trim().length >= 3); },
      where: c => c.lineOf(/<table\b/i),
      hints: [
        'Название таблицы размечается `caption` и стоит сразу после открывающего `<table>`.',
        'Подпись называет, что показано в таблице, одной строкой.',
        'Образец: `<table>`, на следующей строке `<caption>Расписание консультаций</caption>`.'
      ]
    },
    {
      id: 'thead',
      label: 'В `thead` строка из трёх и более `th` с `scope="col"`',
      test: c => {
        const row = firstTable(c)?.tHead?.rows[0];
        return Boolean(row && row.cells.length >= 3 && [...row.cells].every(th => th.tagName === 'TH' && th.getAttribute('scope') === 'col'));
      },
      where: c => c.lineOf(/<thead\b/i) ?? c.lineOf(/<table\b/i),
      hints: [
        'Заголовки столбцов – первая строка таблицы внутри `thead`. Каждая ячейка в ней – `th` с `scope="col"`.',
        'Структура: `<thead>`, `<tr>`, три ячейки `<th scope="col">…</th>`, `</tr>`, `</thead>`.',
        'Образец ячейки: `<th scope="col">Время</th>`'
      ]
    },
    {
      id: 'tbody',
      label: 'В `tbody` не меньше двух строк данных',
      test: c => { const b = firstTable(c)?.tBodies[0]; return Boolean(b && b.rows.length >= 2 && [...b.rows].every(r => r.querySelector('td'))); },
      where: c => c.lineOf(/<tbody\b/i) ?? c.lineOf(/<\/thead\s*>/i),
      hints: [
        'Строки с данными размещаются в `tbody` после `thead`. В каждой строке есть ячейки данных `td`.',
        'Каждая строка – `<tr>…</tr>`, в ней по ячейке на каждый столбец.',
        'Образец строки: `<tr><th scope="row">Вторник</th><td>15:00</td><td>очно</td></tr>`'
      ]
    },
    {
      id: 'rowHeaders',
      label: 'Первая ячейка каждой строки `tbody` – `th` с `scope="row"`',
      test: c => {
        const b = firstTable(c)?.tBodies[0];
        return Boolean(b && b.rows.length && [...b.rows].every(r => r.cells[0]?.tagName === 'TH' && r.cells[0].getAttribute('scope') === 'row'));
      },
      where: c => c.lineOf(/<tbody\b/i),
      hints: [
        'Первая ячейка строки называет, о чём строка, и размечается как заголовок строки.',
        'Замените первую `td` в каждой строке `tbody` на `th` с атрибутом `scope="row"`.',
        'Было: `<td>Вторник</td>`. Стало: `<th scope="row">Вторник</th>`.'
      ]
    },
    {
      id: 'widths',
      label: 'Во всех строках одинаковое число ячеек',
      test: c => {
        const t = firstTable(c);
        if (!t || !t.rows.length) return false;
        const w = width(t.rows[0]);
        return [...t.rows].every(r => width(r) === w);
      },
      where: c => {
        const t = firstTable(c);
        if (!t) return null;
        const w = width(t.rows[0] || {});
        const bad = [...t.rows].find(r => width(r) !== w);
        const cell = bad?.cells[0]?.textContent.trim();
        const i = cell ? c.clean.indexOf(cell) : -1;
        return i >= 0 ? c.clean.slice(0, i).split('\n').length : null;
      },
      hints: [
        'В одной из строк ячеек больше или меньше, чем в строке заголовков. Таблица распадётся.',
        'Сосчитайте `th` и `td` в каждой строке. Объединённая ячейка с `colspan="2"` считается за две.',
        'Если значения нет, оставьте пустую ячейку `<td></td>` или поставьте в ней прочерк.'
      ]
    }
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    const table = [
      '<table>',
      '  <caption>Расписание консультаций</caption>',
      '  <thead>',
      '    <tr>',
      '      <th scope="col">День</th>',
      '      <th scope="col">Время</th>',
      '      <th scope="col">Формат</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <tr>',
      '      <th scope="row">Вторник</th>',
      '      <td>15:00–16:30</td>',
      '      <td>очно</td>',
      '    </tr>',
      '    <tr>',
      '      <th scope="row">Четверг</th>',
      '      <td>18:00–19:00</td>',
      '      <td>онлайн</td>',
      '    </tr>',
      '  </tbody>',
      '</table>'
    ];
    const raw = c.raw;
    const mainEnd = raw.search(/<\/main\s*>/i);
    const cut = raw.lastIndexOf('</section>', mainEnd);
    if (mainEnd === -1 || cut === -1) return raw;
    const lineStart = raw.lastIndexOf('\n', cut) + 1;
    const pad = raw.slice(lineStart, cut).match(/^\s*/)[0] + '  ';
    return raw.slice(0, lineStart) + table.map(l => pad + l).join('\n') + '\n' + raw.slice(lineStart);
  },

  quiz: [
    {
      q: 'Для каких данных подходит таблица?',
      options: [
        'Значения на пересечении строки и столбца',
        'Раскладка блоков страницы в две колонки',
        'Перечень пунктов без определённого порядка',
        'Последовательность шагов инструкции'
      ],
      correct: 0,
      explain: 'Таблица нужна, когда значение имеет смысл относительно своей строки и своего столбца. Раскладка – задача CSS, перечни и шаги – задача списков.'
    },
    {
      q: 'Что указывает атрибут `scope="col"` у `th`?',
      options: [
        'Заголовок относится к столбцу',
        'Ячейка занимает весь столбец',
        'Столбец выделяется другим цветом',
        'Столбец можно сортировать щелчком'
      ],
      correct: 0,
      explain: '`scope` связывает заголовок с ячейками: `col` – со столбцом под ним, `row` – со строкой справа от него. Объединение задаётся `colspan` и `rowspan`.'
    },
    {
      q: 'Где располагается `caption`?',
      options: [
        'Первым элементом внутри `table`',
        'Последним элементом внутри `table`',
        'Внутри первой строки `thead`',
        'Перед открывающим тегом `table`'
      ],
      correct: 0,
      explain: '`caption` – первый дочерний элемент `table`. Программа экранного доступа объявляет его до начала данных.'
    },
    {
      q: 'Какой атрибут растягивает ячейку на два столбца?',
      options: ['`colspan="2"`', '`rowspan="2"`', '`cols="2"`', '`span="2"`'],
      correct: 0,
      explain: '`colspan` объединяет ячейки по горизонтали, `rowspan` – по вертикали. Объединённая ячейка учитывается при подсчёте ячеек в строке.'
    },
    {
      q: 'Чем `th` отличается от `td` с полужирным текстом?',
      options: [
        'Связан с ячейками как их заголовок',
        'Автоматически выравнивается по центру',
        'Занимает больше места в строке таблицы',
        'Отображается только при печати таблицы'
      ],
      correct: 0,
      explain: 'Внешне разница в оформлении по умолчанию, но главное – смысл: `th` объявляется программой экранного доступа вместе со значениями своих ячеек.'
    }
  ],

  passScore: 0.8
};
