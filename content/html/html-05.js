/* ==================================================================
   Шаг html-05 · Цвет
   Продолжает страницу студента из шага 4 (starter: 'previous').
   Разбор цветов и контраст – js/colors.js.
   ================================================================== */

import prevStep from './html-04.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts } from './shared.js';
import { parseColor, colorFormat, parseStyle, contrast } from '../../js/colors.js';

const COLOR_PROPS = ['color', 'background-color'];
const styleOf = el => parseStyle(el.getAttribute('style'));

function lineOfStyle(c, el) {
  const attr = el.getAttribute('style');
  const i = attr ? c.clean.indexOf(attr) : -1;
  return i >= 0 ? c.clean.slice(0, i).split('\n').length : null;
}

/* Абзац с фоном в rgb()/hsl() и цветом текста – первый подходящий */
function tintedParagraph(c) {
  return c.qa('body p[style]').find(p => {
    const st = styleOf(p);
    return ['rgb', 'hsl'].includes(colorFormat(st['background-color'])) && parseColor(st.color);
  });
}

function badDeclaration(c) {
  for (const el of c.qa('[style]')) {
    const decls = el.getAttribute('style').split(';').map(d => d.trim()).filter(Boolean);
    for (const d of decls) {
      const m = d.match(/^([a-zA-Z-]+)\s*:\s*(.+)$/);
      if (!m) return el;
      if (COLOR_PROPS.includes(m[1].toLowerCase()) && !parseColor(m[2].replace(/\s*!important$/i, ''))) return el;
    }
  }
  return null;
}

