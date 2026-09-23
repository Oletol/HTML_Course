/* ==================================================================
   Шаг html-10 · Семантические блоки
   Продолжает страницу студента из шага 9 (starter: 'previous').
   ================================================================== */

import prevStep from './html-09.js';
import { makeContext } from '../../js/validator.js';
import { baseFor, skeleton, texts, previousKept, safe } from './shared.js';

const LANDMARKS = ['HEADER', 'MAIN', 'FOOTER'];
const bodyChildren = c => [...(c.doc.body?.children || [])];

function navLinksOk(c) {
  const nav = c.q('body > header nav');
  if (!nav) return false;
  const links = [...nav.querySelectorAll('ul > li > a[href^="#"], ol > li > a[href^="#"]')];
  return links.length >= 2 && links.every(a => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    return id && c.doc.getElementById(id);
  });
}

function sectionsOk(c) {
  const main = c.q('body > main');
  if (!main) return false;
  const sections = [...main.querySelectorAll(':scope > section')];
  return sections.length >= 2 && sections.every(s => s.firstElementChild?.tagName === 'H2');
}

/* Сериализация с отступами для правильного варианта */
function indent(html, pad) {
  /* Вложенные строки сохраняют исходный отступ (содержимое body было на 4 пробелах);
     элемент сдвигается на pad внутри main и ещё на 4 пробела внутри body */
  const extra = ' '.repeat(pad.length);
  return html.split('\n').map((l, i) => (i === 0 ? pad + l.trimStart() : (l.trim() ? extra + l : l))).join('\n');
}

