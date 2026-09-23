/* ==================================================================
   Шаг html-18 · Голова документа
   Продолжает страницу студента из шага 17 (starter: 'previous').
   ================================================================== */

import prevStep from './html-17.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept } from './shared.js';
import { parseColor } from '../../js/colors.js';

const meta = (c, attr, value) => c.qa(`head > meta[${attr}]`).filter(m => m.getAttribute(attr).trim().toLowerCase() === value);
const content = (c, attr, value) => (meta(c, attr, value)[0]?.getAttribute('content') || '').trim();
const ICONS = ['favicon.svg'];

function iconOk(c) {
  return c.qa('head > link[rel]').some(l => {
    if (!/(^|\s)icon(\s|$)/i.test(l.getAttribute('rel'))) return false;
    const href = (l.getAttribute('href') || '').trim();
    if (/^https:\/\/\S+$/i.test(href)) return true;
    const m = href.match(/^(?:\.\/)?assets\/img\/([^/\s]+)$/);
    return Boolean(m && ICONS.includes(m[1]));
  });
}

export default {
  title: 'Голова документа',

  theory: `
<h2>Голова документа</h2>
<p class="lead">Раздел <code>head</code> не виден на странице, но определяет, как документ предстанет вне неё: во вкладке браузера, в результатах поиска, в превью ссылки в мессенджере, в закладках. Здесь же подключаются стили и скрипты – с этого начнутся следующие модули курса.</p>

<h3>Порядок элементов</h3>
<pre><code>&lt;head&gt;
  &lt;meta charset="utf-8"&gt;
  &lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;
  &lt;title&gt;Семинары – Центр изучения диалектов&lt;/title&gt;
  &lt;meta name="description" content="Расписание открытых семинаров центра…"&gt;
  &lt;link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml"&gt;
  &lt;meta name="theme-color" content="#1A40E7"&gt;
  &lt;meta property="og:title" content="Семинары центра изучения диалектов"&gt;
  &lt;meta property="og:description" content="Открытые семинары по диалектологии"&gt;
  &lt;meta property="og:image" content="https://имя.github.io/проект/cover.png"&gt;
  &lt;link rel="stylesheet" href="css/style.css"&gt;
  &lt;script src="js/app.js" defer&gt;&lt;/script&gt;
&lt;/head&gt;</code></pre>
<p>Кодировка стоит первой, затем настройка области просмотра и название. Остальное – в удобном порядке, но стили подключаются до скриптов.</p>

<h3>Название и описание</h3>
<p><code>title</code> и <code>meta name="description"</code> поисковые системы используют для заголовка и текста сниппета в выдаче. Описание – одно-два предложения о содержании именно этой страницы, примерно от 50 до 160 знаков: длинный текст обрезается. У каждой страницы сайта свои название и описание; одинаковые описания на всех страницах бесполезны.</p>

<h3>Значок сайта</h3>
<p><code>link rel="icon"</code> подключает значок, который браузер показывает во вкладке и в закладках. Современные браузеры поддерживают значки в SVG; для совместимости добавляют PNG 32 на 32 пикселя. Для заданий есть значок курса: <code>assets/img/favicon.svg</code>.</p>

<h3>Цвет интерфейса браузера</h3>
<p><code>meta name="theme-color"</code> задаёт цвет адресной строки и панели браузера на мобильных устройствах. Значение – цвет в любой записи CSS, обычно фирменный цвет сайта.</p>

<h3>Превью в соцсетях и мессенджерах</h3>
<p>Метатеги протокола Open Graph описывают карточку, которая появляется при отправке ссылки: <code>og:title</code>, <code>og:description</code>, <code>og:image</code>, <code>og:url</code>. Они записываются атрибутом <code>property</code>, а не <code>name</code>. Адрес изображения в <code>og:image</code> указывается полностью, с <code>https://</code>: мессенджер загружает его со своего сервера и не знает, где находится ваша страница.</p>

<h3>Подключение стилей и скриптов</h3>
<p><code>link rel="stylesheet"</code> подключает внешнюю таблицу стилей CSS, <code>script src</code> – файл JavaScript. Атрибут <code>defer</code> откладывает выполнение скрипта до окончания разбора страницы и позволяет размещать его в <code>head</code>. В итоговой работе этого модуля стили и скрипты не используются: работа проверяет владение HTML. Подключение файлов станет первой темой модуля CSS.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>одинаковые <code>title</code> и <code>description</code> на всех страницах сайта;</li>
    <li>относительный адрес в <code>og:image</code>;</li>
    <li><code>name="og:title"</code> вместо <code>property="og:title"</code>;</li>
    <li>повторяющиеся <code>meta charset</code>, <code>viewport</code> или <code>title</code>.</li>
  </ul>
</div>
`,

  task: [
    'Дополните `head` своей страницы.',
    'Добавьте описание `meta name="description"` длиной от 50 до 160 знаков; значок `link rel="icon"` (значок курса `assets/img/favicon.svg` или свой по адресу `https://`); цвет интерфейса `meta name="theme-color"`; метатеги Open Graph `og:title`, `og:description` и `og:image` с полным адресом изображения. Каждый из этих элементов должен встречаться в `head` один раз.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(17, 'ссылка на основное содержание, `aria-label` у `nav`',
      c => Boolean(c.q('body > main[id]') && c.q('body nav[aria-label]'))),
    {
      id: 'description',
      label: 'Есть `meta name="description"` длиной от 50 до 160 знаков',
      test: c => { const d = content(c, 'name', 'description'); return d.length >= 50 && d.length <= 160; },
      where: c => c.lineOf(/<meta[^>]*name\s*=\s*["']?description/i) ?? c.lineOf(/<\/head\s*>/i),
      hints: [
        'Описание страницы – метатег с `name="description"`; текст записывается в атрибут `content`.',
        'Одно-два предложения о содержании страницы, от 50 до 160 знаков вместе с пробелами.',
        'Образец: `<meta name="description" content="Центр изучения диалектов: открытые семинары, экспедиции и архив записей.">`'
      ]
    },
    {
      id: 'icon',
      label: 'Подключён значок: `link rel="icon"` с существующим файлом',
      test: iconOk,
      where: c => c.lineOf(/<link[^>]*rel\s*=\s*["']?[^"'>]*icon/i) ?? c.lineOf(/<\/head\s*>/i),
      hints: [
        'Значок подключается элементом `link` с атрибутом `rel="icon"` в `head`.',
        'Путь к значку курса: `assets/img/favicon.svg`. Свой значок указывается полным адресом `https://`. `link` – пустой элемент.',
        'Образец: `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">`'
      ]
    },
    {
      id: 'theme',
      label: 'Есть `meta name="theme-color"` с цветом CSS',
      test: c => Boolean(parseColor(content(c, 'name', 'theme-color'))),
      where: c => c.lineOf(/theme-color/i) ?? c.lineOf(/<\/head\s*>/i),
      hints: [
        'Цвет интерфейса браузера задаётся метатегом с `name="theme-color"`.',
        'Значение в `content` – цвет в любой записи CSS, например как у заголовка вашей страницы.',
        'Образец: `<meta name="theme-color" content="#1A40E7">`'
      ]
    },
    {
      id: 'og',
      label: 'Есть `og:title`, `og:description` и `og:image` с полным адресом',
      test: c => content(c, 'property', 'og:title').length >= 3 && content(c, 'property', 'og:description').length >= 10 &&
        /^https:\/\/\S+$/i.test(content(c, 'property', 'og:image')),
      where: c => c.lineOf(/og:/i) ?? c.lineOf(/<\/head\s*>/i),
      hints: [
        'Метатеги Open Graph записываются атрибутом `property`, значение – в `content`. Нужны три: заголовок, описание и изображение.',
        'Адрес изображения в `og:image` – полный, с `https://`, например адрес файла на вашем GitHub Pages.',
        'Образец: `<meta property="og:image" content="https://oletol.github.io/HTML_Course/assets/img/globe.svg">`'
      ]
    },
    {
      id: 'unique',
      label: 'В `head` нет повторов: по одному `charset`, `viewport`, `title`, `description`',
      test: c => c.qa('meta[charset]').length === 1 && meta(c, 'name', 'viewport').length === 1 &&
        c.qa('title').length === 1 && meta(c, 'name', 'description').length <= 1 && c.qa('head > link[rel~="icon" i]').length <= 2,
      where: c => {
        const dup = [/<meta[^>]*charset/gi, /name\s*=\s*["']?viewport/gi, /<title\b/gi, /name\s*=\s*["']?description/gi]
          .find(re => (c.clean.match(re) || []).length > 1);
        if (!dup) return null;
        const all = [...c.clean.matchAll(dup)];
        return c.clean.slice(0, all[1].index).split('\n').length;
      },
      hints: [
        'Один из служебных элементов повторяется. Браузер учтёт только один, второй вводит в заблуждение.',
        'Проверьте `head` сверху вниз: `meta charset`, `meta viewport`, `title` и описание – по одному разу.',
        'Удалите повторную строку, оставив ту, что стоит на правильном месте.'
      ]
    }
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    let code = c.raw;
    const drop = re => { code = code.replace(re, ''); };
    const desc = content(c, 'name', 'description');
    const descOk = desc.length >= 50 && desc.length <= 160 && meta(c, 'name', 'description').length === 1;
    const themeOk = Boolean(parseColor(content(c, 'name', 'theme-color')));
    const icon = iconOk(c);
    if (!descOk) drop(/\n?[ \t]*<meta[^>]*name\s*=\s*["']?description["']?[^>]*>/gi);
    if (!themeOk) drop(/\n?[ \t]*<meta[^>]*name\s*=\s*["']?theme-color["']?[^>]*>/gi);
    if (!icon) drop(/\n?[ \t]*<link[^>]*rel\s*=\s*["']?[^"'>]*icon[^>]*>/gi);
    drop(/\n?[ \t]*<meta[^>]*property\s*=\s*["']?og:[^>]*>/gi);
    const title = (c.text('head > title') || 'Мой проект').replace(/"/g, '&quot;');
    const lines = [];
    if (!descOk) lines.push('<meta name="description" content="Учебный сайт о моём проекте: задачи, материалы, расписание и форма записи на занятия.">');
    if (!icon) lines.push('<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">');
    if (!themeOk) lines.push('<meta name="theme-color" content="#1A40E7">');
    lines.push(`<meta property="og:title" content="${title}">`,
      '<meta property="og:description" content="Учебный сайт о моём проекте, свёрстанный на HTML.">',
      '<meta property="og:image" content="https://oletol.github.io/HTML_Course/assets/img/globe.svg">');
    return code.replace(/\n?[ \t]*<\/head\s*>/i, `\n${lines.map(l => '    ' + l).join('\n')}\n  </head>`);
  },

  quiz: [
    {
      q: 'Где поисковая система берёт текст для сниппета страницы?',
      options: [
        'Из `meta name="description"`',
        'Из `meta name="theme-color"`',
        'Из атрибута `alt` у первого `img`',
        'Из `link rel="icon"` в разделе `head`'
      ],
      correct: 0,
      explain: 'Описание страницы – основной источник текста сниппета. Поисковая система может заменить его фрагментом страницы, если описание не соответствует запросу.'
    },
    {
      q: 'Как записать адрес изображения в `og:image`?',
      options: [
        'Полностью, начиная с `https://`',
        'Относительно текущей страницы',
        'Только именем файла без папки',
        'Через `data:` прямо в атрибуте'
      ],
      correct: 0,
      explain: 'Мессенджер или соцсеть загружает изображение со своего сервера и не знает адрес вашей страницы, поэтому относительный путь не сработает.'
    },
    {
      q: 'Каким атрибутом записываются метатеги Open Graph?',
      options: ['`property`', '`name`', '`rel`', '`itemprop`'],
      correct: 0,
      explain: 'Протокол Open Graph использует `property="og:…"`. `name` применяется для `description`, `viewport`, `theme-color`.'
    },
    {
      q: 'Что делает атрибут `defer` у `script`?',
      options: [
        'Выполняет скрипт после разбора страницы',
        'Загружает скрипт только по клику пользователя',
        'Запрещает скрипту изменять содержимое страницы',
        'Выполняет скрипт до загрузки таблиц стилей'
      ],
      correct: 0,
      explain: 'Скрипт с `defer` загружается параллельно с разбором страницы и выполняется после него, поэтому его можно подключать в `head`.'
    },
    {
      q: 'Почему у каждой страницы сайта свои `title` и `description`?',
      options: [
        'Они описывают содержание конкретной страницы',
        'Без этого браузер не откроет вторую страницу',
        'Этого требует протокол Open Graph для ссылок',
        'Иначе значок сайта не появится во вкладке'
      ],
      correct: 0,
      explain: 'Во вкладках, закладках и в поисковой выдаче страницы различают именно по названию и описанию. Одинаковые тексты на всех страницах бесполезны.'
    }
  ],

  passScore: 0.8
};
