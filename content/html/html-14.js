/* ==================================================================
   Шаг html-14 · Типы полей и списки
   Продолжает страницу студента из шага 13 (starter: 'previous').
   ================================================================== */

import prevStep from './html-13.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';
import { formOf, fieldsOf, labelsCheck, labelsOk, lineOfField, replaceForm } from './forms.js';

export const FORM_14 = [
  '<form action="https://example.org/signup" method="post">',
  '  <p>',
  '    <label for="name">Имя</label>',
  '    <input type="text" id="name" name="name" autocomplete="name">',
  '  </p>',
  '  <p>',
  '    <label for="email">Электронная почта</label>',
  '    <input type="email" id="email" name="email" autocomplete="email">',
  '  </p>',
  '  <p>',
  '    <label for="phone">Телефон</label>',
  '    <input type="tel" id="phone" name="phone" autocomplete="tel">',
  '  </p>',
  '  <p>',
  '    <label for="date">Желаемая дата</label>',
  '    <input type="date" id="date" name="date">',
  '  </p>',
  '  <p>',
  '    <label for="format">Формат участия</label>',
  '    <select id="format" name="format">',
  '      <option value="offline">Очно</option>',
  '      <option value="online">Онлайн</option>',
  '      <option value="record">В записи</option>',
  '    </select>',
  '  </p>',
  '  <p>',
  '    <label for="topic">Интересующая тема</label>',
  '    <input type="text" id="topic" name="topic" list="topics">',
  '    <datalist id="topics">',
  '      <option value="Фонетика"></option>',
  '      <option value="Лексика"></option>',
  '      <option value="Грамматика"></option>',
  '    </datalist>',
  '  </p>',
  '  <p>',
  '    <label for="message">Комментарий</label>',
  '    <textarea id="message" name="message" rows="4"></textarea>',
  '  </p>',
  '  <button type="submit">Отправить заявку</button>',
  '</form>'
];

const typed = (c, t) => fieldsOf(formOf(c)).find(x => (x.getAttribute('type') || '').toLowerCase() === t);

