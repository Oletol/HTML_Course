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

export function createPreview(iframe, delay = 450, { onFormSubmit } = {}) {
  iframe.setAttribute('sandbox', 'allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  let timer;
  const render = code => { iframe.srcdoc = buildSrcdoc(code); };

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
    schedule(code) { clearTimeout(timer); timer = setTimeout(() => render(code), delay); }
  };
}