export default {
  title: 'Цвет',

  theory: `
<h2>Цвет</h2>
<p class="lead">Цвет относится к оформлению, поэтому в современном HTML нет собственных средств для его задания: оформление описывается на языке CSS. Связующим звеном служит атрибут <code>style</code>, в который CSS записывается прямо на элементе.</p>

<h3>Атрибут style</h3>
<p>Значение атрибута <code>style</code> – одно или несколько CSS-объявлений. Объявление состоит из свойства, двоеточия и значения и завершается точкой с запятой.</p>
<pre><code>&lt;h1 style="color: #1A40E7;"&gt;Мастерская керамики&lt;/h1&gt;
&lt;p style="color: #14161E; background-color: rgb(231 234 253);"&gt;
  Запись открыта до пятницы.
&lt;/p&gt;</code></pre>
<p><code>color</code> задаёт цвет текста, <code>background-color</code> – цвет фона элемента. Встроенные стили удобны там, где подключить таблицу стилей невозможно, например на страницах системы дистанционного обучения, но с ростом сайта их трудно поддерживать. В модуле CSS эти же объявления будут перенесены в отдельную таблицу стилей.</p>

<h3>Способы записи цвета</h3>
<ul class="parts">
  <li><code class="parts__tag">darkred</code>
    Название. В CSS определено 148 названий цветов, от <code>black</code> и <code>white</code> до <code>rebeccapurple</code>. Названия удобны для черновой работы, но их палитра ограничена.</li>
  <li><code class="parts__tag">#1A40E7</code>
    Шестнадцатеричная запись (hex): три пары цифр от <code>00</code> до <code>FF</code> для красного, зелёного и синего каналов. Сокращённая запись <code>#F00</code> равна <code>#FF0000</code>. Четвёртая пара задаёт прозрачность: <code>#1A40E780</code>.</li>
  <li><code class="parts__tag">rgb(26 64 231)</code>
    Те же три канала в десятичных числах от 0 до 255. Прозрачность указывается после косой черты: <code>rgb(26 64 231 / 0.5)</code>. Допустима и старая запись через запятые: <code>rgb(26, 64, 231)</code>.</li>
  <li><code class="parts__tag">hsl(229 81% 50%)</code>
    Тон, насыщенность, светлота. Тон – угол на цветовом круге от 0 до 360 градусов, насыщенность и светлота – проценты. Эта запись удобна для построения палитры: оттенки одного цвета получаются изменением одной светлоты.</li>
</ul>

<h3>Контраст текста и фона</h3>
<p>Контраст – отношение яркостей текста и фона по методике WCAG, от 1:1 (цвета совпадают) до 21:1 (чёрное на белом). Уровень AA требует для обычного текста не меньше 4,5:1, для крупного (от 24 пикселей или от 18,66 пикселя полужирным) – не меньше 3:1. Недостаточный контраст затрудняет чтение при ярком свете, на недорогих экранах и при нарушениях зрения.</p>
<p>Проверить контраст можно в инструментах разработчика браузера: при выборе цвета в панели стилей отображается его коэффициент. В этом шаге контраст рассчитывает проверка песочницы.</p>

<h3>Выбор цвета в браузере</h3>
<p>Элемент <code>&lt;input type="color"&gt;</code> открывает системную палитру. Его значение – всегда шестнадцатеричная запись из шести цифр, например <code>#1a40e7</code>. Это поле формы; формы подробно рассматриваются в разделе «Формы».</p>

<h3>Устаревшие способы</h3>
<p>Атрибуты <code>bgcolor</code>, <code>text</code>, <code>color</code> и элемент <code>font</code> исключены из стандарта HTML. Браузеры по-прежнему отображают их ради совместимости со старыми страницами, но валидатор отмечает их как ошибки.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>пропущено двоеточие или точка с запятой между объявлениями;</li>
    <li>в названии цвета опечатка – браузер молча пропускает такое объявление;</li>
    <li>задан цвет фона, но не задан цвет текста, и контраст зависит от настроек пользователя;</li>
    <li>светло-серый текст на белом фоне с контрастом ниже 4,5:1.</li>
  </ul>
</div>
`,

  task: [
    'Продолжите свою страницу и задайте цвета тремя способами записи:',
    'заголовку `h1` – цвет текста в шестнадцатеричной записи; одному абзацу – цвет фона в записи `rgb()` или `hsl()` и цвет текста, с контрастом не ниже 4,5:1; одному фрагменту `strong` или `em` – цвет текста названием, например `darkred`.',
    'Устаревшие атрибуты `bgcolor`, `color` и элемент `font` не используйте.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    {
      id: 'previous',
      label: 'Сохранены элементы предыдущих шагов: `h1`, абзацы, `strong` или `em`',
      test: c => c.qa('body h1').length === 1 && texts(c, 'body p', 10).length >= 2 &&
        c.qa('body strong, body em').length > 0,
      where: () => null,
      hints: [
        'Элементы, созданные в прошлых шагах, должны остаться на странице.',
        'Проверьте, что на странице один `h1`, не меньше двух абзацев и хотя бы один `strong` или `em`.',
        'Если структура нарушена, нажмите «Начать заново»: редактор откроется с кодом, сданным в шаге 4.'
      ]
    },
    {
      id: 'syntax',
      label: 'Объявления в `style` записаны без ошибок: `свойство: значение;`',
      test: c => c.qa('[style]').length > 0 && !badDeclaration(c),
      where: c => { const el = badDeclaration(c); return el ? lineOfStyle(c, el) : null; },
      hints: [
        'В одном из атрибутов `style` объявление записано с ошибкой или цвет не распознан.',
        'Проверьте: свойство, двоеточие, значение, точка с запятой. Название цвета пишется латиницей без пробелов, hex начинается с `#`, у `rgb()` три числа от 0 до 255.',
        'Образец: `style="color: #14161E; background-color: rgb(231 234 253);"`'
      ]
    },
    {
      id: 'hex',
      label: 'У `h1` цвет текста задан в шестнадцатеричной записи',
      test: c => c.qa('body h1').some(h => colorFormat(styleOf(h).color) === 'hex'),
      where: c => c.lineOf(/<h1\b/i),
      hints: [
        'Нужен атрибут `style` у открывающего тега `h1` со свойством `color` и значением вида `#1A40E7`.',
        'Шестнадцатеричная запись начинается со знака `#`, за ним три или шесть символов: цифры и буквы от A до F.',
        'Образец: `<h1 style="color: #1A40E7;">Название проекта</h1>`'
      ]
    },
    {
      id: 'background',
      label: 'У одного абзаца фон задан в `rgb()` или `hsl()` и задан цвет текста',
      test: c => Boolean(tintedParagraph(c)),
      where: c => { const p = c.q('body p[style]'); return p ? lineOfStyle(c, p) : null; },
      hints: [
        'Выберите абзац и задайте ему два свойства в одном атрибуте `style`: `background-color` и `color`.',
        'Фон записывается функцией: `rgb(231 234 253)` или `hsl(229 80% 95%)`. Объявления разделяются точкой с запятой.',
        'Образец: `<p style="color: #14161E; background-color: rgb(231 234 253);">…</p>`'
      ]
    },
    {
      id: 'contrast',
      label: 'Контраст текста и фона в этом абзаце не ниже 4,5:1',
      test: c => {
        const p = tintedParagraph(c);
        if (!p) return false;
        const st = styleOf(p);
        return contrast(parseColor(st.color), parseColor(st['background-color'])) >= 4.5;
      },
      where: c => { const p = tintedParagraph(c); return p ? lineOfStyle(c, p) : null; },
      hints: [
        'Цвет текста и цвет фона слишком близки по яркости: текст будет плохо читаться.',
        'Для светлого фона выберите тёмный текст, для тёмного – светлый. В `hsl()` достаточно изменить третье число, светлоту.',
        'Надёжная пара: текст `#14161E` на фоне `rgb(231 234 253)`, контраст около 15:1.'
      ]
    },
    {
      id: 'named',
      label: 'У фрагмента `strong` или `em` цвет задан названием',
      test: c => c.qa('body strong[style], body em[style]').some(el => colorFormat(styleOf(el).color) === 'name'),
      where: c => {
        const el = c.q('body strong[style], body em[style]') || c.q('body strong, body em');
        if (!el) return null;
        return el.getAttribute('style') ? lineOfStyle(c, el) : c.lineOf(new RegExp(`<${el.tagName.toLowerCase()}\\b`, 'i'));
      },
      hints: [
        'Задайте атрибут `style` открывающему тегу `strong` или `em` и укажите цвет названием.',
        'Название пишется латиницей, одним словом, без кавычек и `#`: `darkred`, `teal`, `navy`.',
        'Образец: `<strong style="color: darkred;">Запись закрывается за сутки.</strong>`'
      ]
    },
    {
      id: 'noObsolete',
      label: 'Не используются `bgcolor`, атрибут `color` и элемент `font`',
      test: c => !c.q('[bgcolor], [color]:not(input), font, body[text]'),
      where: c => c.lineOf(/<font\b|\sbgcolor\s*=|<(?!input)[a-z]+\b[^>]*\scolor\s*=/i),
      hints: [
        'В коде встречается устаревший способ задать цвет. Цвет задаётся только через `style`.',
        'Замените `bgcolor="…"` на `style="background-color: …;"`, а `<font color="…">` – на `style` у смыслового элемента.',
        'Было: `<p bgcolor="#eee">`. Стало: `<p style="background-color: #eee;">`.'
      ]
    }
  ],

  /* Правильный вариант: цвета добавляются к элементам студента */
  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    let code = c.raw;
    code = code.replace(/<h1\b[^>]*>/i, '<h1 style="color: #1A40E7;">');
    code = code.replace(/<(strong|em)\b[^>]*>/i, (m, tag) => `<${tag} style="color: darkred;">`);
    code = code.replace(/<p\b[^>]*>/i, '<p style="color: #14161E; background-color: rgb(231 234 253);">');
    code = code.replace(/\s(bgcolor|color)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, '')
      .replace(/<\/?font\b[^>]*>/gi, '');
    return code;
  },

  quiz: [
    {
      q: 'Что задаёт свойство `background-color`?',
      options: [
        'Цвет фона элемента',
        'Цвет текста элемента',
        'Цвет рамки элемента',
        'Цвет фона всей страницы'
      ],
      correct: 0,
      explain: '`background-color` окрашивает фон того элемента, у которого указано. Цвет текста задаёт `color`.'
    },
    {
      q: 'Какая запись обозначает тот же цвет, что `#FF0000`?',
      options: ['`rgb(255 0 0)`', '`rgb(0 0 255)`', '`rgb(0 255 0)`', '`rgb(255 255 0)`'],
      correct: 0,
      explain: 'Пары hex соответствуют каналам по порядку: FF – красный 255, 00 – зелёный 0, 00 – синий 0.'
    },
    {
      q: 'Какой минимальный контраст нужен обычному тексту по уровню AA?',
      options: ['4,5:1', '3:1', '7:1', '12,5:1'],
      correct: 0,
      explain: '4,5:1 – порог AA для обычного текста. 3:1 допустим для крупного текста, 7:1 – требование более строгого уровня AAA.'
    },
    {
      q: 'Чем удобна запись `hsl()`?',
      options: [
        'Оттенки одного цвета получаются изменением светлоты',
        'Она поддерживает больше цветов, чем шестнадцатеричная',
        'Только в ней можно задать прозрачность цвета',
        'Браузер обрабатывает её быстрее остальных записей'
      ],
      correct: 0,
      explain: 'Все записи описывают одни и те же цвета, прозрачность есть и в hex, и в `rgb()`. Преимущество `hsl()` – наглядность: тон и насыщенность фиксируются, меняется светлота.'
    },
    {
      q: 'Почему не используют атрибут `bgcolor`?',
      options: [
        'Он исключён из стандарта, цвет задаётся в CSS',
        'Он работает только в браузере Internet Explorer',
        'Он принимает только названия цветов, без hex',
        'Он окрашивает фон всей страницы, а не элемента'
      ],
      correct: 0,
      explain: 'Браузеры ещё отображают `bgcolor` ради совместимости, но в стандарте HTML его нет: оформление отделено от структуры и описывается в CSS.'
    }
  ],

  passScore: 0.8
};
