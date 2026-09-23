/* ==================================================================
   sitecheck.js – автопроверка опубликованного сайта студента.

   Загружает главную страницу по адресу GitHub Pages и до пяти
   внутренних страниц, на которые она ссылается (GitHub Pages отдаёт
   страницы с заголовком Access-Control-Allow-Origin: *, поэтому
   загрузка из песочницы возможна). Каждую страницу разбирает тем же
   валидатором, что и шаги, и проверяет требования итоговой работы.

   Проверка – помощник студента, а не оценка: оценку ставит
   преподаватель по критериям задания.
   ================================================================== */

import { makeContext } from './validator.js';
import { parseStyle } from './colors.js';

const MAX_PAGES = 6;
const ALLOWED_STYLE = new Set(['color', 'background-color']);

async function fetchPage(url) {
  const r = await fetch(url, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

const levels = c => c.qa('body h1, body h2, body h3, body h4, body h5, body h6').map(h => Number(h.tagName[1]));

/* Требования к каждой странице */
const PAGE_CHECKS = [
  { id: 'skeleton', label: 'Скелет: `<!DOCTYPE html>`, `lang`, `charset` первым, `viewport`, `title`',
    test: c => /^\s*<!doctype\s+html\s*>/i.test(c.clean) && (c.doc.documentElement.getAttribute('lang') || '').trim() &&
      c.doc.head.firstElementChild?.matches('meta[charset]') && c.q('head > meta[name="viewport" i]') && c.text('head > title').length >= 3 },
  { id: 'description', label: 'Описание `meta name="description"` от 50 до 160 знаков',
    test: c => { const d = (c.q('head > meta[name="description" i]')?.getAttribute('content') || '').trim(); return d.length >= 50 && d.length <= 160; } },
  { id: 'landmarks', label: 'Области `header`, `main`, `footer` прямо в `body`, `main` один',
    test: c => Boolean(c.q('body > header') && c.q('body > footer')) && c.qa('main').length === 1 && Boolean(c.q('body > main')) },
  { id: 'nav', label: 'Навигация `nav` со списком ссылок',
    test: c => Boolean(c.q('body nav ul a[href], body nav ol a[href]')) },
  { id: 'headings', label: 'Один `h1`, уровни заголовков не пропускаются',
    test: c => { const lv = levels(c); return c.qa('body h1').length === 1 && lv[0] === 1 && lv.every((v, i) => i === 0 || v <= lv[i - 1] + 1); } },
  { id: 'images', label: 'У изображений есть `alt`, `width` и `height`',
    test: c => c.qa('body img').every(i => i.hasAttribute('alt') && /^\d+$/.test(i.getAttribute('width') || '') && /^\d+$/.test(i.getAttribute('height') || '')) },
  { id: 'onlyHtml', label: 'Только HTML: нет `style`, таблиц стилей и скриптов; `style` у элементов – только для цвета',
    test: c => !c.q('style, script, link[rel~="stylesheet" i]') &&
      c.qa('[style]').every(el => Object.keys(parseStyle(el.getAttribute('style'))).every(p => ALLOWED_STYLE.has(p))) },
  { id: 'labels', label: 'У полей формы есть связанные подписи',
    test: c => c.qa('input:not([type="hidden" i]):not([type="submit" i]):not([type="button" i]):not([type="reset" i]), select, textarea')
      .every(f => f.closest('label') || (f.id && c.qa('label[for]').some(l => l.getAttribute('for') === f.id))) },
  { id: 'skip', label: 'Первая ссылка ведёт к основному содержанию',
    test: c => { const a = c.q('body a[href]'); const m = c.q('body > main'); return Boolean(a && m?.id && a.getAttribute('href') === `#${m.id}`); } }
];

/* Требования ко всему сайту: элемент должен встретиться хотя бы на одной странице */
const SITE_COVERAGE = [
  { id: 'lists', label: 'Список `ul` или `ol`', sel: 'body ul li, body ol li' },
  { id: 'table', label: 'Таблица с `caption`', sel: 'body table caption' },
  { id: 'quote', label: 'Цитата `blockquote` или `q`', sel: 'body blockquote, body q' },
  { id: 'figure', label: 'Изображение с подписью `figure` и `figcaption`', sel: 'body figure img ~ figcaption, body figure figcaption ~ img' },
  { id: 'media', label: 'Видео, звук или встроенная страница', sel: 'body video, body audio, body iframe[title]' },
  { id: 'details', label: 'Раскрывающийся блок `details` с `summary`', sel: 'body details > summary' },
  { id: 'form', label: 'Форма со встроенной проверкой', sel: 'body form [required], body form [pattern]' },
  { id: 'lang', label: 'Фрагмент на другом языке с `lang`', sel: 'body [lang]' },
  { id: 'semantics', label: 'Сокращение `abbr` или дата `time`', sel: 'body abbr[title], body time[datetime]' },
  { id: 'external', label: 'Внешняя ссылка с `rel="noopener"`', sel: 'body a[href^="https://" i][rel~="noopener" i]' }
];

export async function checkSite(siteUrl) {
  const base = new URL(siteUrl.endsWith('/') || /\.html?$/i.test(siteUrl) ? siteUrl : siteUrl + '/');
  const dir = base.href.replace(/[^/]*$/, '');
  const pages = [];

  const home = { url: base.href };
  try { home.html = await fetchPage(base.href); } catch (err) { home.error = err.message; }
  pages.push(home);
  if (home.error) return { pages, items: [], fatal: `Главная страница не загрузилась (${home.error}). Проверьте адрес и то, что GitHub Pages включены.` };

  const homeCtx = makeContext(home.html);
  const internal = [...new Set(homeCtx.qa('a[href]')
    .map(a => a.getAttribute('href').trim())
    .filter(h => h && !h.startsWith('#') && !/^(mailto|tel|javascript|data):/i.test(h))
    .map(h => { try { return new URL(h, base).href.split('#')[0]; } catch { return null; } })
    .filter(u => u && u.startsWith(dir) && u !== base.href && u !== dir && !/\.(pdf|jpe?g|png|svg|webp|mp[34]|webm|vtt|zip)$/i.test(u)))]
    .slice(0, MAX_PAGES - 1);

  for (const url of internal) {
    const p = { url };
    try { p.html = await fetchPage(url); } catch (err) { p.error = err.message; }
    pages.push(p);
  }

  const ok = pages.filter(p => p.html);
  ok.forEach(p => { p.ctx = makeContext(p.html); });
  const short = url => decodeURIComponent(url.replace(dir, '')) || 'главная';

  const items = [];
  items.push({ id: 'pages', label: 'Не меньше двух страниц, связанных ссылками', ok: ok.length >= 2,
    detail: `Найдено страниц: ${ok.length}` });
  const broken = pages.filter(p => p.error);
  items.push({ id: 'broken', label: 'Все внутренние ссылки главной открываются', ok: broken.length === 0,
    detail: broken.length ? `Не открываются: ${broken.map(p => short(p.url)).join(', ')}` : '' });
  const backLinks = ok.slice(1).filter(p => !p.ctx.qa('a[href]').some(a => {
    try { const u = new URL(a.getAttribute('href'), p.url).href.split('#')[0]; return u === base.href || u === dir || u === dir + 'index.html'; } catch { return false; }
  }));
  items.push({ id: 'back', label: 'С каждой страницы есть ссылка на главную', ok: ok.length >= 2 && backLinks.length === 0,
    detail: backLinks.length ? `Нет ссылки на главную: ${backLinks.map(p => short(p.url)).join(', ')}` : '' });
  const titles = ok.map(p => p.ctx.text('head > title'));
  items.push({ id: 'titles', label: 'У страниц разные `title`', ok: new Set(titles).size === titles.length });

  for (const chk of PAGE_CHECKS) {
    const bad = ok.filter(p => { try { return !chk.test(p.ctx); } catch { return true; } });
    items.push({ id: chk.id, label: chk.label, ok: bad.length === 0,
      detail: bad.length ? `Не выполнено: ${bad.map(p => short(p.url)).join(', ')}` : '' });
  }
  for (const cov of SITE_COVERAGE) {
    items.push({ id: cov.id, label: cov.label, ok: ok.some(p => p.ctx.q(cov.sel)), detail: '' });
  }
  return { pages: pages.map(p => ({ url: p.url, error: p.error || null })), items };
}
