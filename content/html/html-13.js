/* ==================================================================
   Шаг html-13 · Основа формы
   Продолжает страницу студента из шага 12 (starter: 'previous').
   ================================================================== */

import prevStep from './html-12.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';
import { formOf, fieldsOf, labelsCheck, namesOk, lineOfField, insertBeforeMainEnd } from './forms.js';

export const FORM_13 = [
  '<section id="signup">',
  '  <h2>Запись</h2>',
  '  <form action="https://example.org/signup" method="post">',
  '    <p>',
  '      <label for="name">Имя</label>',
  '      <input type="text" id="name" name="name">',
  '    </p>',
  '    <p>',
  '      <label for="email">Электронная почта</label>',
  '      <input type="text" id="email" name="email">',
  '    </p>',
  '    <p>',
  '      <label for="message">Комментарий</label>',
  '      <textarea id="message" name="message" rows="4"></textarea>',
  '    </p>',
  '    <button type="submit">Отправить заявку</button>',
  '  </form>',
  '</section>'
];

export default {
  title: 'Основа формы',

  theory: `
<h2>Основа формы</h2>
<p class="lead">Форма собирает данные пользователя и передаёт их обработчику – программе на сервере или внешнему сервису. HTML описывает поля, их подписи и способ отправки, а браузер берёт на себя ввод, проверку и доступность с клавиатуры.</p>

<h3>Элемент form</h3>
<pre><code>&lt;form action="https://example.org/signup" method="post"&gt;
  …поля и кнопка…
&lt;/form&gt;</code></pre>
<ul>
  <li><code>action</code> – адрес обработчика, которому браузер отправит данные.</li>
  <li><code>method</code> – способ отправки. <code>get</code> добавляет данные к адресу после знака <code>?</code>: подходит для поиска и фильтров, результат можно сохранить в закладки. <code>post</code> передаёт данные в теле запроса: подходит для заявок, регистрации, всего, что меняет данные на сервере.</li>
</ul>
<p>GitHub Pages размещает только статические файлы и не обрабатывает формы. Для работающей формы на таком сайте в <code>action</code> указывают адрес внешнего сервиса приёма заявок. В учебных заданиях достаточно условного адреса: в песочнице отправка отключена.</p>

<h3>Подпись и поле</h3>
<p>Каждое поле имеет видимую подпись <code>label</code>. Подпись связывается с полем одним из двух способов:</p>
<pre><code>&lt;label for="email"&gt;Электронная почта&lt;/label&gt;
&lt;input type="text" id="email" name="email"&gt;

&lt;label&gt;Имя &lt;input type="text" name="name"&gt;&lt;/label&gt;</code></pre>
<p>Связанная подпись делает поле кликабельным по тексту подписи, что важно на сенсорных экранах, и позволяет программе экранного доступа прочитать название поля при переходе к нему. Подсказка <code>placeholder</code> подпись не заменяет: она исчезает при вводе, имеет низкий контраст и не всегда читается программами экранного доступа.</p>

<h3>Атрибуты id и name</h3>
<p><code>id</code> связывает поле с подписью и должен быть уникальным на странице. <code>name</code> – имя, под которым значение поля уйдёт обработчику. Поле без <code>name</code> не отправляется, даже если заполнено. Значения <code>id</code> и <code>name</code> часто совпадают, но выполняют разные задачи.</p>

<h3>Однострочное и многострочное поле</h3>
<p><code>input</code> – пустой элемент для однострочного ввода; вид поля определяется атрибутом <code>type</code>, по умолчанию <code>text</code>. <code>textarea</code> – парный элемент для многострочного текста; атрибут <code>rows</code> задаёт начальную высоту в строках.</p>

<h3>Кнопки</h3>
<ul>
  <li><code>&lt;button type="submit"&gt;</code> – отправляет форму;</li>
  <li><code>&lt;button type="reset"&gt;</code> – очищает все поля; пользователи нажимают её по ошибке, поэтому в современных формах она почти не встречается;</li>
  <li><code>&lt;button type="button"&gt;</code> – кнопка без действия по умолчанию, для сценариев на JavaScript.</li>
</ul>
<p>Если <code>type</code> не указан, кнопка внутри формы считается кнопкой отправки. Поэтому тип указывают явно. Текст кнопки называет действие: «Отправить заявку», «Записаться на занятие».</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>подпись есть, но не связана с полем: <code>for</code> не совпадает с <code>id</code>;</li>
    <li><code>placeholder</code> вместо подписи;</li>
    <li>поле без <code>name</code> – данные не отправляются;</li>
    <li>кнопка без <code>type</code> внутри формы неожиданно отправляет данные.</li>
  </ul>
</div>
`,

  task: [
    'Добавьте в `main` новый раздел `section` с заголовком `h2` и формой обратной связи или записи по теме проекта.',
    'У формы укажите `action` (условный адрес `https://`) и `method="post"`. Добавьте не меньше трёх полей: два однострочных `input` и одно многострочное `textarea`. У каждого поля – связанная подпись `label`, уникальный `id` и `name`. Завершите форму кнопкой `button` с `type="submit"` и текстом, который называет действие.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(12, '`header`, `main` с разделами, таблица, блоки `details`, `footer`',
      c => Boolean(c.q('body > header nav') && c.q('body > main section table') && c.q('body > main details summary') && c.q('body > footer'))),
    {
      id: 'form',
      label: 'В разделе `section` внутри `main` есть `form` с `action` и `method="post"`',
      test: c => {
        const f = formOf(c);
        return Boolean(f && (f.getAttribute('action') || '').trim() && /^post$/i.test(f.getAttribute('method') || '') &&
          f.closest('section')?.firstElementChild?.tagName === 'H2');
      },
      where: c => c.lineOf(/<form\b/i) ?? c.lineOf(/<\/main\s*>/i),
      hints: [
        'Форма стоит в отдельном разделе `section` с заголовком `h2` внутри `main`. У открывающего тега `form` два атрибута.',
        '`action` – адрес обработчика, например `https://example.org/signup`. `method="post"` – способ отправки для заявок.',
        'Образец: `<form action="https://example.org/signup" method="post">`'
      ]
    },
    {
      id: 'fields',
      label: 'В форме не меньше двух `input` и одно `textarea`',
      test: c => {
        const f = fieldsOf(formOf(c));
        return f.filter(x => x.tagName === 'INPUT').length >= 2 && f.some(x => x.tagName === 'TEXTAREA');
      },
      where: c => c.lineOf(/<form\b/i),
      hints: [
        'Нужны однострочные поля `input` для коротких ответов и одно многострочное `textarea` для комментария.',
        '`input` – пустой элемент с атрибутом `type`. `textarea` – парный, закрывающий тег пишется сразу, без пробелов внутри.',
        'Образец: `<input type="text" id="name" name="name">` и `<textarea id="message" name="message" rows="4"></textarea>`'
      ]
    },
    labelsCheck(),
    {
      id: 'names',
      label: 'У каждого поля есть `name`, у каждого `id` – уникальное значение',
      test: c => {
        const f = fieldsOf(formOf(c));
        const ids = f.map(x => x.getAttribute('id')).filter(Boolean);
        return f.length > 0 && namesOk(c) && new Set(ids).size === ids.length;
      },
      where: c => {
        const bad = fieldsOf(formOf(c)).find(x => !(x.getAttribute('name') || '').trim());
        return bad ? lineOfField(c, bad) : c.lineOf(/<form\b/i);
      },
      hints: [
        'Поле без `name` не отправляется. Значения `id` на странице не повторяются.',
        'Добавьте каждому полю `name` латиницей: `name`, `email`, `message`. Проверьте, что `id` не совпадают с `id` разделов страницы.',
        'Образец: `<input type="text" id="email" name="email">`'
      ]
    },
    {
      id: 'submit',
      label: 'Есть кнопка `button type="submit"`; у всех кнопок тип указан явно',
      test: c => {
        const f = formOf(c);
        const buttons = f ? [...f.querySelectorAll('button')] : [];
        return buttons.length > 0 && buttons.every(b => b.hasAttribute('type')) &&
          buttons.some(b => /^submit$/i.test(b.getAttribute('type')) && b.textContent.trim().length >= 3);
      },
      where: c => c.lineOf(/<button\b/i) ?? c.lineOf(/<\/form\s*>/i),
      hints: [
        'Форме нужна кнопка отправки. У каждой кнопки атрибут `type` указывается явно.',
        'Текст кнопки называет действие: «Отправить заявку», «Записаться».',
        'Образец: `<button type="submit">Отправить заявку</button>` перед `</form>`.'
      ]
    }
  ],

  solution: c0 => insertBeforeMainEnd(baseFor(c0, prevStep, makeContext), FORM_13),

  quiz: [
    {
      q: 'Что произойдёт с заполненным полем без атрибута `name`?',
      options: [
        'Его значение не будет отправлено',
        'Браузер не даст отправить форму',
        'Поле будет отправлено под своим `id`',
        'Поле будет отправлено под текстом `label`'
      ],
      correct: 0,
      explain: 'Обработчик получает пары «имя – значение». Поле без `name` в эти пары не попадает.'
    },
    {
      q: 'Как связать подпись с полем?',
      options: [
        '`for` у `label` равен `id` у поля',
        '`name` у `label` равен `name` у поля',
        '`label` ставится сразу после поля',
        '`title` у поля повторяет подпись'
      ],
      correct: 0,
      explain: 'Связь задаётся атрибутами `for` и `id` или вложением поля внутрь `label`. Соседство в коде связи не создаёт.'
    },
    {
      q: 'Почему `placeholder` не заменяет подпись?',
      options: [
        'Он исчезает при вводе текста',
        'Он не отображается в браузерах',
        'Он отправляется вместе с данными',
        'Он запрещён в полях типа `text`'
      ],
      correct: 0,
      explain: 'После начала ввода подсказка пропадает, и пользователь не видит, что за поле он заполняет. К тому же у неё низкий контраст.'
    },
    {
      q: 'Какой тип получит `button` внутри формы без атрибута `type`?',
      options: ['`submit`', '`button`', '`reset`', '`none`'],
      correct: 0,
      explain: 'По умолчанию кнопка внутри формы отправляет её. Поэтому тип указывают явно, особенно у кнопок, которые не должны отправлять данные.'
    },
    {
      q: 'Какой `method` подходит для формы записи на занятие?',
      options: [
        '`post`, данные в теле запроса',
        '`get`, данные в адресе страницы',
        '`put`, данные в заголовках',
        '`send`, данные в теле письма'
      ],
      correct: 0,
      explain: '`get` уместен для поиска и фильтров. Заявки и регистрация отправляются методом `post`: данные не попадают в адрес и историю браузера. В HTML-формах поддерживаются только `get` и `post`.'
    }
  ],

  passScore: 0.8
};
