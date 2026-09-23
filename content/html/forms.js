/* ==================================================================
   content/html/forms.js – общие проверки и образцы для раздела «Формы».
   ================================================================== */

export const FIELD_SEL = 'input:not([type="hidden" i]):not([type="submit" i]):not([type="reset" i]):not([type="button" i]):not([type="image" i]), select, textarea';

export const formOf = c => c.q('body > main section form');
export const fieldsOf = form => (form ? [...form.querySelectorAll(FIELD_SEL)] : []);

/* Подпись поля: вложение в label или label[for=id] */
export function labelText(c, field) {
  const own = field.closest('label');
  if (own) {
    const clone = own.cloneNode(true);
    clone.querySelectorAll('input, select, textarea, datalist').forEach(n => n.remove());
    return clone.textContent.trim();
  }
  const id = field.getAttribute('id');
  if (!id) return '';
  const lab = c.qa('label[for]').find(l => l.getAttribute('for') === id);
  return lab ? lab.textContent.trim() : '';
}

export const labelsOk = c => {
  const f = fieldsOf(formOf(c));
  return f.length > 0 && f.every(x => labelText(c, x).length >= 2);
};

export const namesOk = c => fieldsOf(formOf(c)).every(x => (x.getAttribute('name') || '').trim());

export function lineOfField(c, field) {
  const key = field.getAttribute('id') || field.getAttribute('name');
  if (!key) return c.lineOf(/<form\b/i);
  const m = c.clean.match(new RegExp(`<(input|select|textarea)\\b[^>]*(id|name)\\s*=\\s*["']?${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));
  return m ? c.clean.slice(0, m.index).split('\n').length : c.lineOf(/<form\b/i);
}

export const labelsCheck = (id = 'labels') => ({
  id,
  label: 'У каждого поля есть подпись `label`, связанная с ним',
  test: labelsOk,
  where: c => {
    const bad = fieldsOf(formOf(c)).find(x => labelText(c, x).length < 2);
    return bad ? lineOfField(c, bad) : null;
  },
  hints: [
    'У одного из полей нет подписи или она не связана с полем. Щелчок по подписи должен ставить курсор в поле.',
    'Свяжите подпись и поле: атрибут `for` у `label` равен `id` у поля. Или поместите поле внутрь `label`.',
    'Образец: `<label for="email">Электронная почта</label>` и `<input type="email" id="email" name="email">`.'
  ]
});

/* Заменить форму студента образцом, сохранив отступ */
export function replaceForm(c, lines) {
  const raw = c.raw;
  const start = raw.search(/<form\b/i);
  const endTag = raw.slice(Math.max(start, 0)).search(/<\/form\s*>/i);
  if (start === -1 || endTag === -1) return null;
  const end = start + endTag + raw.slice(start + endTag).match(/<\/form\s*>/i)[0].length;
  const lineStart = raw.lastIndexOf('\n', start) + 1;
  const pad = raw.slice(lineStart, start).match(/^\s*/)[0];
  const block = lines.map((l, i) => (i === 0 ? l : (l ? pad + l : ''))).join('\n');
  return raw.slice(0, start) + block + raw.slice(end);
}

/* Вставить раздел перед </main> */
export function insertBeforeMainEnd(c, lines) {
  const raw = c.raw;
  const end = raw.search(/<\/main\s*>/i);
  if (end === -1) return raw;
  const lineStart = raw.lastIndexOf('\n', end) + 1;
  const pad = raw.slice(lineStart, end).match(/^\s*/)[0] + '  ';
  return raw.slice(0, lineStart) + lines.map(l => (l ? pad + l : '')).join('\n') + '\n' + raw.slice(lineStart);
}
