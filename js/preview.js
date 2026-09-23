/* ==================================================================
   preview.js – окно результата.

   Код студента показывается в <iframe sandbox> через srcdoc:
   – без allow-scripts: никакой JavaScript внутри не выполняется;
   – allow-same-origin нужен, чтобы из окна результата загружались
     файлы курса (субтитры, изображения, встраиваемые страницы);
     без скриптов этот режим безопасен: коду нечем обратиться
     к хранилищу или данным сайта;
   – политика безопасности (CSP) вставляется в <head>: запрещает
     скрипты и отправку форм, разрешает картинки, медиа, шрифты
     и фреймы с адреса курса и по https.
   Ссылки с target="_blank" открываются в новой вкладке (allow-popups).
   allow-forms нужен, чтобы браузер показывал встроенную проверку полей;
   сама отправка перехватывается песочницей и никуда не уходит
   (плюс form-action 'none' в CSP).
   Для модуля JavaScript понадобится другой режим: allow-scripts
   без allow-same-origin.
   ================================================================== */

const SELF = typeof location !== 'undefined' ? location.origin : '';

const CSP = [
  "default-src 'none'",
  `img-src ${SELF} https: data: blob:`,
  `media-src ${SELF} https: data: blob:`,
  "style-src 'unsafe-inline'",
  `font-src ${SELF} https: data:`,
  `frame-src ${SELF} https:`,
  "form-action 'none'",
  "base-uri 'none'"
].join('; ');

const META = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;

export function buildSrcdoc(code) {
  const head = code.match(/<head\b[^>]*>/i);
  if (head) {
    const i = head.index + head[0].length;
    return code.slice(0, i) + META + code.slice(i);
  }
  const doctype = code.match(/^\s*(?:<!--[\s\S]*?-->\s*)*<!doctype[^>]*>/i);
  if (doctype) {
    const i = doctype[0].length;
    return code.slice(0, i) + META + code.slice(i);
  }
  return META + code;
}

/* ---------- Подстановка style.css и настройки окна результата ----------
   Для шагов CSS окно результата подставляет содержимое вкладки style.css
   на место <link rel="stylesheet" href="style.css">. Нет ссылки – нет стилей:
   так студент видит, что таблицу стилей нужно подключить.

   Настройки (settings):
     theme  'auto' | 'light' | 'dark'   – имитация prefers-color-scheme
     motion 'auto' | 'reduce'           – имитация prefers-reduced-motion
     dir    'auto' | 'rtl'              – направление письма страницы
   Имитация работает переписыванием условий @media в копии стилей:
   системные настройки браузера при этом не меняются. */

const ALWAYS = 'min-width: 0px';
const NEVER = 'max-width: 0.01px';

export function transformMedia(css, s = {}) {
  let out = String(css ?? '');
  if (s.theme === 'dark' || s.theme === 'light') {
    const other = s.theme === 'dark' ? 'light' : 'dark';
    out = out.replace(new RegExp(`prefers-color-scheme\\s*:\\s*${s.theme}`, 'gi'), ALWAYS)
      .replace(new RegExp(`prefers-color-scheme\\s*:\\s*${other}`, 'gi'), NEVER);
  }
  if (s.motion === 'reduce') {
    out = out.replace(/prefers-reduced-motion\s*:\s*reduce/gi, ALWAYS)
      .replace(/prefers-reduced-motion\s*:\s*no-preference/gi, NEVER);
  }
  return out;
}

const LINK_RE = /<link\b[^>]*>/gi;
const isStyleLink = tag => /\brel\s*=\s*["']?[^"'>]*stylesheet/i.test(tag) &&
  /\bhref\s*=\s*["']?(?:\.\/)?style\.css["'\s>]/i.test(tag);

export function buildDocument(html, css, s = {}) {
  let doc = String(html ?? '');
  if (css != null) {
    const styled = transformMedia(css, s).replace(/<\/style/gi, '<\\/style');
    let used = false;
    doc = doc.replace(LINK_RE, tag => {
      if (used || !isStyleLink(tag)) return tag;
      used = true;
      return `<style data-file="style.css">\n${styled}\n</style>`;
    });
  }
  if (s.dir === 'rtl') {
    doc = doc.replace(/<html\b([^>]*)>/i, (m, attrs) => `<html${attrs.replace(/\sdir\s*=\s*["']?\w+["']?/i, '')} dir="rtl">`);
  }
  return buildSrcdoc(doc);
}

export function createPreview(iframe, delay = 450, { onFormSubmit } = {}) {
  iframe.setAttribute('sandbox', 'allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  let timer;
  let settings = {};
  let last = { html: '', css: null };
  const render = (html, css = null) => {
    last = { html, css };
    iframe.srcdoc = buildDocument(html, css, settings);
  };

  /* Ссылки внутри окна результата обрабатывает сама песочница:
     в srcdoc якорь «#id» иначе открыл бы в окне всю страницу курса,
     а обычная ссылка увела бы окно результата со страницы студента. */
  iframe.addEventListener('load', () => {
    let doc;
    try { doc = iframe.contentDocument; } catch { return; }
    if (!doc || doc.URL !== 'about:srcdoc') return;
    /* submit срабатывает только после успешной встроенной проверки полей */
    doc.addEventListener('submit', e => { e.preventDefault(); onFormSubmit?.(); });
    doc.addEventListener('click', e => {
      const a = e.target.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href').trim();
      e.preventDefault();
      if (href.startsWith('#')) {
        const id = decodeURIComponent(href.slice(1));
        const target = id ? doc.getElementById(id) : doc.documentElement;
        target?.scrollIntoView({ block: 'start' });
        return;
      }
      if (/^javascript:/i.test(href)) return;
      window.open(a.href, '_blank', 'noopener,noreferrer');
    });
  });
  return {
    render,
    schedule(html, css = null) { clearTimeout(timer); timer = setTimeout(() => render(html, css), delay); },
    setSettings(next) { settings = { ...settings, ...next }; render(last.html, last.css); },
    get settings() { return { ...settings }; }
  };
}
