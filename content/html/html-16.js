/* ==================================================================
   Шаг html-16 · Язык и локализация
   Продолжает страницу студента из шага 15 (starter: 'previous').
   ================================================================== */

import prevStep from './html-15.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, previousKept, lineOfText } from './shared.js';
import { insertBeforeMainEnd } from './forms.js';

const LANG_CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const DATETIME = /^(\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?|\d{2}:\d{2}(:\d{2})?|\d{4}-\d{2})$/;

const foreignFragment = c => c.qa('body [lang]').find(el => {
  const l = (el.getAttribute('lang') || '').trim();
  return LANG_CODE.test(l) && !/^ru(-|$)/i.test(l) && el.textContent.trim().length >= 2;
});

export default {
  title: 'Язык и локализация',

  theory: `
<h2>Язык и локализация</h2>
<p class="lead">Разметка сообщает не только структуру текста, но и его языковые свойства: на каком языке написан каждый фрагмент, что нельзя переводить, в каком направлении идёт письмо, что означает сокращение, какую дату называет фраза. Эти сведения используют программы экранного доступа, переводчики, поисковые системы и инструменты локализации.</p>

<h3>Язык документа и фрагментов</h3>
<p>Атрибут <code>lang</code> у <code>html</code> задаёт основной язык страницы. Фрагмент на другом языке размечается тем же атрибутом на ближайшем подходящем элементе или на <code>span</code>:</p>
<pre><code>&lt;p&gt;Проект называется &lt;span lang="en"&gt;Language in Context&lt;/span&gt;.&lt;/p&gt;
&lt;blockquote lang="de"&gt;
  &lt;p&gt;Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt.&lt;/p&gt;
&lt;/blockquote&gt;</code></pre>
<p>Без этой разметки программа экранного доступа прочитает английскую фразу по правилам русского произношения, браузер применит русские правила переносов, а переводчик воспримет фрагмент как ошибку в тексте.</p>

<h3>Коды языков</h3>
<p>Значение <code>lang</code> записывается по стандарту BCP 47: код языка из двух или трёх букв, при необходимости через дефис – письменность или регион.</p>
<ul>
  <li><code>ru</code>, <code>en</code>, <code>de</code>, <code>zh</code>, <code>ar</code> – языки;</li>
  <li><code>en-GB</code>, <code>pt-BR</code> – язык с регионом: различаются орфография, лексика, форматы;</li>
  <li><code>sr-Latn</code>, <code>zh-Hans</code> – язык с письменностью: сербский на латинице, китайский в упрощённом письме.</li>
</ul>

<h3>Запрет перевода</h3>
<p>Атрибут <code>translate="no"</code> сообщает встроенным переводчикам браузеров и системам машинного перевода, что фрагмент переводить нельзя: название продукта, имя собственное, фрагмент кода, термин, который должен остаться в оригинале.</p>
<pre><code>&lt;p&gt;Корпус размечен в программе &lt;span translate="no"&gt;ELAN&lt;/span&gt;.&lt;/p&gt;</code></pre>

<h3>Направление письма</h3>
<p>Арабский, иврит, персидский пишутся справа налево. Атрибут <code>dir</code> задаёт направление: <code>rtl</code> – справа налево, <code>ltr</code> – слева направо, <code>auto</code> – по первым буквам текста. Для страницы на таком языке направление указывается у <code>html</code>: <code>&lt;html lang="ar" dir="rtl"&gt;</code>. Элемент <code>bdi</code> изолирует фрагмент с неизвестным направлением – например, имя пользователя в списке, – чтобы оно не нарушило порядок окружающего текста.</p>

<h3>Сокращения</h3>
<p><code>abbr</code> размечает аббревиатуру или сокращение, атрибут <code>title</code> содержит полную форму. Подсказка <code>title</code> видна только при наведении мыши, поэтому при первом упоминании полную форму лучше дать и в тексте.</p>
<pre><code>&lt;abbr title="Web Content Accessibility Guidelines"&gt;WCAG&lt;/abbr&gt;</code></pre>

<h3>Даты и время</h3>
<p><code>time</code> связывает дату в тексте с её машиночитаемым значением в атрибуте <code>datetime</code>. Текст записывается по правилам языка страницы, а значение – в едином формате <code>ГГГГ-ММ-ДД</code>, при необходимости со временем: <code>2026-11-17T18:30</code>. Так календарь, поисковая система или программа перевода понимают дату независимо от того, как она записана для читателя.</p>
<pre><code>Семинар пройдёт &lt;time datetime="2026-11-17T18:30"&gt;17 ноября в 18:30&lt;/time&gt;.</code></pre>

<h3>Ссылки на версии на других языках</h3>
<p>Атрибут <code>hreflang</code> у ссылки сообщает язык страницы, на которую она ведёт. Если язык ссылки отличается от языка страницы, текст ссылки размечается и <code>lang</code>.</p>
<pre><code>&lt;a href="https://en.wikipedia.org/wiki/Linguistics" hreflang="en" lang="en"&gt;
  Linguistics – Wikipedia
&lt;/a&gt;</code></pre>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>иноязычная цитата без <code>lang</code>;</li>
    <li>код языка в неверной записи: <code>lang="eng"</code>, <code>lang="en_GB"</code>, <code>lang="английский"</code>;</li>
    <li>дата в <code>datetime</code> записана так же, как в тексте: <code>datetime="17 ноября"</code>;</li>
    <li>полная форма сокращения доступна только в <code>title</code>.</li>
  </ul>
</div>
`,

  task: [
    'Добавьте в `main` раздел `section` с заголовком `h2` о языках вашего проекта, источниках или терминах.',
    'В нём разметьте: фрагмент на другом языке атрибутом `lang` с верным кодом; название или термин, который нельзя переводить, атрибутом `translate="no"`; сокращение элементом `abbr` с полной формой в `title`; дату элементом `time` с атрибутом `datetime`; ссылку на ресурс на другом языке с атрибутом `hreflang`.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(15, 'форма с полями, подписями и проверкой, `fieldset`',
      c => Boolean(c.q('body > main form [required]') && c.q('body > main form fieldset legend'))),
    {
      id: 'foreign',
      label: 'Фрагмент на другом языке размечен `lang` с верным кодом',
      test: c => Boolean(foreignFragment(c)),
      where: c => c.lineOf(/\slang\s*=\s*["']?(?!ru)/i) ?? c.lineOf(/<\/main\s*>/i),
      hints: [
        'Нужен элемент с текстом на другом языке и атрибутом `lang`, отличным от `ru`.',
        'Код языка – две или три строчные латинские буквы по стандарту BCP 47: `en`, `de`, `fr`. Регион пишется через дефис: `en-GB`.',
        'Образец: `<p>Проект называется <span lang="en">Language in Context</span>.</p>`'
      ]
    },
    {
      id: 'translate',
      label: 'Есть фрагмент с `translate="no"`',
      test: c => c.qa('body [translate]').some(el => el.getAttribute('translate').trim().toLowerCase() === 'no' && el.textContent.trim().length >= 2),
      where: c => c.lineOf(/\stranslate\s*=/i),
      hints: [
        'Название, имя или термин, который не должен переводиться автоматически, размечается атрибутом `translate`.',
        'Значение атрибута – `no`. Его ставят на `span` вокруг названия или на подходящий элемент целиком.',
        'Образец: `<span translate="no">ELAN</span>`'
      ]
    },
    {
      id: 'abbr',
      label: 'Сокращение размечено `abbr` с полной формой в `title`',
      test: c => c.qa('body abbr').some(a => (a.getAttribute('title') || '').trim().length >= 3 && a.textContent.trim().length >= 2),
      where: c => c.lineOf(/<abbr\b/i),
      hints: [
        '`abbr` – парный элемент вокруг сокращения. Полная форма записывается в атрибуте `title`.',
        'Сокращение внутри тега, расшифровка – в `title` открывающего тега.',
        'Образец: `<abbr title="Web Content Accessibility Guidelines">WCAG</abbr>`'
      ]
    },
    {
      id: 'time',
      label: 'Дата размечена `time` с `datetime` в формате `ГГГГ-ММ-ДД`',
      test: c => c.qa('body time').some(t => DATETIME.test((t.getAttribute('datetime') || '').trim()) && t.textContent.trim().length >= 2),
      where: c => c.lineOf(/<time\b/i),
      hints: [
        'Дата в тексте заключается в `time`, а машиночитаемое значение – в атрибут `datetime`.',
        'Значение записывается цифрами: год, месяц, день через дефис, с ведущими нулями. Время – через букву `T`: `2026-11-17T18:30`.',
        'Образец: `<time datetime="2026-11-17">17 ноября</time>`'
      ]
    },
    {
      id: 'hreflang',
      label: 'Ссылка на ресурс на другом языке с атрибутом `hreflang`',
      test: c => c.qa('body a[href][hreflang]').some(a => {
        const l = a.getAttribute('hreflang').trim();
        return LANG_CODE.test(l) && !/^ru(-|$)/i.test(l);
      }),
      where: c => c.lineOf(/\shreflang\s*=/i) ?? lineOfText(c, 'https://en.'),
      hints: [
        '`hreflang` сообщает язык страницы, на которую ведёт ссылка. Нужна ссылка на ресурс не на русском языке.',
        'Значение – код языка той страницы, например `en`. Если текст ссылки тоже на другом языке, добавьте ему `lang`.',
        'Образец: `<a href="https://en.wikipedia.org/wiki/Linguistics" hreflang="en" lang="en">Linguistics – Wikipedia</a>`'
      ]
    }
  ],

  solution: c0 => insertBeforeMainEnd(baseFor(c0, prevStep, makeContext), [
    '<section id="languages">',
    '  <h2>Языки и источники</h2>',
    '  <p>Рабочее название исследования – <span lang="en">Language in Context</span>.</p>',
    '  <p>Записи размечены в программе <span translate="no">ELAN</span>, требования к доступности сайта – по стандарту <abbr title="Web Content Accessibility Guidelines">WCAG</abbr>.</p>',
    '  <p>Ближайший семинар – <time datetime="2026-11-17T18:30">17 ноября в 18:30</time>.</p>',
    '  <p>Справочный материал: <a href="https://en.wikipedia.org/wiki/Linguistics" hreflang="en" lang="en">Linguistics – Wikipedia</a></p>',
    '</section>'
  ]),

  quiz: [
    {
      q: 'Какая запись кода языка верна для британского английского?',
      options: ['`en-GB`', '`en_GB`', '`eng-UK`', '`GB-en`'],
      correct: 0,
      explain: 'По BCP 47 код языка пишется строчными буквами, регион – через дефис заглавными: `en-GB`. Подчёркивание и трёхбуквенное `eng` с регионом `UK` не соответствуют стандарту.'
    },
    {
      q: 'Что делает атрибут `translate="no"`?',
      options: [
        'Запрещает автоматический перевод фрагмента',
        'Скрывает фрагмент при переводе страницы',
        'Отключает проверку орфографии фрагмента',
        'Сохраняет фрагмент на языке оригинала в `lang`'
      ],
      correct: 0,
      explain: 'Переводчики браузеров и системы машинного перевода оставляют такой фрагмент без изменений. Фрагмент при этом остаётся видимым.'
    },
    {
      q: 'Как записать `datetime` для даты «17 ноября 2026 года»?',
      options: ['`2026-11-17`', '`17.11.2026`', '`17 ноября 2026`', '`11/17/2026`'],
      correct: 0,
      explain: 'Значение `datetime` записывается в едином формате `ГГГГ-ММ-ДД` независимо от языка страницы. Для читателя дата в тексте может быть записана как угодно.'
    },
    {
      q: 'Зачем размечать иноязычную цитату атрибутом `lang`?',
      options: [
        'Чтобы её верно произнесла программа экранного доступа',
        'Чтобы браузер показал её другим шрифтом по умолчанию',
        'Чтобы поисковые системы исключили её из индекса сайта',
        'Чтобы браузер автоматически перевёл её на русский язык'
      ],
      correct: 0,
      explain: 'По `lang` программа экранного доступа выбирает правила произношения, браузер – правила переносов и кавычек.'
    },
    {
      q: 'Для чего нужен элемент `bdi`?',
      options: [
        'Изолирует фрагмент с неизвестным направлением',
        'Выделяет фрагмент на языке с письмом справа налево',
        'Меняет направление письма у всей страницы сразу',
        'Запрещает перенос фрагмента на новую строку'
      ],
      correct: 0,
      explain: '`bdi` не даёт тексту с другим направлением письма, например имени пользователя на арабском, нарушить порядок соседнего текста. Направление страницы задаётся `dir` у `html`.'
    }
  ],

  passScore: 0.8
};
