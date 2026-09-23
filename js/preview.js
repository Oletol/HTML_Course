/* ==================================================================
   preview.js – окно результата.

   Код студента показывается в <iframe sandbox> через srcdoc:
   – без allow-scripts: никакой JavaScript внутри не выполнится;
   – без allow-same-origin: у документа нет доступа к сайту, хранилищу
     и данным Firebase;
   – плюс политика безопасности (CSP), которая вставляется в <head>:
     запрещает скрипты, отправку форм и подключение чего-либо, кроме
     картинок, медиа, шрифтов и фреймов по https.
   Ссылки с target="_blank" открываются в новой вкладке (allow-popups).
   ================================================================== */

const CSP = [
  "default-src 'none'",
  "img-src https: data: blob:",
  "media-src https: data: blob:",
  "style-src 'unsafe-inline'",
  "font-src https: data:",
  "frame-src https:",
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

export function createPreview(iframe, delay = 450) {
  iframe.setAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  let timer;
  const render = code => { iframe.srcdoc = buildSrcdoc(code); };
  return {
    render,
    schedule(code) { clearTimeout(timer); timer = setTimeout(() => render(code), delay); }
  };
}
