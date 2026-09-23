/* ==================================================================
   hints.js – подсказки по нарастающей (scaffolding).

   Число неудачных проверок на шаге     уровень подсказки
   3                                    1 – что именно не так
   5                                    2 – где искать и как устроено
   7                                    3 – образец нужной конструкции
   Подсказка всегда относится к первому невыполненному требованию.
   Образец можно показывать: вставить его в редактор всё равно нельзя.
   ================================================================== */

import { rich, h } from './ui.js';

export const THRESHOLDS = [3, 5, 7];

export function hintLevel(failedAttempts = 0) {
  return THRESHOLDS.filter(t => failedAttempts >= t).length;
}

export function attemptsToNextHint(failedAttempts = 0) {
  const next = THRESHOLDS.find(t => failedAttempts < t);
  return next ? next - failedAttempts : 0;
}

export function renderHint(box, check, level) {
  box.replaceChildren();
  if (!check || level < 1) { box.hidden = true; return 0; }
  const shown = Math.min(level, check.hints?.length || 0);
  if (!shown) { box.hidden = true; return 0; }
  box.append(
    h('strong', { class: 'hint__title' }, `Подсказка ${shown} из ${check.hints.length}`),
    h('p', {}, rich(check.label))
  );
  check.hints.slice(0, shown).forEach(t => box.append(h('p', {}, rich(t))));
  box.hidden = false;
  return shown;
}
