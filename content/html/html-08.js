/* ==================================================================
   Шаг html-08 · Аудио и видео
   Продолжает страницу студента из шага 7 (starter: 'previous').
   Медиатека курса: assets/media/.
   ================================================================== */

import prevStep from './html-07.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts, appendToBody, previousKept } from './shared.js';

const MEDIA = ['lingua.mp4', 'lingua.webm', 'chime.mp3', 'poster.jpg', 'lingua.ru.vtt', 'lingua.en.vtt'];
const okPath = p => {
  const s = (p || '').trim();
  if (/^https:\/\/\S+$/i.test(s)) return true;
  const m = s.match(/^(?:\.\/)?assets\/media\/([^/\s]+)$/);
  return Boolean(m && MEDIA.includes(m[1]));
};
const sourcesOf = el => [el.getAttribute('src'), ...[...el.querySelectorAll('source')].map(s => s.getAttribute('src'))]
  .filter(v => v != null && v.trim());

function fallbackText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('source, track').forEach(n => n.remove());
  return clone.textContent.trim();
}

export default {
  title: 'Аудио и видео',

  theory: `
<h2>Аудио и видео</h2>
<p class="lead">Элементы <code>audio</code> и <code>video</code> встраивают звук и видео с помощью встроенного проигрывателя браузера, без сторонних программ. Разметка определяет источник, управление, обложку, субтитры и содержание на случай, если воспроизведение невозможно.</p>

<h3>Элементы audio и video</h3>
<pre><code>&lt;video src="assets/media/lingua.mp4" width="640" height="360"
       poster="assets/media/poster.jpg" controls&gt;
&lt;/video&gt;

&lt;audio src="assets/media/chime.mp3" controls&gt;&lt;/audio&gt;</code></pre>
<p>Оба элемента парные. <code>width</code> и <code>height</code> у видео резервируют место на странице, как у изображения. <code>poster</code> – изображение, которое показывается до начала воспроизведения.</p>

<h3>Атрибуты управления</h3>
<ul>
  <li><code>controls</code> – встроенная панель: воспроизведение, громкость, перемотка, полноэкранный режим. Без неё пользователь не может управлять воспроизведением.</li>
  <li><code>muted</code> – звук выключен при загрузке, <code>loop</code> – повтор.</li>
  <li><code>autoplay</code> – автоматический запуск. Браузеры разрешают его только без звука, вместе с <code>muted</code>. Звук, который запускается сам и не выключается, мешает пользователям программ экранного доступа и нарушает требования доступности.</li>
  <li><code>preload="none"</code> или <code>"metadata"</code> – загружать файл целиком только после нажатия на воспроизведение или загружать лишь сведения о длительности.</li>
</ul>

<h3>Несколько источников</h3>
<p>Браузеры поддерживают разные форматы. Вместо атрибута <code>src</code> внутри элемента можно перечислить источники <code>source</code>, и браузер возьмёт первый подходящий. Атрибут <code>type</code> сообщает формат заранее, и браузеру не приходится загружать неподходящий файл.</p>
<pre><code>&lt;video width="640" height="360" controls&gt;
  &lt;source src="assets/media/lingua.webm" type="video/webm"&gt;
  &lt;source src="assets/media/lingua.mp4" type="video/mp4"&gt;
&lt;/video&gt;</code></pre>
<p>Формат MP4 с кодеком H.264 поддерживают практически все браузеры, WebM – открытый формат, который часто даёт меньший размер файла. Указывать оба – надёжный вариант.</p>

<h3>Субтитры</h3>
<p>Текстовые дорожки подключаются элементом <code>track</code> внутри <code>video</code>. Файл дорожки записывается в формате WebVTT: после заголовка <code>WEBVTT</code> следуют фрагменты с интервалом времени и текстом.</p>
<pre><code>WEBVTT

00:00:00.300 --&gt; 00:00:03.700
Язык – это система знаков.</code></pre>
<ul>
  <li><code>kind="subtitles"</code> – перевод речи для зрителей, не владеющих языком видео; <code>kind="captions"</code> – расшифровка для глухих и слабослышащих, включающая значимые звуки: музыку, смех, стук;</li>
  <li><code>srclang</code> – язык дорожки, <code>label</code> – её название в меню проигрывателя;</li>
  <li><code>default</code> – дорожка, включённая по умолчанию; указывается не больше чем у одной.</li>
</ul>
<pre><code>&lt;track src="assets/media/lingua.ru.vtt" kind="subtitles"
       srclang="ru" label="Русский" default&gt;
&lt;track src="assets/media/lingua.en.vtt" kind="subtitles"
       srclang="en" label="English"&gt;</code></pre>
<p>Подготовка субтитров на нескольких языках – самостоятельная задача локализации: перевод согласуется с длительностью фрагмента и скоростью чтения.</p>

<h3>Альтернативное содержание</h3>
<p>Текст внутри <code>audio</code> и <code>video</code>, после <code>source</code> и <code>track</code>, браузер показывает, если не может воспроизвести файл. Туда помещают ссылку для скачивания. Для доступности рядом с проигрывателем полезна текстовая расшифровка: её можно прочитать, найти поиском и перевести.</p>

<h3>Медиатека курса</h3>
<ul class="parts">
  <li><code class="parts__tag">assets/media/lingua.mp4</code>Видео 12 секунд, 640 на 360 пикселей: три слайда о языке и тихий фоновый звук. То же видео в формате WebM: <code>assets/media/lingua.webm</code>.</li>
  <li><code class="parts__tag">assets/media/poster.jpg</code>Обложка к видео, 640 на 360 пикселей.</li>
  <li><code class="parts__tag">assets/media/lingua.ru.vtt</code>Русские субтитры к видео; <code>assets/media/lingua.en.vtt</code> – английские.</li>
  <li><code class="parts__tag">assets/media/chime.mp3</code>Звук 8 секунд: четыре ноты.</li>
</ul>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>нет <code>controls</code> – воспроизведение невозможно запустить;</li>
    <li><code>autoplay</code> без <code>muted</code> – браузер заблокирует запуск;</li>
    <li>у дорожки нет <code>srclang</code> или <code>label</code>, и в меню проигрывателя она безымянна;</li>
    <li><code>default</code> указан у нескольких дорожек.</li>
  </ul>
</div>
`,

  task: [
    'Продолжите свою страницу, используя медиатеку курса.',
    'Добавьте видео `video` с `controls`, `width`, `height` и обложкой `poster`, подключите две дорожки субтитров `track` – русскую по умолчанию и английскую, у каждой `kind`, `srclang` и `label`. Внутри `video` после дорожек напишите альтернативный текст со ссылкой на скачивание файла.',
    'Добавьте звук `audio` с `controls` и альтернативным текстом внутри.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(7, '`h1`, `h2`, абзацы, список, ссылки, изображения',
      c => c.qa('body h1').length === 1 && texts(c, 'body h2').length >= 2 &&
        c.qa('body ul, body ol').length > 0 && c.qa('body a[href]').length > 0 && c.qa('body img').length >= 1),
    {
      id: 'video',
      label: 'Есть `video` с `controls`, `width`, `height` и `poster`',
      test: c => c.qa('body video').some(v => v.hasAttribute('controls') &&
        /^\d+$/.test(v.getAttribute('width') || '') && /^\d+$/.test(v.getAttribute('height') || '') &&
        (v.getAttribute('poster') || '').trim()),
      where: c => c.lineOf(/<video\b/i),
      hints: [
        'У открывающего тега `video` должны быть четыре атрибута: `controls`, `width`, `height` и `poster`.',
        '`controls` пишется без значения. Размеры – числами без единиц, у видео курса 640 на 360. Обложка курса: `assets/media/poster.jpg`.',
        'Образец: `<video src="assets/media/lingua.mp4" width="640" height="360" poster="assets/media/poster.jpg" controls>`'
      ]
    },
    {
      id: 'sources',
      label: 'Пути к видео, обложке и дорожкам ведут к существующим файлам',
      test: c => {
        const v = c.q('body video');
        if (!v) return false;
        const all = [...sourcesOf(v), v.getAttribute('poster'), ...[...v.querySelectorAll('track')].map(t => t.getAttribute('src'))];
        return sourcesOf(v).length > 0 && all.every(okPath);
      },
      where: c => c.lineOf(/<video\b/i),
      hints: [
        'Один из путей в `video` не ведёт к файлу: видео, обложка или субтитры не загрузятся.',
        'Файлы медиатеки: `assets/media/lingua.mp4`, `poster.jpg`, `lingua.ru.vtt`, `lingua.en.vtt`. Регистр и точки в именах важны.',
        'Образец: `src="assets/media/lingua.mp4"` и `src="assets/media/lingua.ru.vtt"` у дорожки.'
      ]
    },
    {
      id: 'tracks',
      label: 'Две дорожки `track` с `kind`, `srclang` и `label`, ровно одна с `default`',
      test: c => c.qa('body video').some(v => {
        const tr = [...v.querySelectorAll('track')];
        const full = tr.filter(t => /^(subtitles|captions)$/i.test(t.getAttribute('kind') || '') &&
          (t.getAttribute('srclang') || '').trim() && (t.getAttribute('label') || '').trim());
        const langs = new Set(full.map(t => t.getAttribute('srclang').trim().toLowerCase()));
        return full.length >= 2 && langs.size >= 2 && tr.filter(t => t.hasAttribute('default')).length === 1;
      }),
      where: c => c.lineOf(/<track\b/i) ?? c.lineOf(/<video\b/i),
      hints: [
        'Внутри `video` нужны две дорожки на разных языках. У каждой – `kind`, `srclang` и `label`; `default` – только у одной.',
        '`kind="subtitles"`, `srclang="ru"` или `"en"`, `label` – название на языке дорожки: «Русский», «English». `track` – пустой элемент.',
        'Образец: `<track src="assets/media/lingua.en.vtt" kind="subtitles" srclang="en" label="English">`'
      ]
    },
    {
      id: 'fallback',
      label: 'Внутри `video` есть альтернативный текст со ссылкой',
      test: c => c.qa('body video').some(v => fallbackText(v).length >= 10 && v.querySelector('a[href]')),
      where: c => c.lineOf(/<\/video\s*>/i),
      hints: [
        'Перед закрывающим `</video>` нужен текст, который увидит пользователь браузера без поддержки видео.',
        'Текст ставится после всех `source` и `track` и содержит ссылку `a` на сам файл видео.',
        'Образец: `<p>Видео не воспроизводится. <a href="assets/media/lingua.mp4">Скачать видео, MP4, 130 КБ</a></p>`'
      ]
    },
    {
      id: 'audio',
      label: 'Есть `audio` с `controls`, источником и альтернативным текстом',
      test: c => c.qa('body audio').some(a => a.hasAttribute('controls') && sourcesOf(a).some(okPath) && fallbackText(a).length >= 5),
      where: c => c.lineOf(/<audio\b/i),
      hints: [
        'Звук добавляется парным элементом `audio` с атрибутом `controls` и путём к файлу.',
        'Файл медиатеки: `assets/media/chime.mp3`. Между `<audio …>` и `</audio>` напишите короткий альтернативный текст.',
        'Образец: `<audio src="assets/media/chime.mp3" controls>Звуковой фрагмент не воспроизводится.</audio>`'
      ]
    },
    {
      id: 'autoplay',
      label: 'Нет автозапуска со звуком: `autoplay` только вместе с `muted`',
      test: c => c.qa('body video[autoplay], body audio[autoplay]').every(m => m.tagName === 'VIDEO' && m.hasAttribute('muted')),
      where: c => c.lineOf(/<(video|audio)\b[^>]*\bautoplay/i),
      hints: [
        'Автозапуск со звуком браузеры блокируют, а пользователям он мешает.',
        'Уберите `autoplay` или, для видео, добавьте `muted`. У `audio` автозапуск не используется.',
        'Лучший вариант для учебной страницы: без `autoplay`, пользователь запускает воспроизведение сам.'
      ]
    }
  ],

  solution: c0 => appendToBody(baseFor(c0, prevStep, makeContext), [
    '',
    '<video width="640" height="360" poster="assets/media/poster.jpg" controls>',
    '  <source src="assets/media/lingua.webm" type="video/webm">',
    '  <source src="assets/media/lingua.mp4" type="video/mp4">',
    '  <track src="assets/media/lingua.ru.vtt" kind="subtitles" srclang="ru" label="Русский" default>',
    '  <track src="assets/media/lingua.en.vtt" kind="subtitles" srclang="en" label="English">',
    '  <p>Видео не воспроизводится. <a href="assets/media/lingua.mp4">Скачать видео, MP4, 130 КБ</a></p>',
    '</video>',
    '',
    '<audio src="assets/media/chime.mp3" controls>',
    '  Звуковой фрагмент не воспроизводится. <a href="assets/media/chime.mp3">Скачать звук, MP3</a>',
    '</audio>'
  ]),

  quiz: [
    {
      q: 'Что произойдёт, если у `video` нет атрибута `controls`?',
      options: [
        'Пользователь не сможет запустить видео',
        'Видео запустится автоматически без звука',
        'Браузер покажет только обложку `poster`',
        'Видео будет загружено в низком качестве'
      ],
      correct: 0,
      explain: 'Без `controls` встроенная панель не отображается, и управлять воспроизведением нечем, если на странице нет собственных кнопок на JavaScript.'
    },
    {
      q: 'При каком условии браузеры разрешают `autoplay`?',
      options: [
        'Если указан `muted`',
        'Если указан `loop`',
        'Если указан `poster`',
        'Если указан `preload`'
      ],
      correct: 0,
      explain: 'Автозапуск со звуком браузеры блокируют. Видео без звука с `muted` может запуститься само.'
    },
    {
      q: 'Чем `kind="captions"` отличается от `kind="subtitles"`?',
      options: [
        'Включает описание значимых звуков',
        'Показывается только на смартфонах',
        'Выводится поверх обложки до запуска',
        'Не требует указывать атрибут `srclang`'
      ],
      correct: 0,
      explain: '`captions` рассчитаны на глухих и слабослышащих: кроме речи они передают музыку, смех, шумы. `subtitles` – перевод речи для тех, кто не владеет языком видео.'
    },
    {
      q: 'Для чего нужен `source` вместо атрибута `src`?',
      options: [
        'Чтобы перечислить файлы в разных форматах',
        'Чтобы подключить к видео дорожку субтитров',
        'Чтобы показать обложку до начала воспроизведения',
        'Чтобы видео загружалось отложенно, при прокрутке'
      ],
      correct: 0,
      explain: 'Внутри `video` можно указать несколько `source`, и браузер выберет первый поддерживаемый формат. Субтитры подключаются `track`, обложка – атрибутом `poster`.'
    },
    {
      q: 'Когда браузер показывает текст внутри `video`?',
      options: [
        'Если не может воспроизвести видео',
        'Во время загрузки первых кадров видео',
        'После окончания воспроизведения ролика',
        'При наведении курсора мыши на видео'
      ],
      correct: 0,
      explain: 'Содержимое `video`, кроме `source` и `track`, – альтернатива для браузеров, которые не могут воспроизвести файл. Туда помещают ссылку для скачивания.'
    }
  ],

  passScore: 0.8
};
