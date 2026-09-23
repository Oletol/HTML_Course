/* ==================================================================
   protect.js – запрет выделения и копирования учебных текстов.

   protect(el)          – на блоке: нельзя выделить, скопировать,
                          вырезать, перетащить, вызвать контекстное меню.
                          Выделение отключает ещё и CSS-класс .protected.
   guardDocument(allow) – копирование на всей странице запрещено,
                          кроме элементов из allow (редактор, поля ввода).
   Попытки передаются в onAttempt(type) для статистики.

   Это сдерживание, а не защита: в инструментах разработчика обходится.
   ================================================================== */

export function protect(el, onAttempt) {
  el.classList.add('protected');
  const stop = (type, report) => e => { e.preventDefault(); if (report) onAttempt?.(type); };
  el.addEventListener('copy', stop('copy', true));
  el.addEventListener('cut', stop('cut', true));
  el.addEventListener('contextmenu', stop('contextmenu', true));
  el.addEventListener('dragstart', stop('dragstart', false));
  el.addEventListener('selectstart', stop('selectstart', false));
}

export function guardDocument(allowed, onAttempt) {
  const isAllowed = node => allowed.some(a => a && (a === node || a.contains(node)));
  const isField = node => node && /^(INPUT|TEXTAREA)$/.test(node.tagName);

  document.addEventListener('copy', e => {
    if (isAllowed(e.target) || isField(e.target)) return;
    e.preventDefault();
    onAttempt?.('copy');
  });
  document.addEventListener('cut', e => {
    if (isAllowed(e.target) || isField(e.target)) return;
    e.preventDefault();
  });
  /* Cmd/Ctrl+A вне полей не выделяет всю страницу */
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
      const t = document.activeElement;
      if (!isAllowed(t) && !isField(t)) e.preventDefault();
    }
  });
}
