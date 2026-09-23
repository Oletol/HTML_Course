/* ==================================================================
   ui.js – мелкие помощники интерфейса.
   rich()  – безопасно превращает строку с `кодом` в узлы DOM
             (без innerHTML: текст задания и подсказок не исполняется).
   toast() – короткое уведомление внизу экрана.
   ================================================================== */

export function rich(text) {
  const frag = document.createDocumentFragment();
  String(text).split(/(`[^`]+`)/).forEach(part => {
    if (!part) return;
    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
      const code = document.createElement('code');
      code.textContent = part.slice(1, -1);
      frag.append(code);
    } else {
      frag.append(document.createTextNode(part));
    }
  });
  return frag;
}

export function paragraphs(list) {
  const frag = document.createDocumentFragment();
  [].concat(list || []).forEach(t => {
    const p = document.createElement('p');
    p.append(rich(t));
    frag.append(p);
  });
  return frag;
}

let toastTimer;
export function toast(message, ms = 3200) {
  const box = document.getElementById('toast');
  if (!box) return;
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; }, ms);
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  children.flat().forEach(c => { if (c != null && c !== false) el.append(c); });
  return el;
}
