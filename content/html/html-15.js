/* ==================================================================
   Шаг html-15 · Встроенная проверка
   Продолжает страницу студента из шага 14 (starter: 'previous').
   ================================================================== */

import prevStep from './html-14.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';
import { formOf, fieldsOf, labelsCheck, labelsOk, labelText, lineOfField, replaceForm } from './forms.js';

export const FORM_15 = [
  '<form action="https://example.org/signup" method="post">',
  '  <p>',
  '    <label for="name">Имя (обязательное поле)</label>',
  '    <input type="text" id="name" name="name" autocomplete="name" required minlength="2">',
  '  </p>',
  '  <p>',
  '    <label for="email">Электронная почта (обязательное поле)</label>',
  '    <input type="email" id="email" name="email" autocomplete="email" required>',
  '  </p>',
  '  <p>',
  '    <label for="phone">Телефон в формате +7XXXXXXXXXX</label>',
  '    <input type="tel" id="phone" name="phone" autocomplete="tel"',
  '           pattern="\\+7[0-9]{10}" title="Знак + и 11 цифр без пробелов, например +79001234567">',
  '  </p>',
  '  <p>',
  '    <label for="date">Желаемая дата</label>',
  '    <input type="date" id="date" name="date" min="2026-10-01" max="2026-12-25">',
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
  '  <fieldset>',
  '    <legend>Удобное время</legend>',
  '    <label><input type="radio" name="time" value="morning" checked> Утро</label>',
  '    <label><input type="radio" name="time" value="evening"> Вечер</label>',
  '  </fieldset>',
  '  <p>',
  '    <label for="message">Комментарий, не больше 500 знаков</label>',
  '    <textarea id="message" name="message" rows="4" maxlength="500"></textarea>',
  '  </p>',
  '  <button type="submit">Отправить заявку</button>',
  '</form>'
];

const REQUIRED_MARK = /обязательн|\*/i;
const typed = (c, t) => fieldsOf(formOf(c)).find(x => (x.getAttribute('type') || '').toLowerCase() === t);

function radioGroup(c) {
  const form = formOf(c);
  if (!form) return null;
  return [...form.querySelectorAll('fieldset')].find(fs => {
    const legend = fs.firstElementChild?.tagName === 'LEGEND' && fs.firstElementChild.textContent.trim().length >= 3;
    const radios = [...fs.querySelectorAll('input[type="radio" i]')];
    const names = new Set(radios.map(r => r.getAttribute('name')));
    return legend && radios.length >= 2 && names.size === 1 && [...names][0] && radios.every(r => labelText(c, r).length >= 2);
  });
}

function validPattern(p) {
  try { new RegExp(`^(?:${p})$`, 'v'); return true; } catch {
    try { new RegExp(`^(?:${p})$`, 'u'); return true; } catch { return false; }
  }
}

