/* ==================================================================
   Шаг html-07 · Изображения
   Продолжает страницу студента из шага 6 (starter: 'previous').
   Библиотека изображений курса: assets/img/.
   ================================================================== */

import prevStep from './html-06.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts, appendToBody, previousKept, lineOfText } from './shared.js';

export const LIBRARY = ['books.svg', 'microphone.svg', 'dialogue.svg', 'globe.svg'];
const BAD_ALT = /^(изображение|картинка|фото|фотография|рисунок|image|picture|photo|img)\b/i;
const POSITIVE_INT = /^[1-9]\d{0,4}$/;

function srcProblem(src) {
  const s = (src || '').trim();
  if (!s) return 'нет адреса';
  if (/^https:\/\//i.test(s)) return /\s/.test(s) ? 'пробел в адресе' : null;
  if (/\s/.test(s)) return 'пробел в пути';
  if (/\\/.test(s)) return 'обратная косая черта';
  const m = s.match(/^(?:\.\/)?assets\/img\/([^/]+)$/);
  if (!m) return 'путь не к библиотеке курса';
  return LIBRARY.includes(m[1]) ? null : 'такого файла нет в библиотеке';
}

const lineOfImg = (c, img) => lineOfText(c, img.getAttribute('src')) ?? c.lineOf(/<img\b/i);

export default {
  title: 'Изображения',

  theory: `
<h2>Изображения</h2>
<p class="lead">Изображение в HTML – внешний файл, который браузер загружает отдельно от страницы. Разметка сообщает браузеру, где лежит файл, какого он размера и что делать, если изображение недоступно или не видно пользователю.</p>

<h3>Элемент img</h3>
<p><code>img</code> – пустой элемент: у него нет закрывающего тега. Путь к файлу указывается в атрибуте <code>src</code>, текстовая замена – в <code>alt</code>, размеры – в <code>width</code> и <code>height</code>.</p>
<pre><code>&lt;img src="assets/img/books.svg" alt="Стопка учебников, сверху раскрытая книга"
     width="800" height="600"&gt;</code></pre>

<h3>Альтернативный текст</h3>
<p>Атрибут <code>alt</code> заменяет изображение для программы экранного доступа, поисковой системы и для всех, у кого изображение не загрузилось. Его содержание зависит от роли изображения на странице.</p>
<ul>
  <li><strong>Информативное изображение</strong> – <code>alt</code> передаёт то, что важно в данном контексте, одним-двумя предложениями. Одно и то же фото на странице о книгах и на странице об интерьере описывается по-разному.</li>
  <li><strong>Изображение с текстом</strong> – текст с изображения переносится в <code>alt</code> полностью.</li>
  <li><strong>Декоративное изображение</strong> – <code>alt=""</code>: атрибут присутствует, но пуст, и программа экранного доступа пропускает изображение.</li>
</ul>
<p>Слова «изображение», «картинка», «фото» в начале <code>alt</code> избыточны: программа экранного доступа сама сообщает, что это изображение. Если атрибут <code>alt</code> отсутствует, программа может зачитать имя файла.</p>

<h3>Размеры изображения</h3>
<p>Атрибуты <code>width</code> и <code>height</code> задают размер в пикселях числами без единиц. По ним браузер заранее резервирует место и строит страницу до загрузки файла, поэтому текст не смещается, когда изображение появляется. Значения должны сохранять пропорции исходного файла. Гибкие размеры, зависящие от ширины экрана, задаются в CSS.</p>

<h3>Отложенная загрузка</h3>
<p>Атрибут <code>loading="lazy"</code> откладывает загрузку изображения, пока пользователь не прокрутит страницу близко к нему. Это экономит трафик и ускоряет первую отрисовку. Для изображений первого экрана отложенная загрузка не применяется: они нужны сразу.</p>

<h3>Форматы и имена файлов</h3>
<ul>
  <li><strong>JPEG</strong> – фотографии и изображения с плавными переходами цвета;</li>
  <li><strong>PNG</strong> – графика с чёткими краями и прозрачностью;</li>
  <li><strong>SVG</strong> – векторная графика: иконки, схемы, иллюстрации; не теряет чёткости при увеличении;</li>
  <li><strong>WebP</strong> и <strong>AVIF</strong> – современные форматы с сильным сжатием. Подстановка разных форматов и размеров под экран рассматривается в модуле CSS.</li>
</ul>
<p>Имена файлов записываются латиницей, строчными буквами, без пробелов, через дефис: <code>workshop-hall.jpg</code>. На GitHub Pages регистр имеет значение: <code>Photo.JPG</code> и <code>photo.jpg</code> – разные файлы.</p>

<h3>Изображение с подписью</h3>
<p>Элемент <code>figure</code> объединяет иллюстрацию и её подпись <code>figcaption</code>. Подпись видна всем и дополняет изображение, <code>alt</code> заменяет его для тех, кто изображение не видит. Поэтому подпись и альтернативный текст не повторяют друг друга.</p>
<pre><code>&lt;figure&gt;
  &lt;img src="assets/img/dialogue.svg" width="800" height="600"
       alt="Две реплики диалога: «Привет» и «Hello»"&gt;
  &lt;figcaption&gt;Одна и та же реплика в русском и английском тексте&lt;/figcaption&gt;
&lt;/figure&gt;</code></pre>

<h3>Библиотека изображений курса</h3>
<p>Для заданий можно использовать файлы курса, указывая путь <code>assets/img/</code> и имя файла, или собственные изображения по полному адресу <code>https://</code>. Все файлы курса имеют размер 800 на 600 пикселей.</p>
<ul class="parts">
  <li><code class="parts__tag">assets/img/books.svg</code><img src="assets/img/books.svg" width="160" height="120" alt="Стопка книг, сверху раскрытая книга"></li>
  <li><code class="parts__tag">assets/img/microphone.svg</code><img src="assets/img/microphone.svg" width="160" height="120" alt="Микрофон на стойке и звуковые волны по обе стороны"></li>
  <li><code class="parts__tag">assets/img/dialogue.svg</code><img src="assets/img/dialogue.svg" width="160" height="120" alt="Две реплики диалога: «Привет» и «Hello»"></li>
  <li><code class="parts__tag">assets/img/globe.svg</code><img src="assets/img/globe.svg" width="160" height="120" alt="Глобус с метками языков RU, EN, ZH, AR"></li>
</ul>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li><code>alt</code> отсутствует или дублирует имя файла;</li>
    <li>текст с изображения не перенесён в <code>alt</code>;</li>
    <li>значения <code>width</code> и <code>height</code> с единицами: <code>width="800px"</code>;</li>
    <li>пробелы и кириллица в имени файла, несовпадение регистра;</li>
    <li><code>loading="lazy"</code> у главного изображения первого экрана.</li>
  </ul>
</div>
`,

  task: [
    'Продолжите свою страницу. Добавьте два изображения из библиотеки курса или свои по адресу `https://`:',
    'одно оформите как иллюстрацию с подписью: `figure`, внутри `img` и `figcaption`; у каждого изображения укажите содержательный `alt` (с учётом того, о чём ваша страница), `width` и `height`; изображению, которое стоит ниже по странице, задайте `loading="lazy"`.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(6, 'один `h1`, два `h2`, абзацы, список, ссылки',
      c => c.qa('body h1').length === 1 && texts(c, 'body h2').length >= 2 &&
        texts(c, 'body p', 10).length >= 2 && c.qa('body ul, body ol').length > 0 && c.qa('body a[href]').length > 0),
    {
      id: 'twoImages',
      label: 'На странице не меньше двух изображений `img` с `src`',
      test: c => c.qa('body img[src]').filter(i => i.getAttribute('src').trim()).length >= 2,
      where: () => null,
      hints: [
        'Нужны два элемента `img`, у каждого атрибут `src` с путём к файлу.',
        '`img` – пустой элемент, закрывающий тег не пишется. Путь к файлу курса: `assets/img/` и имя файла.',
        'Образец: `<img src="assets/img/globe.svg" alt="…" width="800" height="600">`'
      ]
    },
    {
      id: 'src',
      label: 'Пути к файлам верные: библиотека курса или адрес `https://`',
      test: c => c.qa('body img').length > 0 && c.qa('body img').every(i => !srcProblem(i.getAttribute('src'))),
      where: c => { const i = c.qa('body img').find(el => srcProblem(el.getAttribute('src'))); return i ? lineOfImg(c, i) : null; },
      hints: [
        'Один из путей не ведёт к существующему файлу: изображение не загрузится.',
        'Файлы курса: `assets/img/books.svg`, `microphone.svg`, `dialogue.svg`, `globe.svg` – строчными буквами, без пробелов. Чужие файлы указываются полным адресом с `https://`.',
        'Образец: `src="assets/img/dialogue.svg"`'
      ]
    },
    {
      id: 'alt',
      label: 'У каждого `img` есть `alt`; содержательный – от 5 символов и без слов «изображение», «фото»',
      test: c => {
        const imgs = c.qa('body img');
        if (!imgs.length || !imgs.every(i => i.hasAttribute('alt'))) return false;
        const filled = imgs.map(i => i.getAttribute('alt').trim()).filter(Boolean);
        return filled.length >= 2 && filled.every(a => a.length >= 5 && !BAD_ALT.test(a) && !/\.(svg|png|jpe?g|webp)$/i.test(a));
      },
      where: c => {
        const i = c.qa('body img').find(el => {
          const a = (el.getAttribute('alt') ?? '').trim();
          return !el.hasAttribute('alt') || (a && (a.length < 5 || BAD_ALT.test(a)));
        });
        return i ? lineOfImg(c, i) : null;
      },
      hints: [
        'Проверьте `alt` у обоих изображений: он есть, не пустой и описывает, что важно на картинке для вашей страницы.',
        'Не начинайте с «Изображение» или «Фото» и не пишите имя файла. Если на картинке есть текст, перенесите его в `alt`.',
        'Образец: `alt="Глобус с метками языков RU, EN, ZH и AR"`'
      ]
    },
    {
      id: 'size',
      label: 'У каждого `img` заданы `width` и `height` числами без единиц',
      test: c => c.qa('body img').length > 0 && c.qa('body img').every(i =>
        POSITIVE_INT.test((i.getAttribute('width') || '').trim()) && POSITIVE_INT.test((i.getAttribute('height') || '').trim())),
      where: c => {
        const i = c.qa('body img').find(el => !POSITIVE_INT.test((el.getAttribute('width') || '').trim()) ||
          !POSITIVE_INT.test((el.getAttribute('height') || '').trim()));
        return i ? lineOfImg(c, i) : null;
      },
      hints: [
        'У одного из изображений нет размера или он записан с единицами.',
        'Значения `width` и `height` – целые числа пикселей без `px`. У файлов курса размер 800 на 600.',
        'Образец: `width="800" height="600"`'
      ]
    },
    {
      id: 'figure',
      label: 'Одно изображение оформлено в `figure` с подписью `figcaption`',
      test: c => c.qa('body figure').some(f => f.querySelector('img') &&
        (f.querySelector('figcaption')?.textContent.trim().length || 0) >= 5),
      where: c => c.lineOf(/<figure\b/i),
      hints: [
        '`figure` объединяет изображение и подпись. Внутри должны быть и `img`, и `figcaption` с текстом.',
        'Подпись дополняет изображение и не повторяет `alt`. `figcaption` ставится первым или последним элементом внутри `figure`.',
        'Образец: `<figure>`, затем `<img …>`, затем `<figcaption>Подпись к иллюстрации</figcaption>`, затем `</figure>`.'
      ]
    },
    {
      id: 'lazy',
      label: 'Изображение ниже по странице загружается отложенно: `loading="lazy"`',
      test: c => c.qa('body img').slice(1).some(i => (i.getAttribute('loading') || '').toLowerCase() === 'lazy'),
      where: c => { const imgs = c.qa('body img'); return imgs[1] ? lineOfImg(c, imgs[1]) : null; },
      hints: [
        'Атрибут `loading="lazy"` нужен изображению, которое стоит не первым на странице.',
        'Первое изображение пользователь увидит сразу, поэтому ему отложенная загрузка не нужна. Добавьте атрибут второму.',
        'Образец: `<img src="assets/img/books.svg" alt="…" width="800" height="600" loading="lazy">`'
      ]
    }
  ],

  solution: c0 => appendToBody(baseFor(c0, prevStep, makeContext), [
    '',
    '<figure>',
    '  <img src="assets/img/dialogue.svg" width="800" height="600" alt="Две реплики диалога: «Привет» и «Hello»">',
    '  <figcaption>Одна и та же реплика в русском и английском тексте</figcaption>',
    '</figure>',
    '<img src="assets/img/globe.svg" width="800" height="600" loading="lazy" alt="Глобус с метками языков RU, EN, ZH и AR">'
  ]),

  quiz: [
    {
      q: 'На изображении кнопка с надписью «Записаться». Какой `alt` подходит?',
      options: [
        '`alt="Записаться"`',
        '`alt="Изображение кнопки"`',
        '`alt="button.png"`',
        '`alt=""`'
      ],
      correct: 0,
      explain: 'Текст с изображения переносится в `alt`. Слово «изображение» избыточно, имя файла ничего не сообщает, а пустой `alt` скрыл бы надпись.'
    },
    {
      q: 'Когда `alt` оставляют пустым: `alt=""`?',
      options: [
        'Если изображение чисто декоративное',
        'Если у изображения уже есть подпись',
        'Если изображение совсем маленькое',
        'Если файл изображения в формате SVG'
      ],
      correct: 0,
      explain: 'Пустой `alt` сообщает, что изображение не несёт информации, и программа экранного доступа его пропускает. Подпись `figcaption` не заменяет `alt`.'
    },
    {
      q: 'Зачем указывать `width` и `height` у `img`?',
      options: [
        'Чтобы браузер заранее зарезервировал место',
        'Чтобы изображение загружалось быстрее',
        'Чтобы изображение сжималось до этих размеров',
        'Чтобы поисковые системы нашли изображение'
      ],
      correct: 0,
      explain: 'По размерам браузер строит страницу до загрузки файла, и текст не смещается при появлении изображения. На скорость загрузки и вес файла атрибуты не влияют.'
    },
    {
      q: 'Какому изображению не нужен `loading="lazy"`?',
      options: [
        'Главному изображению первого экрана',
        'Иллюстрации в середине длинной статьи',
        'Фотографии в конце страницы',
        'Изображению в свёрнутом разделе'
      ],
      correct: 0,
      explain: 'Изображение первого экрана видно сразу. Отложенная загрузка задержала бы его появление.'
    },
    {
      q: 'Чем `figcaption` отличается от `alt`?',
      options: [
        'Подпись видят все, `alt` заменяет изображение',
        'Подпись показывается только при наведении мыши',
        'Подпись нужна лишь поисковым системам, не людям',
        'Подпись заменяет `alt`, если он оставлен пустым'
      ],
      correct: 0,
      explain: '`figcaption` – видимая подпись, дополняющая изображение. `alt` – текстовая замена для тех, кто изображение не видит. Они выполняют разные задачи и не дублируют друг друга.'
    }
  ],

  passScore: 0.8
};