export default {
  title: 'Семантические блоки',

  theory: `
<h2>Семантические блоки</h2>
<p class="lead">Страница делится на области с устойчивым назначением: шапка, навигация, основное содержание, подвал. Семантические элементы HTML называют эти области прямо, и браузер, поисковая система и программа экранного доступа понимают устройство страницы без анализа оформления.</p>

<h3>Области страницы</h3>
<ul class="parts">
  <li><code class="parts__tag">header</code>Вводная часть страницы или раздела: название, логотип, навигация.</li>
  <li><code class="parts__tag">nav</code>Блок основной навигации: ссылки на разделы страницы или другие страницы сайта. Отдельные ссылки в тексте в <code>nav</code> не помещаются.</li>
  <li><code class="parts__tag">main</code>Основное содержание страницы. На странице один <code>main</code>; он не вкладывается в <code>header</code>, <code>footer</code>, <code>article</code>.</li>
  <li><code class="parts__tag">section</code>Тематический раздел документа. Как правило, начинается с заголовка.</li>
  <li><code class="parts__tag">article</code>Самостоятельный фрагмент, понятный вне страницы: запись блога, новость, карточка товара, отзыв.</li>
  <li><code class="parts__tag">aside</code>Дополнительное содержание, косвенно связанное с основным: врезка, список связанных материалов.</li>
  <li><code class="parts__tag">footer</code>Завершающая часть страницы или раздела: контакты, сведения об авторе, правовая информация.</li>
</ul>

<h3>Типовая структура</h3>
<pre><code>&lt;body&gt;
  &lt;header&gt;
    &lt;h1&gt;Центр изучения диалектов&lt;/h1&gt;
    &lt;nav aria-label="Разделы страницы"&gt;
      &lt;ul&gt;
        &lt;li&gt;&lt;a href="#about"&gt;О центре&lt;/a&gt;&lt;/li&gt;
        &lt;li&gt;&lt;a href="#join"&gt;Как принять участие&lt;/a&gt;&lt;/li&gt;
      &lt;/ul&gt;
    &lt;/nav&gt;
  &lt;/header&gt;

  &lt;main&gt;
    &lt;section id="about"&gt;
      &lt;h2&gt;О центре&lt;/h2&gt;
      &lt;p&gt;…&lt;/p&gt;
    &lt;/section&gt;
    &lt;section id="join"&gt;
      &lt;h2&gt;Как принять участие&lt;/h2&gt;
      &lt;p&gt;…&lt;/p&gt;
    &lt;/section&gt;
  &lt;/main&gt;

  &lt;footer&gt;
    &lt;p&gt;&lt;a href="mailto:info@example.org"&gt;info@example.org&lt;/a&gt;&lt;/p&gt;
  &lt;/footer&gt;
&lt;/body&gt;</code></pre>
<p>Навигация оформляется списком ссылок: список сообщает число пунктов и позволяет переходить между ними. Атрибут <code>aria-label</code> даёт блоку навигации название; он нужен, если на странице несколько <code>nav</code>. Атрибут <code>id</code> для якорной ссылки можно поставить на сам <code>section</code>.</p>

<h3>Ориентиры для программ экранного доступа</h3>
<p><code>header</code> на уровне страницы, <code>nav</code>, <code>main</code> и <code>footer</code> на уровне страницы становятся ориентирами (landmarks). Программы экранного доступа показывают их списком и позволяют перейти, например, сразу к основному содержанию, минуя шапку и меню.</p>

<h3>Элемент div</h3>
<p><code>div</code> – контейнер без смысла. Он нужен, когда блок требуется только для оформления или раскладки в CSS и ни один смысловой элемент не подходит. Страница, собранная из одних <code>div</code>, для программы экранного доступа не имеет структуры.</p>

<h3>section или article</h3>
<p>Проверочный вопрос: можно ли фрагмент опубликовать отдельно, и останется ли он понятен? Если да – это <code>article</code>, например отзыв или новость. Если фрагмент – часть общего изложения, это <code>section</code>.</p>

<div class="callout">
  <strong class="callout__title">Типичные ошибки</strong>
  <ul>
    <li>несколько <code>main</code> на странице или <code>main</code> внутри <code>header</code>;</li>
    <li><code>section</code> без заголовка, использованный вместо <code>div</code> для оформления;</li>
    <li>в <code>nav</code> помещены все ссылки страницы, включая ссылки в тексте;</li>
    <li>навигация из ссылок подряд без списка.</li>
  </ul>
</div>
`,

  task: [
    'Перестройте свою страницу по областям.',
    'В `header` поместите `h1` и навигацию `nav` со списком якорных ссылок на разделы страницы (не меньше двух). Всё основное содержание заключите в `main`; внутри него каждый раздел, начинающийся с `h2`, оформите элементом `section`. Абзац с почтовой ссылкой перенесите в `footer` после `main`. Прямыми потомками `body` должны остаться только `header`, `main` и `footer`.'
  ],

  starter: 'previous',

  checks: [
    skeleton,
    previousKept(9, '`h1`, два `h2`, абзацы, список, изображения, медиа, фрейм',
      c => c.qa('body h1').length === 1 && texts(c, 'body h2').length >= 2 &&
        c.qa('body ul, body ol').length > 0 && c.qa('body img').length >= 1 &&
        c.qa('body video, body audio').length >= 1 && c.qa('body iframe').length >= 1),
    {
      id: 'header',
      label: '`header` – прямой потомок `body` и содержит `h1`',
      test: c => Boolean(c.q('body > header h1')),
      where: c => c.lineOf(/<header\b/i) ?? c.lineOf(/<h1\b/i),
      hints: [
        'Шапка страницы – элемент `header` сразу внутри `body`, в нём заголовок `h1`.',
        'Поставьте `<header>` перед `h1`, а `</header>` – после навигации.',
        'Образец: `<header>`, затем `<h1>…</h1>`, затем `<nav>…</nav>`, затем `</header>`.'
      ]
    },
    {
      id: 'nav',
      label: 'В `header` есть `nav` со списком из двух и более якорных ссылок на разделы',
      test: navLinksOk,
      where: c => c.lineOf(/<nav\b/i) ?? c.lineOf(/<\/header\s*>/i),
      hints: [
        'Навигация – элемент `nav` внутри `header`. Ссылки в нём оформлены списком `ul`, каждая в своём `li`.',
        'Каждая ссылка ведёт к существующему `id`: поставьте `id` на заголовок `h2` или на сам `section`.',
        'Образец: `<nav aria-label="Разделы страницы"><ul><li><a href="#about">О проекте</a></li>…</ul></nav>`'
      ]
    },
    {
      id: 'main',
      label: 'Один `main` – прямой потомок `body`',
      test: c => c.qa('main').length === 1 && Boolean(c.q('body > main')),
      where: c => c.lineOf(/<main\b/i),
      hints: [
        'Основное содержание заключается в единственный `main`, который стоит прямо в `body`, не в `header` и не в `footer`.',
        'Откройте `<main>` сразу после `</header>` и закройте `</main>` перед `<footer>`.',
        'Структура: `<header>…</header>`, `<main>…</main>`, `<footer>…</footer>`.'
      ]
    },
    {
      id: 'sections',
      label: 'В `main` не меньше двух `section`, каждый начинается с `h2`',
      test: sectionsOk,
      where: c => {
        const bad = c.qa('body > main > section').find(s => s.firstElementChild?.tagName !== 'H2');
        return bad ? c.lineOf(/<section\b/i) : c.lineOf(/<main\b/i);
      },
      hints: [
        'Каждый раздел с заголовком `h2` оборачивается в `section` – прямой потомок `main`.',
        'Первым элементом внутри `section` должен быть `h2`. Всё содержимое раздела, до следующего `h2`, находится внутри того же `section`.',
        'Образец: `<section id="about">`, затем `<h2>О проекте</h2>`, абзацы раздела, затем `</section>`.'
      ]
    },
    {
      id: 'footer',
      label: '`footer` стоит после `main` и содержит почтовую ссылку',
      test: c => {
        const f = c.q('body > footer');
        const m = c.q('body > main');
        return Boolean(f && m && (m.compareDocumentPosition(f) & 4) && f.querySelector('a[href^="mailto:" i]'));
      },
      where: c => c.lineOf(/<footer\b/i) ?? c.lineOf(/mailto:/i),
      hints: [
        'Подвал страницы – `footer` прямо в `body`, после `main`. В нём контакты.',
        'Перенесите абзац со ссылкой `mailto:` из основного содержания в `footer`.',
        'Образец: `<footer><p><a href="mailto:info@example.org">info@example.org</a></p></footer>`'
      ]
    },
    {
      id: 'landmarks',
      label: 'Прямые потомки `body` – только `header`, `main` и `footer`, в этом порядке',
      test: c => {
        const tags = bodyChildren(c).map(e => e.tagName);
        return tags.join(',') === LANDMARKS.join(',');
      },
      where: c => {
        const extra = bodyChildren(c).find(e => !LANDMARKS.includes(e.tagName));
        return extra ? c.lineOf(new RegExp(`<${extra.tagName.toLowerCase()}\\b`, 'i')) : null;
      },
      hints: [
        'Между областями или вне их остался элемент. Всё содержимое страницы должно находиться внутри `header`, `main` или `footer`.',
        'Найдите элемент на уровне `body` вне трёх областей и перенесите его внутрь подходящей.',
        'Каркас `body`: `<header>…</header>`, `<main>…</main>`, `<footer>…</footer>` – и ничего между ними.'
      ]
    }
  ],

  /* Правильный вариант: содержимое студента раскладывается по областям */
  solution: c0 => {
    const c = baseFor(c0, prevStep, makeContext);
    const body = c.doc.body;
    const nodes = [...body.children];
    const h1 = body.querySelector('h1');
    const mail = [...body.querySelectorAll('p')].find(p => p.querySelector('a[href^="mailto:" i]'));
    const skip = new Set([h1, mail]);
    const next = h1?.nextElementSibling;
    if (next?.tagName === 'P' && next.querySelector('a[href^="#"]') && next.textContent.trim() === next.querySelector('a').textContent.trim()) skip.add(next);

    const intro = [];
    const sections = [];
    nodes.forEach(el => {
      if (skip.has(el) || ['HEADER', 'MAIN', 'FOOTER', 'NAV'].includes(el.tagName)) return;
      if (el.tagName === 'H2') sections.push({ h2: el, items: [] });
      else if (sections.length) sections[sections.length - 1].items.push(el);
      else intro.push(el);
    });
    sections.forEach((s, i) => { if (!s.h2.id) s.h2.id = `section-${i + 1}`; });

    const out = [
      '<header>',
      `  ${h1 ? h1.outerHTML : '<h1>Мой проект</h1>'}`,
      '  <nav aria-label="Разделы страницы">',
      '    <ul>',
      ...sections.map(s => `      <li><a href="#${s.h2.id}">${safe(s.h2.textContent)}</a></li>`),
      '    </ul>',
      '  </nav>',
      '</header>',
      '',
      '<main>'
    ];
    sections.forEach((s, i) => {
      out.push('  <section>');
      out.push(indent(s.h2.outerHTML, '    '));
      if (i === 0) intro.forEach(el => out.push(indent(el.outerHTML, '    ')));
      s.items.forEach(el => out.push(indent(el.outerHTML, '    ')));
      out.push('  </section>');
    });
    out.push('</main>', '', '<footer>', `  ${mail ? mail.outerHTML : '<p><a href="mailto:info@example.org">info@example.org</a></p>'}`, '</footer>');

    const head = c.raw.slice(0, c.raw.search(/<body[^>]*>/i));
    const html = `${head}<body>\n${out.map(l => (l ? '    ' + l : '')).join('\n')}\n  </body>\n</html>`;
    /* outerHTML записывает логические атрибуты как controls="" – возвращаем краткую форму */
    return html.replace(/\s(controls|default|sandbox|open|muted|loop|reversed|autoplay|required|disabled|checked|hidden)=""/g, ' $1');
  },

  quiz: [
    {
      q: 'Сколько элементов `main` допускается на странице?',
      options: [
        'Один',
        'Два',
        'По одному в каждом разделе',
        'Любое количество'
      ],
      correct: 0,
      explain: '`main` обозначает основное содержание страницы, и оно одно. Программы экранного доступа используют его как ориентир для перехода.'
    },
    {
      q: 'Какой элемент подходит для отзыва клиента, который можно опубликовать отдельно?',
      options: ['`article`', '`section`', '`aside`', '`div`'],
      correct: 0,
      explain: 'Фрагмент, понятный вне страницы, размечается `article`. `section` – часть общего изложения, `aside` – дополнительное содержание.'
    },
    {
      q: 'Что помещают в `nav`?',
      options: [
        'Блок основной навигации по сайту или странице',
        'Все ссылки страницы, включая ссылки внутри текста',
        'Только ссылки на внешние сайты и источники',
        'Контактные данные и ссылку для письма'
      ],
      correct: 0,
      explain: '`nav` выделяет основные навигационные блоки. Ссылки в тексте остаются в абзацах, контакты обычно размещают в `footer`.'
    },
    {
      q: 'Когда уместен `div`?',
      options: [
        'Когда ни один смысловой элемент не подходит',
        'Когда нужен раздел с заголовком второго уровня',
        'Когда нужно выделить основное содержание',
        'Когда нужно обозначить шапку страницы'
      ],
      correct: 0,
      explain: '`div` не несёт смысла и нужен для оформления и раскладки. Для разделов, основного содержания и шапки есть `section`, `main` и `header`.'
    },
    {
      q: 'Зачем программам экранного доступа `header`, `main`, `nav`, `footer`?',
      options: [
        'Для перехода между областями страницы',
        'Для чтения текста другим голосом',
        'Для увеличения шрифта в этих областях',
        'Для перевода текста на язык страницы'
      ],
      correct: 0,
      explain: 'Эти элементы становятся ориентирами: пользователь открывает их список и переходит, например, сразу к основному содержанию.'
    }
  ],

  passScore: 0.8
};
