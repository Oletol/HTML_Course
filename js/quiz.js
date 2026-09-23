/* ==================================================================
   quiz.js – закрепляющий тест в модальном окне (<dialog>).

   openQuiz(dialog, { stepTitle, questions, passScore, onAttempt })
     questions: [{ q, options: [...], correct: индекс, explain }]
     passScore: доля верных ответов для прохождения (0..1)
     onAttempt({ score, correct, total, answers, passed }) – после каждой попытки
   Возвращает Promise<{ passed, next }>, когда окно закрыто.
     next = true, если студент нажал «Следующий шаг».

   Варианты ответов перемешиваются при каждой попытке.
   В answers сохраняются индексы из ИСХОДНОГО порядка вариантов.
   ================================================================== */

import { rich, h } from './ui.js';

function shuffled(n) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function openQuiz(dialog, { stepTitle, questions, passScore = 0.8, onAttempt, hasNext = true }) {
  return new Promise(resolve => {
    let passed = false;
    let next = false;

    const body = h('div', { class: 'dialog__body' });
    const result = h('p', { class: 'dialog__result', role: 'status', 'aria-live': 'polite' });
    const btnSubmit = h('button', { class: 'btn btn--primary', type: 'button' }, 'Проверить ответы');
    const btnRetry = h('button', { class: 'btn', type: 'button', hidden: true }, 'Пройти ещё раз');
    const btnNext = h('button', { class: 'btn btn--primary', type: 'button', hidden: true },
      hasNext ? 'Следующий шаг' : 'Готово');
    const btnClose = h('button', { class: 'btn btn--quiet', type: 'button' }, 'Закрыть');
    const foot = h('div', { class: 'dialog__foot' }, result, btnSubmit, btnRetry, btnNext, btnClose);

    let orders = [];

    function build() {
      orders = questions.map(q => shuffled(q.options.length));
      body.replaceChildren(
        h('p', { class: 'dialog__eyebrow' }, 'Закрепление'),
        h('h2', { class: 'dialog__title', id: 'quizTitle' }, stepTitle),
        h('p', {}, `Ответьте на ${questions.length} вопросов. Чтобы пройти шаг, нужно не меньше ${Math.ceil(passScore * questions.length)} верных ответов.`)
      );
      questions.forEach((q, qi) => {
        const fs = h('fieldset', { class: 'quiz__q' },
          h('legend', { class: 'quiz__legend' }, `${qi + 1}. `, rich(q.q)));
        orders[qi].forEach(oi => {
          const id = `q${qi}o${oi}`;
          fs.append(h('label', { class: 'quiz__opt', for: id, dataset: { opt: oi } },
            h('input', { type: 'radio', name: `q${qi}`, id, value: oi }),
            h('span', {}, rich(q.options[oi]))));
        });
        body.append(fs);
      });
      result.textContent = '';
      result.removeAttribute('data-tone');
      btnSubmit.hidden = false;
      btnRetry.hidden = true;
      btnNext.hidden = true;
      body.scrollTop = 0;
    }

    function submit() {
      const answers = questions.map((_, qi) => {
        const checked = body.querySelector(`input[name="q${qi}"]:checked`);
        return checked ? Number(checked.value) : null;
      });
      const missing = answers.findIndex(a => a === null);
      if (missing !== -1) {
        result.dataset.tone = 'fail';
        result.textContent = `Ответьте на вопрос ${missing + 1}.`;
        body.querySelectorAll('.quiz__q')[missing]?.querySelector('input')?.focus();
        return;
      }

      let correct = 0;
      questions.forEach((q, qi) => {
        const fs = body.querySelectorAll('.quiz__q')[qi];
        const right = answers[qi] === q.correct;
        if (right) correct++;
        fs.querySelectorAll('.quiz__opt').forEach(opt => {
          const oi = Number(opt.dataset.opt);
          if (oi === q.correct) opt.dataset.mark = 'right';
          else if (oi === answers[qi]) opt.dataset.mark = 'wrong';
          opt.querySelector('input').disabled = true;
        });
        if (q.explain) {
          fs.append(h('p', { class: 'quiz__explain' },
            h('strong', {}, right ? 'Верно. ' : 'Неверно. '), rich(q.explain)));
        }
      });

      const total = questions.length;
      const score = correct / total;
      passed = passed || score >= passScore;
      const thisPassed = score >= passScore;
      onAttempt?.({ score, correct, total, answers, passed: thisPassed });

      result.dataset.tone = thisPassed ? 'ok' : 'fail';
      result.textContent = thisPassed
        ? `Верно ${correct} из ${total}. Шаг пройден.`
        : `Верно ${correct} из ${total}. Прочитайте пояснения и попробуйте ещё раз.`;
      btnSubmit.hidden = true;
      btnRetry.hidden = thisPassed;
      btnNext.hidden = !thisPassed;
      (thisPassed ? btnNext : btnRetry).focus();
    }

    btnSubmit.addEventListener('click', submit);
    btnRetry.addEventListener('click', build);
    btnNext.addEventListener('click', () => { next = hasNext; dialog.close(); });
    btnClose.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => resolve({ passed, next }), { once: true });

    dialog.replaceChildren(body, foot);
    dialog.setAttribute('aria-labelledby', 'quizTitle');
    build();
    dialog.showModal();
    body.querySelector('input')?.focus();
  });
}
