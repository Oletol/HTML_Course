/* ==================================================================
   validator.js – проверка кода студента.

   Код разбирается через DOMParser: документ строится, но скрипты не
   выполняются и ресурсы не загружаются. Поэтому проверка безопасна.

   Каждое требование шага – объект { id, label, test(ctx), hints[] }.
   test получает ctx:
     ctx.doc          – разобранный документ (браузер уже «достроил»
                        пропущенные html/head/body!)
     ctx.raw          – исходный текст
     ctx.clean        – текст без HTML-комментариев
     ctx.q(sel)       – первый элемент или null
     ctx.qa(sel)      – массив элементов
     ctx.text(sel)    – текст элемента без крайних пробелов
     ctx.wrote(tag)   – открывающий тег написан вручную
     ctx.closed(tag)  – закрывающий тег написан вручную
     ctx.pos(re)      – позиция первого совпадения в clean или -1
   ================================================================== */

export function stripComments(code) {
  return code.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
}

export function makeContext(code) {
  const raw = String(code ?? '');
  const clean = stripComments(raw);
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  return {
    doc, raw, clean,
    q: sel => doc.querySelector(sel),
    qa: sel => Array.from(doc.querySelectorAll(sel)),
    text: sel => (doc.querySelector(sel)?.textContent || '').trim(),
    wrote: tag => new RegExp(`<${tag}(?=[\\s>/])`, 'i').test(clean),
    closed: tag => new RegExp(`</${tag}\\s*>`, 'i').test(clean),
    pos: re => { const m = clean.match(re); return m ? m.index : -1; }
  };
}

export function runChecks(code, checks) {
  const ctx = makeContext(code);
  return checks.map(c => {
    let ok = false;
    try { ok = Boolean(c.test(ctx)); } catch { ok = false; }
    return { id: c.id, ok };
  });
}
