/* ==================================================================
   splitter.js – перетаскиваемая граница между редактором и результатом.

   Мышь, касание и клавиатура: стрелки вверх и вниз – шаг 24 px,
   Page Up и Page Down – 96 px, Home и End – крайние положения,
   двойной щелчок или Enter – исходное соотношение.
   Размер хранится в localStorage и восстанавливается при следующем входе.
   На узких экранах (до 960 px) панели идут друг под другом, граница скрыта.
   ================================================================== */

const KEY = 'html-sandbox:editor-size';
const MIN_EDITOR = 180;
const MIN_PREVIEW = 80;

const practice = document.querySelector('.practice');
const splitter = document.getElementById('splitter');
const editorPane = practice?.querySelector('.pane');

if (practice && splitter && editorPane) {
  const limits = () => {
    const total = practice.getBoundingClientRect().height;
    const task = practice.querySelector('.task')?.getBoundingClientRect().height || 0;
    const room = total - task - splitter.getBoundingClientRect().height;
    return { min: MIN_EDITOR, max: Math.max(MIN_EDITOR, room - MIN_PREVIEW) };
  };

  const apply = px => {
    if (px == null) {
      practice.style.removeProperty('--editor-size');
      splitter.removeAttribute('aria-valuenow');
      return;
    }
    const { min, max } = limits();
    const v = Math.round(Math.min(max, Math.max(min, px)));
    practice.style.setProperty('--editor-size', `${v}px`);
    splitter.setAttribute('aria-valuemin', String(min));
    splitter.setAttribute('aria-valuemax', String(Math.round(max)));
    splitter.setAttribute('aria-valuenow', String(v));
    return v;
  };

  const save = v => { try { v == null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, String(v)); } catch { /* ничего */ } };
  const current = () => editorPane.getBoundingClientRect().height;

  try {
    const saved = Number(localStorage.getItem(KEY));
    if (saved > 0) apply(saved);
  } catch { /* ничего */ }

  /* Перетаскивание */
  splitter.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    splitter.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = current();
    document.body.classList.add('is-resizing');
    let last = startH;
    const move = ev => { last = apply(startH + ev.clientY - startY) ?? last; };
    const up = () => {
      document.body.classList.remove('is-resizing');
      splitter.removeEventListener('pointermove', move);
      splitter.removeEventListener('pointerup', up);
      splitter.removeEventListener('pointercancel', up);
      save(last);
    };
    splitter.addEventListener('pointermove', move);
    splitter.addEventListener('pointerup', up);
    splitter.addEventListener('pointercancel', up);
  });

  /* Исходный размер */
  const reset = () => { apply(null); save(null); };
  splitter.addEventListener('dblclick', reset);

  /* Клавиатура */
  splitter.addEventListener('keydown', e => {
    const { min, max } = limits();
    const steps = { ArrowUp: -24, ArrowDown: 24, PageUp: -96, PageDown: 96 };
    let v = null;
    if (e.key in steps) v = current() + steps[e.key];
    else if (e.key === 'Home') v = min;
    else if (e.key === 'End') v = max;
    else if (e.key === 'Enter') { e.preventDefault(); reset(); return; }
    else return;
    e.preventDefault();
    save(apply(v));
  });

  /* При изменении окна размер остаётся в допустимых пределах */
  window.addEventListener('resize', () => {
    const now = Number(splitter.getAttribute('aria-valuenow'));
    if (now) apply(now);
  });
}
