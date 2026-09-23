/* ==================================================================
   editor.js – редактор кода на основе <textarea>.

   Что умеет:
   – номера строк;
   – Tab ставит два пробела, Shift+Tab убирает отступ (и для выделенных строк);
   – Enter сохраняет отступ строки, после открывающего тега добавляет два пробела;
   – Esc, затем Tab – выйти из редактора клавиатурой (Tab больше не ловушка);
   – подсветка строк: mark([{ line, tone }]), tone = 'err' | 'warn' | 'fix';
     подсветка снимается при первой правке;
   – goToLine(n) – поставить курсор в начало строки.

   Что запрещено (набор только вручную):
   – вставка (Cmd/Ctrl+V, меню, Shift+Insert, вставка с мобильной клавиатуры);
   – перетаскивание текста в поле;
   – контекстное меню.
   Каждая попытка передаётся в onBlocked(type) – для статистики.
   Крупная вставка одним событием (расширения-подстановщики текста)
   не блокируется, но передаётся в onSuspicious(length).
   ================================================================== */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'source', 'track', 'wbr']);
const BLOCKED_INPUT = new Set(['insertFromPaste', 'insertFromPasteAsQuotation',
  'insertFromDrop', 'insertFromYank', 'insertLink']);
const INDENT = '  ';

export function createEditor(textarea, gutter, marksLayer, { onChange, onBlocked, onSuspicious } = {}) {
  let escapeArmed = false;
  let internal = false; /* true, пока текст вставляет сам редактор (Tab, Enter) */
  let marks = [];       /* [{ line, tone }] */

  function metrics() {
    const cs = getComputedStyle(textarea);
    return { lh: parseFloat(cs.lineHeight) || 22, top: parseFloat(cs.paddingTop) || 0 };
  }

  function renderGutter() {
    const lines = textarea.value.split('\n').length;
    const tones = new Map(marks.map(m => [m.line, m.tone]));
    const frag = document.createDocumentFragment();
    for (let i = 1; i <= lines; i++) {
      const span = document.createElement('span');
      span.textContent = i;
      if (tones.has(i)) span.className = 'is-' + tones.get(i);
      frag.append(span, '\n');
    }
    gutter.replaceChildren(frag);
    gutter.scrollTop = textarea.scrollTop;
  }

  function renderMarks() {
    if (!marksLayer) return;
    const { lh, top } = metrics();
    marksLayer.replaceChildren(...marks.map(m => {
      const d = document.createElement('div');
      d.className = `editor__mark editor__mark--${m.tone}`;
      d.style.top = `${top + (m.line - 1) * lh - textarea.scrollTop}px`;
      d.style.height = `${lh}px`;
      return d;
    }));
  }

  function setMarks(list) {
    marks = (list || []).filter(m => m.line >= 1);
    renderGutter();
    renderMarks();
  }

  /* Вставка текста с сохранением истории Cmd+Z, где это возможно */
  function insert(text) {
    textarea.focus();
    internal = true;
    try {
      const ok = document.execCommand && document.execCommand('insertText', false, text);
      if (!ok) {
        const { selectionStart: s, selectionEnd: e } = textarea;
        textarea.setRangeText(text, s, e, 'end');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } finally {
      internal = false;
    }
  }

  function lineBounds(pos) {
    const v = textarea.value;
    const start = v.lastIndexOf('\n', pos - 1) + 1;
    let end = v.indexOf('\n', pos);
    if (end === -1) end = v.length;
    return { start, end };
  }

  function shiftLines(outdent) {
    const v = textarea.value;
    const selStart = textarea.selectionStart;
    const selEnd = textarea.selectionEnd;
    const first = lineBounds(selStart).start;
    const last = lineBounds(selEnd > selStart && v[selEnd - 1] === '\n' ? selEnd - 1 : selEnd).end;
    const block = v.slice(first, last);
    const lines = block.split('\n');
    let firstDelta = 0, total = 0;
    const changed = lines.map((line, i) => {
      if (outdent) {
        const cut = line.startsWith(INDENT) ? 2 : line.startsWith(' ') ? 1 : 0;
        if (i === 0) firstDelta = -cut;
        total -= cut;
        return line.slice(cut);
      }
      if (i === 0) firstDelta = INDENT.length;
      total += INDENT.length;
      return INDENT + line;
    }).join('\n');
    textarea.setSelectionRange(first, last);
    insert(changed);
    textarea.setSelectionRange(Math.max(first, selStart + firstDelta), selEnd + total);
  }

  function smartEnter() {
    const v = textarea.value;
    const pos = textarea.selectionStart;
    const { start } = lineBounds(pos);
    const before = v.slice(start, pos);
    const indent = before.match(/^[ \t]*/)[0];
    const opened = before.match(/<([a-zA-Z][\w-]*)(?:\s[^<>]*)?>\s*$/);
    const opensBlock = opened && !VOID_TAGS.has(opened[1].toLowerCase()) &&
      !new RegExp(`</${opened[1]}\\s*>`, 'i').test(before.slice(opened.index));
    const after = v.slice(pos, pos + 3);

    if (opensBlock && after.startsWith('</')) {
      insert('\n' + indent + INDENT + '\n' + indent);
      const caret = pos + 1 + indent.length + INDENT.length;
      textarea.setSelectionRange(caret, caret);
    } else if (opensBlock) {
      insert('\n' + indent + INDENT);
    } else {
      insert('\n' + indent);
    }
  }

  textarea.addEventListener('keydown', e => {
    if (e.key === 'Escape') { escapeArmed = true; return; }
    if (e.key === 'Tab') {
      if (escapeArmed) { escapeArmed = false; return; } /* обычный переход фокуса */
      e.preventDefault();
      const multiLine = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).includes('\n');
      if (e.shiftKey || multiLine) shiftLines(e.shiftKey);
      else insert(INDENT);
      return;
    }
    escapeArmed = false;
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey && !e.isComposing) {
      e.preventDefault();
      smartEnter();
    }
  });

  /* ---------- Запреты ---------- */
  const block = type => e => { e.preventDefault(); onBlocked?.(type); };
  textarea.addEventListener('paste', block('paste'));
  textarea.addEventListener('drop', block('drop'));
  textarea.addEventListener('contextmenu', block('contextmenu'));
  textarea.addEventListener('dragover', e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'; });
  textarea.addEventListener('beforeinput', e => {
    if (BLOCKED_INPUT.has(e.inputType)) { e.preventDefault(); onBlocked?.(e.inputType); }
  });

  textarea.addEventListener('input', e => {
    if (!internal && (e.inputType === 'insertText' || e.inputType === 'insertReplacementText')) {
      if (e.data && e.data.length > 30) onSuspicious?.(e.data.length);
    }
    if (marks.length) marks = [];
    renderGutter();
    renderMarks();
    onChange?.(textarea.value);
  });
  textarea.addEventListener('scroll', () => { gutter.scrollTop = textarea.scrollTop; renderMarks(); });
  window.addEventListener('resize', renderMarks);

  return {
    get value() { return textarea.value; },
    set value(v) { textarea.value = v ?? ''; marks = []; textarea.scrollTop = 0; renderGutter(); renderMarks(); },
    focus() { textarea.focus(); },
    mark: setMarks,
    clearMarks() { setMarks([]); },
    goToLine(n) {
      const lines = textarea.value.split('\n');
      const line = Math.max(1, Math.min(n, lines.length));
      const pos = lines.slice(0, line - 1).reduce((s, l) => s + l.length + 1, 0);
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
      const { lh } = metrics();
      textarea.scrollTop = Math.max(0, (line - 3) * lh);
      renderMarks();
    }
  };
}