export default {
  title: 'Встроенная проверка',

  theory: `
<h2>Встроенная проверка</h2>
<p class="lead">Браузер умеет проверять поля формы до отправки: заполнено ли обязательное поле, соответствует ли значение типу, укладывается ли оно в заданные границы. При ошибке отправка останавливается, а рядом с полем появляется сообщение на языке браузера пользователя.</p>

<h3>Обязательные поля</h3>
<p>Атрибут <code>required</code> делает поле обязательным. Обязательность обозначается и в тексте подписи – словами «обязательное поле» или звёздочкой с пояснением в начале формы. Цвет или звёздочка без пояснения не воспринимаются программой экранного доступа и не всем понятны.</p>
<pre><code>&lt;label for="email"&gt;Электронная почта (обязательное поле)&lt;/label&gt;
&lt;input type="email" id="email" name="email" required&gt;</code></pre>

<h3>Ограничения значения</h3>
<ul class="parts">
  <li><code class="parts__tag">minlength, maxlength</code>Наименьшая и наибольшая длина текста в знаках. <code>maxlength</code> не даёт ввести лишнее, поэтому о пределе сообщают в подписи.</li>
  <li><code class="parts__tag">min, max, step</code>Границы и шаг для чисел, дат и времени. Для даты значения записываются в формате <code>ГГГГ-ММ-ДД</code>: <code>min="2026-10-01"</code>.</li>
  <li><code class="parts__tag">pattern</code>Регулярное выражение, которому должно соответствовать значение целиком. Формат объясняется в подписи или атрибуте <code>title</code>: браузер добавляет текст <code>title</code> в сообщение об ошибке.</li>
</ul>
<pre><code>&lt;label for="phone"&gt;Телефон в формате +7XXXXXXXXXX&lt;/label&gt;
&lt;input type="tel" id="phone" name="phone"
       pattern="\\+7[0-9]{10}"
       title="Знак + и 11 цифр без пробелов"&gt;</code></pre>
<p>В записи <code>\\+7[0-9]{10}</code> обратная косая черта отменяет особый смысл знака <code>+</code>, <code>[0-9]</code> означает любую цифру, <code>{10}</code> – ровно десять повторений.</p>

<h3>Группы полей</h3>
<p><code>fieldset</code> объединяет связанные поля, <code>legend</code> – первый элемент внутри – называет группу. Для переключателей это обязательно: вопрос записывается в <code>legend</code>, варианты – в подписях отдельных переключателей. Программа экранного доступа читает название группы вместе с каждым вариантом.</p>
<pre><code>&lt;fieldset&gt;
  &lt;legend&gt;Удобное время&lt;/legend&gt;
  &lt;label&gt;&lt;input type="radio" name="time" value="morning"&gt; Утро&lt;/label&gt;
  &lt;label&gt;&lt;input type="radio" name="time" value="evening"&gt; Вечер&lt;/label&gt;
&lt;/fieldset&gt;</code></pre>
<p>Переключатели <code>type="radio"</code> с одинаковым <code>name</code> образуют группу, в которой выбирается только один вариант. Флажки <code>type="checkbox"</code> выбираются независимо. Атрибут <code>checked</code> отмечает вариант по умолчанию.</p>

<h3>Пределы встроенной проверки</h3>
<p>Проверка в браузере помогает пользователю, но не защищает данные: её можно отключить атрибутом <code>novalidate</code> у формы или обойти. Обработчик на сервере всегда проверяет данные повторно. Оформление полей с ошибкой и собственные тексты сообщений задаются в CSS и JavaScript – это темы следующих модулей.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li><code>required</code> без обозначения в подписи;</li>
    <li><code>pattern</code> без объяснения формата – сообщение об ошибке непонятно;</li>
    <li>у переключателей разные <code>name</code>, и выбрать можно несколько;</li>
    <li>вопрос группы записан абзацем вместо <code>legend</code>.</li>
  </ul>
</div>
`,

  task: [
    'Доработайте форму из шага 14.',
    'Сделайте поля имени и почты обязательными (`required`) и обозначьте это в тексте их подписей. Ограничьте длину комментария атрибутом `maxlength` и укажите предел в подписи. Задайте полю телефона `pattern` и объясните формат в атрибуте `title`. Ограничьте поле даты атрибутом `min`. Добавьте группу `fieldset` с заголовком `legend` и не меньше чем двумя переключателями `radio` с общим `name`, у каждого – подпись.',
    'В окне результата попробуйте отправить форму с пустыми и неверными значениями: браузер покажет сообщения об ошибках.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(14, 'форма с полями `email`, `tel`, `date`, `select` и `datalist`',
      c => Boolean(typed(c, 'email') && typed(c, 'tel') && typed(c, 'date') && formOf(c)?.querySelector('select'))),
    {
      id: 'required',
      label: 'Не меньше двух полей с `required`, обязательность указана в подписи',
      test: c => {
        const req = fieldsOf(formOf(c)).filter(x => x.hasAttribute('required'));
        return req.length >= 2 && req.every(x => REQUIRED_MARK.test(labelText(c, x)));
      },
      where: c => {
        const bad = fieldsOf(formOf(c)).find(x => x.hasAttribute('required') && !REQUIRED_MARK.test(labelText(c, x)));
        return bad ? lineOfField(c, bad) : c.lineOf(/<form\b/i);
      },
      hints: [
        'Отметьте атрибутом `required` поля имени и почты и сообщите об этом в тексте подписей.',
        '`required` пишется без значения в теге поля. В подпись добавьте слова «обязательное поле» или звёздочку.',
        'Образец: `<label for="email">Электронная почта (обязательное поле)</label>` и `required` у поля.'
      ]
    },
    {
      id: 'maxlength',
      label: 'У `textarea` есть `maxlength`, предел указан в подписи',
      test: c => fieldsOf(formOf(c)).some(x => x.tagName === 'TEXTAREA' && /^\d+$/.test(x.getAttribute('maxlength') || '') &&
        labelText(c, x).includes(x.getAttribute('maxlength'))),
      where: c => c.lineOf(/<textarea\b/i),
      hints: [
        'Атрибут `maxlength` не даёт ввести лишние знаки. Пользователь должен знать предел заранее.',
        'Добавьте `maxlength` с числом к `textarea` и то же число – в текст подписи.',
        'Образец: `<label for="message">Комментарий, не больше 500 знаков</label>` и `maxlength="500"`.'
      ]
    },
    {
      id: 'pattern',
      label: 'У поля телефона есть корректный `pattern` и пояснение в `title`',
      test: c => {
        const t = typed(c, 'tel');
        const p = t?.getAttribute('pattern');
        return Boolean(p && validPattern(p) && (t.getAttribute('title') || '').trim().length >= 10);
      },
      where: c => { const t = typed(c, 'tel'); return t ? lineOfField(c, t) : null; },
      hints: [
        '`pattern` задаёт формат значения регулярным выражением, `title` объясняет формат человеческим языком.',
        'Знак `+` в выражении пишется с обратной косой чертой: `\\+`. `[0-9]{10}` – ровно десять цифр. Проверьте, что скобки закрыты.',
        'Образец: `pattern="\\+7[0-9]{10}" title="Знак + и 11 цифр без пробелов, например +79001234567"`'
      ]
    },
    {
      id: 'dateMin',
      label: 'У поля даты есть `min` в формате `ГГГГ-ММ-ДД`',
      test: c => /^\d{4}-\d{2}-\d{2}$/.test((typed(c, 'date')?.getAttribute('min') || '').trim()),
      where: c => { const d = typed(c, 'date'); return d ? lineOfField(c, d) : null; },
      hints: [
        'Атрибут `min` не даёт выбрать дату раньше указанной.',
        'Дата в атрибуте записывается как год, месяц и день через дефисы, с ведущими нулями.',
        'Образец: `<input type="date" id="date" name="date" min="2026-10-01">`'
      ]
    },
    {
      id: 'fieldset',
      label: 'Есть `fieldset` с `legend` и двумя и более `radio` с общим `name`, у каждого подпись',
      test: c => Boolean(radioGroup(c)),
      where: c => c.lineOf(/<fieldset\b/i) ?? c.lineOf(/type\s*=\s*["']?radio/i) ?? c.lineOf(/<button\b/i),
      hints: [
        'Группа переключателей оформляется `fieldset`, первым элементом внутри – `legend` с вопросом.',
        'У всех `radio` группы одинаковый `name` и разные `value`. Каждый переключатель вложен в свою подпись `label`.',
        'Образец: `<fieldset>`, `<legend>Удобное время</legend>`, `<label><input type="radio" name="time" value="morning"> Утро</label>`, ещё один вариант, `</fieldset>`.'
      ]
    },
    labelsCheck()
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    return replaceForm(c, FORM_15) ?? c.raw;
  },

  quiz: [
    {
      q: 'Что делает атрибут `required`?',
      options: [
        'Не даёт отправить форму с пустым полем',
        'Выделяет поле красной рамкой при загрузке',
        'Добавляет звёздочку к подписи поля',
        'Проверяет формат значения по образцу'
      ],
      correct: 0,
      explain: 'Браузер остановит отправку и покажет сообщение. Звёздочку и пояснение в подписи автор добавляет сам, формат проверяют `type` и `pattern`.'
    },
    {
      q: 'Как объяснить пользователю формат, заданный `pattern`?',
      options: [
        'В подписи или атрибуте `title`',
        'В атрибуте `name` этого поля',
        'В атрибуте `value` этого поля',
        'Объяснять не нужно, браузер сам'
      ],
      correct: 0,
      explain: 'Браузер сообщит только, что значение не соответствует формату. Текст `title` он добавит в сообщение, а подпись видна сразу.'
    },
    {
      q: 'Зачем переключателям `radio` одинаковый `name`?',
      options: [
        'Чтобы выбирался только один вариант',
        'Чтобы все варианты выбирались сразу',
        'Чтобы подписи стояли справа от них',
        'Чтобы варианты стали обязательными'
      ],
      correct: 0,
      explain: 'Переключатели с общим `name` образуют группу: выбор одного снимает выбор с остальных. Под этим именем значение и уйдёт обработчику.'
    },
    {
      q: 'Где записывается вопрос к группе переключателей?',
      options: [
        'В `legend` внутри `fieldset`',
        'В `label` первого переключателя',
        'В `title` элемента `fieldset`',
        'В абзаце `p` перед группой'
      ],
      correct: 0,
      explain: '`legend` называет группу, и программа экранного доступа читает его вместе с каждым вариантом. Абзац перед группой с вариантами не связан.'
    },
    {
      q: 'Почему встроенной проверки недостаточно для защиты данных?',
      options: [
        'Её можно отключить или обойти',
        'Она работает только в Chrome',
        'Она не проверяет поля `email`',
        'Она срабатывает после отправки'
      ],
      correct: 0,
      explain: 'Проверка в браузере – подсказка пользователю. Атрибут `novalidate` или прямой запрос к обработчику её минуют, поэтому сервер проверяет данные повторно.'
    }
  ],

  passScore: 0.8
};