export default {
  title: 'Типы полей и списки',

  theory: `
<h2>Типы полей и списки</h2>
<p class="lead">Атрибут <code>type</code> у <code>input</code> сообщает браузеру, какие данные ожидаются. От типа зависят клавиатура на телефоне, встроенный элемент выбора, автозаполнение и проверка введённого значения.</p>

<h3>Текстовые типы</h3>
<ul class="parts">
  <li><code class="parts__tag">type="email"</code>Адрес электронной почты. Браузер проверяет наличие <code>@</code>, на телефоне показывает клавиатуру с этим знаком.</li>
  <li><code class="parts__tag">type="tel"</code>Телефон. Формат номера не проверяется, так как он различается по странам, но на телефоне открывается цифровая клавиатура.</li>
  <li><code class="parts__tag">type="url"</code>Адрес сайта с протоколом.</li>
  <li><code class="parts__tag">type="number"</code>Число со стрелками увеличения. Подходит для количества, но не для номеров телефонов, индексов и кодов: в них важны ведущие нули, а не величина.</li>
  <li><code class="parts__tag">type="search"</code>Поле поиска с кнопкой очистки.</li>
</ul>

<h3>Выбор значения</h3>
<ul class="parts">
  <li><code class="parts__tag">type="date"</code>Дата с календарём браузера. Значение всегда передаётся в формате <code>ГГГГ-ММ-ДД</code>, а отображается по правилам языка и региона пользователя. Для локализации это важное различие: формат хранения и формат показа разделены.</li>
  <li><code class="parts__tag">type="time"</code>Время.</li>
  <li><code class="parts__tag">type="color"</code>Цвет из системной палитры, значение в шестнадцатеричной записи.</li>
  <li><code class="parts__tag">type="range"</code>Ползунок для приблизительного значения в диапазоне <code>min</code>–<code>max</code>.</li>
  <li><code class="parts__tag">type="file"</code>Выбор файла; атрибут <code>accept</code> ограничивает типы, например <code>accept=".pdf"</code>. Для отправки файлов форме нужен <code>enctype="multipart/form-data"</code>.</li>
</ul>

<h3>Выпадающий список select</h3>
<pre><code>&lt;label for="format"&gt;Формат участия&lt;/label&gt;
&lt;select id="format" name="format"&gt;
  &lt;option value="offline"&gt;Очно&lt;/option&gt;
  &lt;option value="online"&gt;Онлайн&lt;/option&gt;
&lt;/select&gt;</code></pre>
<p><code>select</code> ограничивает выбор заданными вариантами. <code>value</code> у <code>option</code> – значение для обработчика, текст – то, что видит пользователь. Связанные варианты группируются элементом <code>optgroup</code> с атрибутом <code>label</code>.</p>

<h3>Подсказки datalist</h3>
<p><code>datalist</code> предлагает варианты, но не ограничивает ввод: пользователь может выбрать подсказку или написать своё значение. Список связывается с полем атрибутом <code>list</code>, равным <code>id</code> списка.</p>
<pre><code>&lt;input type="text" id="topic" name="topic" list="topics"&gt;
&lt;datalist id="topics"&gt;
  &lt;option value="Фонетика"&gt;&lt;/option&gt;
  &lt;option value="Лексика"&gt;&lt;/option&gt;
&lt;/datalist&gt;</code></pre>

<h3>Автозаполнение</h3>
<p>Атрибут <code>autocomplete</code> подсказывает браузеру, какие сохранённые данные подставить: <code>name</code>, <code>email</code>, <code>tel</code>, <code>street-address</code>, <code>bday</code>. Автозаполнение сокращает ввод и число ошибок, особенно на телефоне.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li><code>type="number"</code> для телефона или индекса;</li>
    <li>дата вводится текстом в произвольном формате вместо <code>type="date"</code>;</li>
    <li><code>select</code> на два варианта, где понятнее переключатели;</li>
    <li><code>list</code> у поля не совпадает с <code>id</code> у <code>datalist</code>.</li>
  </ul>
</div>
`,

  task: [
    'Доработайте форму из шага 13.',
    'Замените тип поля электронной почты на `email`. Добавьте поле телефона `tel` и поле даты `date`. Добавьте выпадающий список `select` не меньше чем из трёх вариантов и текстовое поле с подсказками `datalist` не меньше чем из трёх вариантов. Полям имени, почты и телефона задайте `autocomplete` со значениями `name`, `email` и `tel`. У всех новых полей – подписи `label`, `id` и `name`.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(13, 'форма с `action`, подписанными полями и кнопкой отправки',
      c => Boolean(formOf(c)?.querySelector('button[type="submit" i]')) && labelsOk(c) && fieldsOf(formOf(c)).length >= 3),
    {
      id: 'email',
      label: 'Поле почты имеет `type="email"`',
      test: c => Boolean(typed(c, 'email')),
      where: c => c.lineOf(/<input\b[^>]*(id|name)\s*=\s*["']?e-?mail/i) ?? c.lineOf(/<form\b/i),
      hints: [
        'Для адреса почты предназначен отдельный тип поля: браузер проверит наличие `@`.',
        'Измените значение `type` у поля почты с `text` на `email`.',
        'Образец: `<input type="email" id="email" name="email" autocomplete="email">`'
      ]
    },
    {
      id: 'telDate',
      label: 'Есть поля `type="tel"` и `type="date"`',
      test: c => Boolean(typed(c, 'tel') && typed(c, 'date')),
      where: c => c.lineOf(/<\/form\s*>/i),
      hints: [
        'Нужны ещё два поля: телефон и дата, каждое со своей подписью.',
        'Для телефона – `type="tel"` (не `number`), для даты – `type="date"`: браузер покажет календарь.',
        'Образец: `<label for="date">Желаемая дата</label>` и `<input type="date" id="date" name="date">`'
      ]
    },
    {
      id: 'select',
      label: 'Есть `select` с тремя и более `option`',
      test: c => fieldsOf(formOf(c)).some(x => x.tagName === 'SELECT' && x.querySelectorAll('option').length >= 3),
      where: c => c.lineOf(/<select\b/i) ?? c.lineOf(/<\/form\s*>/i),
      hints: [
        'Выпадающий список – парный элемент `select`, внутри него варианты `option`.',
        'У каждого `option` есть `value` для обработчика и текст для пользователя. `select` получает `id`, `name` и подпись.',
        'Образец: `<select id="format" name="format">`, три строки вида `<option value="online">Онлайн</option>`, `</select>`.'
      ]
    },
    {
      id: 'datalist',
      label: 'Есть поле с `list`, связанное с `datalist` из трёх и более вариантов',
      test: c => fieldsOf(formOf(c)).some(x => {
        const id = x.getAttribute('list');
        const dl = id && c.doc.getElementById(id);
        return dl && dl.tagName === 'DATALIST' && dl.querySelectorAll('option[value]').length >= 3;
      }),
      where: c => c.lineOf(/<datalist\b/i) ?? c.lineOf(/\slist\s*=/i) ?? c.lineOf(/<\/form\s*>/i),
      hints: [
        'Подсказки задаются элементом `datalist` с `id`, а поле ссылается на него атрибутом `list` с тем же значением.',
        'Варианты `datalist` записываются как `<option value="…"></option>` – значение в атрибуте `value`.',
        'Образец: `<input type="text" id="topic" name="topic" list="topics">` и `<datalist id="topics">…</datalist>`'
      ]
    },
    {
      id: 'autocomplete',
      label: 'У полей имени, почты и телефона `autocomplete` = `name`, `email`, `tel`',
      test: c => {
        const vals = fieldsOf(formOf(c)).map(x => (x.getAttribute('autocomplete') || '').toLowerCase().trim().split(/\s+/).pop());
        return ['name', 'email', 'tel'].every(v => vals.includes(v));
      },
      where: c => { const e = typed(c, 'email'); return e ? lineOfField(c, e) : null; },
      hints: [
        'Атрибут `autocomplete` подсказывает браузеру, какие сохранённые данные подставить в поле.',
        'Значения стандартные: `name` для имени, `email` для почты, `tel` для телефона.',
        'Образец: `<input type="tel" id="phone" name="phone" autocomplete="tel">`'
      ]
    },
    labelsCheck()
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    return replaceForm(c, FORM_14) ?? c.raw;
  },

  quiz: [
    {
      q: 'Какой тип поля подходит для номера телефона?',
      options: ['`tel`', '`number`', '`text`', '`digits`'],
      correct: 0,
      explain: '`tel` открывает на телефоне цифровую клавиатуру и не превращает номер в число. `number` для телефонов не подходит: ведущие нули и знак `+` теряют смысл.'
    },
    {
      q: 'В каком формате браузер передаёт значение поля `type="date"`?',
      options: [
        '`ГГГГ-ММ-ДД` независимо от языка',
        '`ДД.ММ.ГГГГ` для русского языка',
        'В формате, выбранном в системе',
        'Числом дней от 1 января 1970 года'
      ],
      correct: 0,
      explain: 'Показ даты зависит от языка и региона пользователя, а передаваемое значение всегда в формате `ГГГГ-ММ-ДД`. Это разделение упрощает обработку и локализацию.'
    },
    {
      q: 'Чем `datalist` отличается от `select`?',
      options: [
        'Предлагает варианты, но разрешает свой ввод',
        'Позволяет выбрать сразу несколько вариантов',
        'Показывает варианты в виде переключателей',
        'Работает только в полях `type="search"`'
      ],
      correct: 0,
      explain: '`select` ограничивает ответ заданными вариантами. `datalist` лишь подсказывает, и пользователь может ввести собственное значение.'
    },
    {
      q: 'Как связать поле с `datalist`?',
      options: [
        '`list` у поля равен `id` у `datalist`',
        '`name` у поля равен `id` у `datalist`',
        '`for` у `datalist` равен `id` у поля',
        '`datalist` вкладывается в сам `input`'
      ],
      correct: 0,
      explain: 'Атрибут `list` поля указывает на `id` списка подсказок. `input` – пустой элемент, вложить в него ничего нельзя.'
    },
    {
      q: 'Что даёт атрибут `autocomplete="email"`?',
      options: [
        'Браузер предложит сохранённый адрес',
        'Браузер проверит, что адрес существует',
        'Поле станет обязательным для заполнения',
        'Адрес будет скрыт звёздочками при вводе'
      ],
      correct: 0,
      explain: '`autocomplete` сообщает назначение поля, и браузер подставляет сохранённые данные. Проверка формата – задача `type`, обязательность – задача `required`.'
    }
  ],

  passScore: 0.8
};
