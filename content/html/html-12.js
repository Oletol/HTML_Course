/* ==================================================================
   Шаг html-12 · Раскрывающиеся блоки
   Продолжает страницу студента из шага 11 (starter: 'previous').
   ================================================================== */

import prevStep from './html-11.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';

function faqSection(c) {
  return c.qa('body > main section').find(s => s.firstElementChild?.tagName === 'H2' &&
    s.querySelectorAll(':scope > details').length >= 3);
}
const detailsOf = c => { const s = faqSection(c); return s ? [...s.querySelectorAll(':scope > details')] : []; };
const bodyText = d => [...d.childNodes].filter(n => !(n.nodeType === 1 && n.tagName === 'SUMMARY'))
  .map(n => n.textContent).join(' ').trim();

export default {
  title: 'Раскрывающиеся блоки',

  theory: `
<h2>Раскрывающиеся блоки</h2>
<p class="lead">Пара элементов <code>details</code> и <code>summary</code> создаёт блок, который раскрывается и сворачивается по щелчку без единой строки JavaScript. Так оформляют ответы на частые вопросы, примечания, подробности, которые нужны не каждому читателю.</p>

<h3>Устройство блока</h3>
<pre><code>&lt;details&gt;
  &lt;summary&gt;Нужен ли опыт для участия?&lt;/summary&gt;
  &lt;p&gt;Нет, занятия рассчитаны на начинающих.&lt;/p&gt;
&lt;/details&gt;</code></pre>
<p><code>summary</code> – первый дочерний элемент <code>details</code>, видимая надпись-переключатель. Всё остальное содержимое <code>details</code> скрыто, пока блок свёрнут. Браузер сам делает <code>summary</code> доступным с клавиатуры: переключатель получает фокус по Tab и срабатывает по Enter и пробелу.</p>

<h3>Атрибуты</h3>
<ul>
  <li><code>open</code> – блок раскрыт при загрузке страницы. Браузер добавляет и убирает этот атрибут, когда пользователь переключает блок.</li>
  <li><code>name</code> – объединяет блоки в группу, в которой одновременно раскрыт только один: <code>&lt;details name="faq"&gt;</code>. Так получается аккордеон без скриптов. Атрибут поддерживается современными браузерами; в старых блоки просто раскрываются независимо.</li>
</ul>

<h3>Содержимое summary</h3>
<p>Текст <code>summary</code> формулируется так, чтобы по нему было понятно содержание блока: вопрос целиком, а не «Подробнее». Внутрь <code>summary</code> не помещают ссылки и кнопки: переключатель сам является интерактивным элементом, и вложенные элементы управления конфликтуют с ним.</p>

<h3>Когда не стоит скрывать содержание</h3>
<p>Свёрнутый текст не виден при быстром просмотре страницы и может не найтись поиском по странице в некоторых браузерах. Основную информацию – цены, сроки, условия – оставляют открытой. В раскрывающиеся блоки выносят то, что нужно части читателей.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li><code>summary</code> стоит не первым элементом внутри <code>details</code>;</li>
    <li>надпись переключателя «Подробнее» не сообщает, что скрыто;</li>
    <li>в <code>summary</code> вложена ссылка или кнопка;</li>
    <li>в свёрнутые блоки убрана основная информация страницы.</li>
  </ul>
</div>
`,

  task: [
    'Добавьте в `main` своей страницы новый раздел `section` с заголовком `h2` «Частые вопросы».',
    'В нём разместите не меньше трёх блоков `details`: в каждом первым элементом `summary` с вопросом, а после него абзац с ответом. Один блок сделайте раскрытым при загрузке атрибутом `open`. Объедините блоки в группу общим атрибутом `name`, чтобы одновременно был раскрыт только один.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(11, '`header`, `main` с разделами, таблица с `caption`, `footer`',
      c => Boolean(c.q('body > header nav') && c.q('body > main section table caption') && c.q('body > footer'))),
    {
      id: 'section',
      label: 'В `main` есть раздел `section` с `h2` и тремя и более `details`',
      test: c => Boolean(faqSection(c)),
      where: c => c.lineOf(/<details\b/i) ?? c.lineOf(/<\/main\s*>/i),
      hints: [
        'Нужен новый раздел внутри `main`: `section`, первым элементом `h2`, затем блоки `details` прямо внутри `section`.',
        'Раздел ставится перед закрывающим `</main>`. Блоков `details` – не меньше трёх.',
        'Образец: `<section>`, `<h2>Частые вопросы</h2>`, три блока `<details>…</details>`, `</section>`.'
      ]
    },
    {
      id: 'summary',
      label: 'В каждом `details` первым элементом стоит `summary` с вопросом',
      test: c => detailsOf(c).length >= 3 && detailsOf(c).every(d =>
        d.firstElementChild?.tagName === 'SUMMARY' && d.firstElementChild.textContent.trim().length >= 5),
      where: c => c.lineOf(/<details\b/i),
      hints: [
        'Надпись-переключатель – элемент `summary`, первый внутри `details`. Текст – вопрос, по которому понятно содержание блока.',
        'Проверьте, что перед `summary` внутри `details` ничего нет и что вопрос не короче пяти символов.',
        'Образец: `<details>`, `<summary>Нужен ли опыт для участия?</summary>`, ответ, `</details>`.'
      ]
    },
    {
      id: 'answer',
      label: 'После `summary` в каждом блоке есть ответ',
      test: c => detailsOf(c).length >= 3 && detailsOf(c).every(d => bodyText(d).length >= 10),
      where: c => c.lineOf(/<summary\b/i),
      hints: [
        'В одном из блоков после вопроса нет ответа или он слишком короткий.',
        'Ответ пишется после `</summary>`, но до `</details>`, обычно абзацем `p`.',
        'Образец: `<p>Нет, занятия рассчитаны на начинающих.</p>` после строки с `summary`.'
      ]
    },
    {
      id: 'open',
      label: 'Ровно один блок раскрыт при загрузке: атрибут `open`',
      test: c => detailsOf(c).filter(d => d.hasAttribute('open')).length === 1,
      where: c => c.lineOf(/<details\b/i),
      hints: [
        'Атрибут `open` у `details` раскрывает блок при загрузке страницы. Он нужен ровно одному блоку.',
        '`open` пишется без значения в открывающем теге первого блока.',
        'Образец: `<details name="faq" open>`'
      ]
    },
    {
      id: 'name',
      label: 'Блоки объединены общим атрибутом `name`',
      test: c => {
        const names = detailsOf(c).map(d => (d.getAttribute('name') || '').trim());
        return names.length >= 3 && names[0] && names.every(n => n === names[0]);
      },
      where: c => c.lineOf(/<details\b/i),
      hints: [
        'Чтобы одновременно раскрывался только один блок, у всех `details` группы должен быть одинаковый `name`.',
        'Значение – любое слово латиницей, одинаковое во всех блоках раздела.',
        'Образец: `<details name="faq">` у каждого блока.'
      ]
    },
    {
      id: 'noInteractive',
      label: 'Внутри `summary` нет ссылок и кнопок',
      test: c => !c.q('summary a, summary button, summary input, summary select, summary textarea'),
      where: c => c.lineOf(/<summary\b[^>]*>[^\n]*<(a|button|input)\b/i),
      hints: [
        '`summary` сам является переключателем. Вложенная ссылка или кнопка конфликтует с ним.',
        'Перенесите ссылку в ответ, после `</summary>`.',
        'Было: `<summary>Где <a href="#map">нас найти</a>?</summary>`. Стало: `<summary>Где нас найти?</summary>` и ссылка в ответе.'
      ]
    }
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    const block = [
      '<section id="faq">',
      '  <h2>Частые вопросы</h2>',
      '  <details name="faq" open>',
      '    <summary>Нужна ли предварительная подготовка?</summary>',
      '    <p>Нет, участие рассчитано на начинающих.</p>',
      '  </details>',
      '  <details name="faq">',
      '    <summary>Сколько длится одно занятие?</summary>',
      '    <p>Полтора часа, включая время на вопросы.</p>',
      '  </details>',
      '  <details name="faq">',
      '    <summary>Можно ли присоединиться в середине курса?</summary>',
      '    <p>Да, материалы прошедших занятий доступны на сайте.</p>',
      '  </details>',
      '</section>'
    ];
    const raw = c.raw;
    const end = raw.search(/<\/main\s*>/i);
    if (end === -1) return raw;
    const lineStart = raw.lastIndexOf('\n', end) + 1;
    const pad = raw.slice(lineStart, end).match(/^\s*/)[0] + '  ';
    return raw.slice(0, lineStart) + block.map(l => pad + l).join('\n') + '\n' + raw.slice(lineStart);
  },

  quiz: [
    {
      q: 'Где располагается `summary`?',
      options: [
        'Первым элементом внутри `details`',
        'Последним элементом внутри `details`',
        'Перед открывающим тегом `details`',
        'В любом месте внутри `details`'
      ],
      correct: 0,
      explain: 'Браузер считает переключателем первый дочерний `summary`. Остальное содержимое `details` скрывается, пока блок свёрнут.'
    },
    {
      q: 'Что делает атрибут `open` у `details`?',
      options: [
        'Раскрывает блок при загрузке',
        'Запрещает сворачивать блок',
        'Раскрывает блок при наведении',
        'Открывает блок в новом окне'
      ],
      correct: 0,
      explain: '`open` задаёт начальное состояние. Пользователь по-прежнему может свернуть блок, и браузер уберёт атрибут.'
    },
    {
      q: 'Как сделать, чтобы в группе раскрывался только один блок?',
      options: [
        'Задать всем блокам одинаковый `name`',
        'Задать всем блокам атрибут `open`',
        'Вложить блоки один в другой по очереди',
        'Поместить блоки в общий список `ul`'
      ],
      correct: 0,
      explain: 'Блоки `details` с общим значением `name` образуют группу: раскрытие одного сворачивает остальные.'
    },
    {
      q: 'Какая надпись в `summary` лучше?',
      options: [
        '«Как записаться на занятие?»',
        '«Подробнее»',
        '«Нажмите здесь, чтобы раскрыть ответ»',
        '«Вопрос номер три»'
      ],
      correct: 0,
      explain: 'Надпись должна сообщать, что скрыто в блоке. Программа экранного доступа прочитает только её, пока блок свёрнут.'
    },
    {
      q: 'Какую информацию не стоит прятать в свёрнутые блоки?',
      options: [
        'Цены, сроки и основные условия',
        'Ответы на дополнительные вопросы',
        'Примечания для части читателей',
        'Технические подробности процедуры'
      ],
      correct: 0,
      explain: 'Основная информация должна быть видна сразу. Свёрнутые блоки подходят для подробностей, нужных не всем.'
    }
  ],

  passScore: 0.8
};
