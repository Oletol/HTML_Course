/* ==================================================================
   Шаг html-06 · Ссылки
   Продолжает страницу студента из шага 5 (starter: 'previous').
   ================================================================== */

import prevStep from './html-05.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts, appendToBody, previousKept, lineOfText, safe } from './shared.js';

const VAGUE = /^(здесь|тут|сюда|ссылка|по ссылке|подробнее|читать далее|далее|перейти|нажмите|click here|here|more|link)\.?$/i;
const linkText = a => (a.textContent.trim() || a.querySelector('img')?.getAttribute('alt') || '').trim();

function anchorOk(c) {
  return c.qa('body a[href^="#"]').some(a => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    return id && c.doc.getElementById(id);
  });
}

function badId(c) {
  const seen = new Set();
  return c.qa('[id]').find(el => {
    const id = el.getAttribute('id');
    if (!id || /\s/.test(id) || seen.has(id)) return true;
    seen.add(id);
    return false;
  });
}

export default {
  title: 'Ссылки',

  theory: `
<h2>Ссылки</h2>
<p class="lead">Ссылка связывает документ с другим ресурсом: страницей, разделом той же страницы, файлом, почтовым адресом. Совокупность ссылок превращает отдельные документы в сайт.</p>

<h3>Элемент a и атрибут href</h3>
<p>Ссылка создаётся элементом <code>a</code>, адрес назначения указывается в атрибуте <code>href</code>. Содержимое элемента – текст ссылки, который видит и выбирает пользователь.</p>
<pre><code>&lt;a href="https://ru.wikipedia.org/wiki/Керамика"&gt;Статья о керамике в Википедии&lt;/a&gt;</code></pre>
<p>Элемент <code>a</code> без атрибута <code>href</code> ссылкой не является: браузер не делает его активным, клавиша Tab его пропускает.</p>

<h3>Абсолютные и относительные адреса</h3>
<p>Абсолютный адрес содержит протокол и домен: <code>https://example.org/about.html</code>. Он используется для внешних ресурсов. Относительный адрес отсчитывается от текущей страницы и используется внутри своего сайта:</p>
<ul>
  <li><code>about.html</code> – файл в той же папке;</li>
  <li><code>pages/contacts.html</code> – файл во вложенной папке;</li>
  <li><code>../index.html</code> – файл в папке уровнем выше.</li>
</ul>
<p>Адрес, начинающийся с косой черты, отсчитывается от корня домена. На GitHub Pages корень домена – <code>https://имя.github.io/</code>, а не папка репозитория, поэтому для ссылок между страницами проекта надёжнее относительные адреса. Имена файлов на GitHub Pages чувствительны к регистру: <code>About.html</code> и <code>about.html</code> – разные файлы.</p>

<h3>Якорные ссылки</h3>
<p>Ссылка может вести к разделу той же страницы. Целевому элементу задаётся атрибут <code>id</code>, в адресе ссылки он указывается после знака <code>#</code>.</p>
<pre><code>&lt;p&gt;&lt;a href="#schedule"&gt;Расписание занятий&lt;/a&gt;&lt;/p&gt;
…
&lt;h2 id="schedule"&gt;Расписание&lt;/h2&gt;</code></pre>
<p>Значение <code>id</code> уникально в пределах страницы и не содержит пробелов. Принято использовать латиницу, строчные буквы и дефис: <code>id="price-list"</code>. Якорь можно добавить и к адресу другой страницы: <code>about.html#team</code>.</p>

<h3>Открытие в новой вкладке</h3>
<p>Атрибут <code>target="_blank"</code> открывает ссылку в новой вкладке. Вместе с ним указывается <code>rel="noopener noreferrer"</code>: <code>noopener</code> запрещает открытой странице управлять вкладкой-источником, <code>noreferrer</code> не передаёт ей адрес исходной страницы.</p>
<pre><code>&lt;a href="https://example.org" target="_blank" rel="noopener noreferrer"&gt;
  Материалы исследования (откроется в новой вкладке)
&lt;/a&gt;</code></pre>
<p>Новая вкладка уместна для внешних источников, к которым пользователь обращается ненадолго. Для переходов между страницами своего сайта она не применяется. Пометка «откроется в новой вкладке» предупреждает пользователя о смене контекста.</p>

<h3>Почта и телефон</h3>
<p>Схема <code>mailto:</code> открывает почтовую программу с заполненным адресом получателя, схема <code>tel:</code> на телефоне предлагает позвонить. Номер записывается в международном формате без пробелов.</p>
<pre><code>&lt;a href="mailto:info@example.org"&gt;info@example.org&lt;/a&gt;
&lt;a href="tel:+74950000000"&gt;+7 495 000-00-00&lt;/a&gt;</code></pre>

<h3>Текст ссылки</h3>
<p>Текст ссылки называет место назначения. Программы экранного доступа позволяют просмотреть список всех ссылок страницы вне окружающего текста, и в таком списке формулировки «здесь», «подробнее», «по ссылке» теряют смысл. Сравните: «Подробнее – <code>здесь</code>» и «<code>Программа курса</code>».</p>
<p>Атрибут <code>download</code> сообщает браузеру, что файл нужно скачать, а не открыть: <code>&lt;a href="price.pdf" download&gt;Прайс-лист, PDF, 120 КБ&lt;/a&gt;</code>. Для файлов в тексте ссылки полезно указывать формат и размер.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>текст ссылки «здесь» или «подробнее», не называющий цель;</li>
    <li><code>id</code> с пробелом или повторяющийся на странице – якорь не срабатывает;</li>
    <li>в <code>href</code> указан <code>#Раздел</code>, а у элемента <code>id="раздел"</code> – регистр не совпадает;</li>
    <li>пробелы в адресе вместо дефиса или <code>%20</code>;</li>
    <li><code>target="_blank"</code> у ссылок на страницы своего сайта.</li>
  </ul>
</div>
`,

  task: [
    'Продолжите свою страницу. Добавьте три ссылки:',
    'якорную: задайте одному из заголовков `h2` атрибут `id` и сразу после `h1` поставьте абзац со ссылкой на этот раздел; внешнюю: ссылку на источник по теме проекта с адресом `https://`, которая открывается в новой вкладке с `rel="noopener noreferrer"`; почтовую: ссылку `mailto:` с адресом электронной почты.',
    'Текст каждой ссылки должен называть, куда она ведёт.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(5, 'один `h1`, два `h2`, абзацы, список',
      c => c.qa('body h1').length === 1 && texts(c, 'body h2').length >= 2 &&
        texts(c, 'body p', 10).length >= 2 && c.qa('body ul, body ol').length > 0),
    {
      id: 'anchor',
      label: 'Есть якорная ссылка `href="#…"` на существующий `id`',
      test: anchorOk,
      where: c => c.lineOf(/<a\b[^>]*href\s*=\s*["']?#/i),
      hints: [
        'Нужна пара: элемент с атрибутом `id` и ссылка, в `href` которой после `#` стоит то же значение.',
        'Значения должны совпадать буква в букву, включая регистр. Атрибут `id` ставится в открывающий тег `h2`.',
        'Образец: `<h2 id="schedule">Расписание</h2>` и выше `<p><a href="#schedule">Расписание занятий</a></p>`.'
      ]
    },
    {
      id: 'ids',
      label: 'Значения `id` уникальны и не содержат пробелов',
      test: c => !badId(c),
      where: c => { const el = badId(c); return el ? lineOfText(c, `id="${el.getAttribute('id')}"`) : null; },
      hints: [
        'Одно из значений `id` содержит пробел или повторяется на странице.',
        'Используйте латиницу, строчные буквы и дефис вместо пробела. Каждое значение встречается на странице один раз.',
        'Было: `id="наше расписание"`. Стало: `id="schedule"`.'
      ]
    },
    {
      id: 'external',
      label: 'Есть внешняя ссылка `https://` с `target="_blank"` и `rel="noopener noreferrer"`',
      test: c => c.qa('body a[href^="https://" i]').some(a =>
        a.getAttribute('target') === '_blank' && /\bnoopener\b/i.test(a.getAttribute('rel') || '')),
      where: c => c.lineOf(/<a\b[^>]*href\s*=\s*["']?https:/i),
      hints: [
        'Внешняя ссылка ведёт на другой сайт по полному адресу, начинающемуся с `https://`.',
        'В открывающем теге нужны три атрибута: `href` с адресом, `target="_blank"` и `rel="noopener noreferrer"`.',
        'Образец: `<a href="https://ru.wikipedia.org/wiki/Диалект" target="_blank" rel="noopener noreferrer">Статья о диалектах</a>`'
      ]
    },
    {
      id: 'mailto',
      label: 'Есть ссылка `mailto:` с адресом электронной почты',
      test: c => c.qa('body a[href^="mailto:" i]').some(a => /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(a.getAttribute('href').trim())),
      where: c => c.lineOf(/<a\b[^>]*href\s*=\s*["']?mailto:/i),
      hints: [
        'Почтовая ссылка начинается со схемы `mailto:`, за которой без пробела следует адрес.',
        'Проверьте адрес: в нём есть `@` и точка в имени домена, нет пробелов.',
        'Образец: `<a href="mailto:info@example.org">info@example.org</a>`'
      ]
    },
    {
      id: 'linkText',
      label: 'Текст каждой ссылки называет цель, без «здесь» и «подробнее»',
      test: c => c.qa('body a[href]').length > 0 && c.qa('body a[href]').every(a => {
        const t = linkText(a);
        return t.length >= 3 && !VAGUE.test(t);
      }),
      where: c => {
        const a = c.qa('body a[href]').find(el => { const t = linkText(el); return t.length < 3 || VAGUE.test(t); });
        return a ? lineOfText(c, a.getAttribute('href')) : null;
      },
      hints: [
        'Одна из ссылок пустая или её текст не сообщает, куда она ведёт.',
        'Представьте список всех ссылок страницы без окружающего текста: каждая должна быть понятна сама по себе.',
        'Было: `Расписание – <a href="#schedule">здесь</a>`. Стало: `<a href="#schedule">Расписание занятий</a>`.'
      ]
    },
    {
      id: 'hrefs',
      label: 'У всех ссылок заполнен `href` без пробелов',
      test: c => c.qa('body a').every(a => {
        const h = a.getAttribute('href');
        return h != null && h.trim().length > 0 && !/\s/.test(h.trim());
      }),
      where: c => {
        const a = c.qa('body a').find(el => { const h = el.getAttribute('href'); return h == null || !h.trim() || /\s/.test(h.trim()); });
        return a ? (lineOfText(c, linkText(a)) ?? c.lineOf(/<a\b/i)) : null;
      },
      hints: [
        'У одной из ссылок нет атрибута `href`, он пустой или содержит пробел.',
        'Пробел в адресе заменяется дефисом в имени файла или записью `%20`. Пустой `href` ссылку не создаёт.',
        'Было: `<a href="my page.html">`. Стало: `<a href="my-page.html">`.'
      ]
    }
  ],

  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    let code = c.raw;
    const h2s = c.qa('body h2');
    const target = h2s[h2s.length - 1];
    let id = target?.getAttribute('id');
    if (!id || /\s/.test(id)) {
      id = 'section-main';
      let n = 0;
      code = code.replace(/<h2\b[^>]*>/gi, m => (++n === h2s.length ? `<h2 id="${id}">` : m));
    }
    const title = safe(target?.textContent) || 'Основной раздел';
    code = code.replace(/(<\/h1\s*>)/i, `$1\n    <p><a href="#${id}">${title}</a></p>`);
    return appendToBody(makeContext(code), [
      '',
      '<p>Источник по теме: <a href="https://ru.wikipedia.org/wiki/Лингвистика" target="_blank" rel="noopener noreferrer">статья «Лингвистика» в Википедии (откроется в новой вкладке)</a>.</p>',
      '<p>Связаться с автором проекта: <a href="mailto:info@example.org">info@example.org</a></p>'
    ]);
  },

  quiz: [
    {
      q: 'Чем относительный адрес отличается от абсолютного?',
      options: [
        'Отсчитывается от текущей страницы',
        'Работает только внутри одной папки',
        'Всегда начинается с косой черты',
        'Открывается только в новой вкладке'
      ],
      correct: 0,
      explain: 'Относительный адрес строится от расположения текущей страницы и может вести во вложенную папку или уровнем выше (`../`). Косая черта в начале означает отсчёт от корня домена.'
    },
    {
      q: 'Ссылка `<a href="#Price">` не срабатывает, у заголовка указано `id="price"`. В чём причина?',
      options: [
        'Не совпадает регистр букв',
        'Якорь пишется без знака `#`',
        'У заголовков нет атрибута `id`',
        'Якорь работает лишь для `p`'
      ],
      correct: 0,
      explain: 'Значения `id` и якоря сравниваются с учётом регистра: `Price` и `price` – разные идентификаторы.'
    },
    {
      q: 'Зачем к `target="_blank"` добавляют `rel="noopener"`?',
      options: [
        'Чтобы новая страница не управляла исходной',
        'Чтобы ссылка открылась в том же окне',
        'Чтобы браузер не сохранял страницу в истории',
        'Чтобы поисковые системы учитывали ссылку'
      ],
      correct: 0,
      explain: 'Без `noopener` открытая страница получает доступ к вкладке-источнику через `window.opener` и может, например, подменить её адрес.'
    },
    {
      q: 'Какой текст ссылки лучше для программы экранного доступа?',
      options: [
        '«Программа курса»',
        '«Подробнее здесь»',
        '«Нажмите сюда»',
        '«Ссылка на файл»'
      ],
      correct: 0,
      explain: 'Текст ссылки должен быть понятен вне контекста, например в списке всех ссылок страницы. «Программа курса» называет цель, остальные варианты – нет.'
    },
    {
      q: 'Как записать ссылку для звонка на номер +7 495 000-00-00?',
      options: [
        '`href="tel:+74950000000"`',
        '`href="phone:+74950000000"`',
        '`href="call:+7 495 000-00-00"`',
        '`href="tel://7-495-000-00-00"`'
      ],
      correct: 0,
      explain: 'Схема называется `tel:`, номер записывается в международном формате без пробелов и дефисов. Для отображения на странице номер можно отформатировать в тексте ссылки.'
    }
  ],

  passScore: 0.8
};
