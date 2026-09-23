/* ==================================================================
   Шаг html-09 · Встраивание
   Продолжает страницу студента из шага 8 (starter: 'previous').
   Учебная страница для встраивания: assets/embed/schedule.html.
   ================================================================== */

import prevStep from './html-08.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts, appendToBody, previousKept } from './shared.js';

const EMBEDS = ['schedule.html'];
const okSrc = s => {
  const v = (s || '').trim();
  if (/^https:\/\/\S+$/i.test(v)) return true;
  const m = v.match(/^(?:\.\/)?assets\/embed\/([^/\s]+)$/);
  return Boolean(m && EMBEDS.includes(m[1]));
};
const firstFrame = c => c.q('body iframe');
const OBSOLETE = ['frameborder', 'scrolling', 'marginwidth', 'marginheight', 'align', 'longdesc'];

export default {
  title: 'Встраивание',

  theory: `
<h2>Встраивание</h2>
<p class="lead">Элемент <code>iframe</code> встраивает в страницу другой HTML-документ: карту, видеопроигрыватель, форму опроса, виджет расписания. Встроенный документ живёт по своим правилам, и разметка определяет, сколько места ему отведено и что ему разрешено.</p>

<h3>Элемент iframe</h3>
<pre><code>&lt;iframe src="assets/embed/schedule.html"
        title="Расписание консультаций"
        width="600" height="260"
        loading="lazy"
        sandbox&gt;
&lt;/iframe&gt;</code></pre>
<p><code>src</code> – адрес встраиваемой страницы. Элемент парный; содержимое между тегами браузеры не показывают, поэтому альтернативную ссылку на встроенную страницу размещают рядом с фреймом.</p>

<h3>Заголовок фрейма</h3>
<p>Атрибут <code>title</code> у <code>iframe</code> обязателен с точки зрения доступности: программа экранного доступа объявляет фрейм по его заголовку, и без него пользователь не знает, что встроено на страницу. Заголовок называет содержание: «Карта проезда к мастерской», а не «iframe» или «виджет».</p>

<h3>Размеры и отложенная загрузка</h3>
<p><code>width</code> и <code>height</code> задают размер фрейма в пикселях. Если они не указаны, браузер отводит фрейму 300 на 150 пикселей. Атрибут <code>loading="lazy"</code> откладывает загрузку встроенной страницы до прокрутки к ней: сторонние виджеты часто тяжелее самой страницы.</p>

<h3>Ограничения sandbox</h3>
<p>Атрибут <code>sandbox</code> без значения включает все ограничения: во встроенной странице не выполняются скрипты, не отправляются формы, не открываются всплывающие окна, и она считается документом с чужого сайта. Значения атрибута снимают отдельные ограничения:</p>
<ul>
  <li><code>allow-scripts</code> – разрешает скрипты;</li>
  <li><code>allow-forms</code> – разрешает отправку форм;</li>
  <li><code>allow-popups</code> – разрешает открывать новые окна;</li>
  <li><code>allow-same-origin</code> – сохраняет исходное происхождение документа.</li>
</ul>
<p>Сочетание <code>allow-scripts</code> и <code>allow-same-origin</code> для страницы с того же сайта фактически отменяет защиту: скрипт встроенной страницы может снять ограничения сам. Окно результата в этой песочнице – тоже <code>iframe</code> с <code>sandbox</code>: поэтому ваш код не может выполнить скрипты.</p>

<h3>Встраивание внешних сервисов</h3>
<p>Картографические сервисы и видеохостинги предлагают готовый код встраивания в меню «Поделиться». Такой код проверяют перед вставкой: добавляют <code>title</code> и <code>loading="lazy"</code>, удаляют устаревшие атрибуты <code>frameborder</code>, <code>scrolling</code>, <code>marginwidth</code> – их роль выполняет CSS. Атрибут <code>allow</code> перечисляет разрешённые встроенной странице возможности, например <code>allow="fullscreen"</code>.</p>

<h3>Когда встраивание невозможно</h3>
<p>Многие сайты запрещают показывать себя во фрейме на чужих страницах: банки, социальные сети, почтовые сервисы. Запрет задаётся заголовками ответа сервера, и фрейм остаётся пустым. Это решение владельца сайта, а не ошибка разметки. Доступность внешних сервисов также зависит от региона пользователя, поэтому рядом с фреймом полезна обычная ссылка на тот же материал.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>нет <code>title</code> – фрейм безымянен для программы экранного доступа;</li>
    <li>код встраивания вставлен без проверки, с устаревшими атрибутами;</li>
    <li>фрейм без размеров занимает 300 на 150 пикселей и обрезает содержимое;</li>
    <li>рядом нет ссылки на встроенный материал на случай, если фрейм не загрузится.</li>
  </ul>
</div>
`,

  task: [
    'Продолжите свою страницу. Встройте учебную страницу курса `assets/embed/schedule.html` или свою страницу на GitHub Pages по адресу `https://`.',
    'У фрейма укажите содержательный `title`, `width` и `height`, `loading="lazy"` и атрибут `sandbox`. Устаревшие атрибуты вроде `frameborder` не используйте. Под фреймом поставьте абзац с обычной ссылкой на ту же страницу.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(8, '`h1`, `h2`, абзацы, список, ссылки, изображения, видео или звук',
      c => c.qa('body h1').length === 1 && texts(c, 'body h2').length >= 2 &&
        c.qa('body ul, body ol').length > 0 && c.qa('body img').length >= 1 &&
        c.qa('body video, body audio').length >= 1),
    {
      id: 'iframe',
      label: 'Есть `iframe` с адресом учебной страницы или `https://`',
      test: c => c.qa('body iframe').some(f => okSrc(f.getAttribute('src'))),
      where: c => c.lineOf(/<iframe\b/i),
      hints: [
        'Нужен парный элемент `iframe` с атрибутом `src`.',
        'Путь к учебной странице: `assets/embed/schedule.html`. Своя страница указывается полным адресом с `https://`.',
        'Образец: `<iframe src="assets/embed/schedule.html" …></iframe>`'
      ]
    },
    {
      id: 'title',
      label: 'У `iframe` есть `title`, который называет содержание',
      test: c => c.qa('body iframe').some(f => {
        const t = (f.getAttribute('title') || '').trim();
        return t.length >= 5 && !/^(iframe|фрейм|виджет|widget|frame)$/i.test(t);
      }),
      where: c => c.lineOf(/<iframe\b/i),
      hints: [
        'Программа экранного доступа объявит фрейм по атрибуту `title`. Он должен называть, что встроено.',
        'Добавьте `title` в открывающий тег `iframe`. Слова «iframe» и «виджет» не подходят: они не называют содержание.',
        'Образец: `title="Расписание консультаций"`'
      ]
    },
    {
      id: 'size',
      label: 'У `iframe` заданы `width`, `height` и `loading="lazy"`',
      test: c => c.qa('body iframe').some(f => /^\d+$/.test(f.getAttribute('width') || '') &&
        /^\d+$/.test(f.getAttribute('height') || '') && (f.getAttribute('loading') || '').toLowerCase() === 'lazy'),
      where: c => c.lineOf(/<iframe\b/i),
      hints: [
        'Без размеров фрейм займёт 300 на 150 пикселей. Нужны `width`, `height` и отложенная загрузка.',
        'Размеры – числами без единиц. Учебной странице хватит 600 на 260.',
        'Образец: `width="600" height="260" loading="lazy"`'
      ]
    },
    {
      id: 'sandbox',
      label: 'У `iframe` есть атрибут `sandbox`',
      test: c => c.qa('body iframe').some(f => f.hasAttribute('sandbox')),
      where: c => c.lineOf(/<iframe\b/i),
      hints: [
        'Атрибут `sandbox` ограничивает встроенную страницу: без скриптов, форм и всплывающих окон.',
        'Для учебной страницы достаточно `sandbox` без значения: ей не нужны скрипты.',
        'Образец: `<iframe src="…" title="…" width="600" height="260" loading="lazy" sandbox></iframe>`'
      ]
    },
    {
      id: 'obsolete',
      label: 'Нет устаревших атрибутов `frameborder`, `scrolling`, `marginwidth`',
      test: c => c.qa('body iframe').every(f => OBSOLETE.every(a => !f.hasAttribute(a))),
      where: c => c.lineOf(/<iframe\b[^>]*\b(frameborder|scrolling|marginwidth|marginheight)\b/i),
      hints: [
        'В коде фрейма остались атрибуты, исключённые из стандарта.',
        'Удалите `frameborder`, `scrolling`, `marginwidth` и `marginheight`: рамки и отступы задаются в CSS.',
        'Было: `<iframe src="…" frameborder="0">`. Стало: `<iframe src="…">`.'
      ]
    },
    {
      id: 'link',
      label: 'Рядом с фреймом есть ссылка на ту же страницу',
      test: c => {
        const f = firstFrame(c);
        const src = (f?.getAttribute('src') || '').trim();
        return Boolean(src) && c.qa('body a[href]').some(a => a.getAttribute('href').trim() === src);
      },
      where: c => c.lineOf(/<\/iframe\s*>/i),
      hints: [
        'Если фрейм не загрузится, пользователь должен открыть встроенный материал обычной ссылкой.',
        'После `</iframe>` добавьте абзац со ссылкой `a`, у которой `href` совпадает с `src` фрейма.',
        'Образец: `<p><a href="assets/embed/schedule.html">Расписание консультаций на отдельной странице</a></p>`'
      ]
    }
  ],

  solution: c0 => appendToBody(baseFor(c0, prevStep, makeContext), [
    '',
    '<iframe src="assets/embed/schedule.html" title="Расписание консультаций"',
    '        width="600" height="260" loading="lazy" sandbox></iframe>',
    '<p><a href="assets/embed/schedule.html">Расписание консультаций на отдельной странице</a></p>'
  ]),

  quiz: [
    {
      q: 'Зачем у `iframe` атрибут `title`?',
      options: [
        'Он называет фрейм для программы экранного доступа',
        'Он задаёт заголовок вкладки внутри встроенной страницы',
        'Он выводится над фреймом как видимая подпись к нему',
        'Он заменяет содержимое фрейма, если тот не загрузился'
      ],
      correct: 0,
      explain: 'По `title` программа экранного доступа объявляет, что встроено на страницу. На экране атрибут не отображается.'
    },
    {
      q: 'Что делает атрибут `sandbox` без значения?',
      options: [
        'Включает все ограничения',
        'Снимает все ограничения',
        'Скрывает рамку фрейма',
        'Запрещает только скрипты'
      ],
      correct: 0,
      explain: 'Пустой `sandbox` запрещает скрипты, формы, всплывающие окна и лишает страницу её происхождения. Значения вроде `allow-scripts` снимают отдельные ограничения.'
    },
    {
      q: 'Какое сочетание значений `sandbox` фактически отменяет защиту для страницы своего сайта?',
      options: [
        '`allow-scripts allow-same-origin`',
        '`allow-popups allow-popups-to-escape-sandbox`',
        '`allow-popups allow-modals allow-forms`',
        '`allow-forms allow-downloads`'
      ],
      correct: 0,
      explain: 'Скрипт страницы с тем же происхождением получает доступ к фрейму и может снять с него атрибут `sandbox`.'
    },
    {
      q: 'Фрейм с сайтом банка остаётся пустым. Какова наиболее вероятная причина?',
      options: [
        'Сайт запрещает показ во фрейме',
        'У фрейма не указан `sandbox`',
        'У фрейма не указан `loading`',
        'Адрес сайта начинается с `https`'
      ],
      correct: 0,
      explain: 'Многие сайты запрещают встраивание заголовками ответа сервера. Разметка на это не влияет, поэтому рядом с фреймом нужна обычная ссылка.'
    },
    {
      q: 'Какой атрибут из кода встраивания внешнего сервиса следует удалить?',
      options: ['`frameborder`', '`referrerpolicy`', '`allowfullscreen`', '`loading`'],
      correct: 0,
      explain: '`frameborder` исключён из стандарта, рамка задаётся в CSS. `referrerpolicy`, `allowfullscreen` и `loading` – действующие атрибуты.'
    }
  ],

  passScore: 0.8
};
