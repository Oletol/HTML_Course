/* ==================================================================
   app.js – рабочий экран песочницы.

   Порядок работы шага:
   1. теория и задание;
   2. студент набирает код, превью обновляется само;
   3. «Проверить» – требования отмечаются выполненными или нет,
      строки с ошибками подсвечиваются, опечатки называются сразу;
      после 3 и 5 неудачных проверок открываются подсказки,
      после 7-й в редактор вставляется правильный код (см. SOLUTION_*);
   4. все требования выполнены – открывается тест;
   5. тест пройден – шаг завершён, открывается следующий.

   Статистика пишется через store.js (сейчас локально, на шаге 4 – Firestore).
   ================================================================== */

import { store } from './store.js';
import { flatSteps } from '../content/index.js';
import { createEditor } from './editor.js';
import { createPreview } from './preview.js';
import { protect, guardDocument } from './protect.js';
import { analyze, makeContext, changedLines } from './validator.js';
import { hintLevel, attemptsToNextHint, renderHint } from './hints.js';
import { openQuiz } from './quiz.js';
import { createTracker } from './tracker.js';
import { rich, paragraphs, toast, h } from './ui.js';
import { FALLBACK_START } from '../content/html/shared.js';

const MAX_CODE = 20000;

/* Правильный код после N неудачных проверок.
   'auto'   – вставляется сам (свой вариант студент может вернуть кнопкой);
   'button' – появляется кнопка «Показать правильный код». */
const SOLUTION_AFTER = 7;
const SOLUTION_MODE = 'auto';
const STATUS_RANK = { in_progress: 1, practice_done: 2, completed: 3 };

/* ---------- Профиль ---------- */
const profile = store.getProfile();
if (!profile) {
  location.replace('index.html');
  throw new Error('Нет профиля студента');
}

/* ---------- Элементы ---------- */
const $ = id => document.getElementById(id);
const els = {
  theory: $('theory'), task: $('task'), taskText: $('taskText'), reqList: $('reqList'),
  code: $('code'), gutter: $('gutter'), preview: $('preview'),
  btnCheck: $('btnCheck'), btnQuiz: $('btnQuiz'), btnNext: $('btnNext'), btnReset: $('btnReset'),
  status: $('status'), hintBox: $('hintBox'), marks: $('marks'),
  diags: $('diags'), diagsTitle: $('diagsTitle'), diagsList: $('diagsList'),
  btnSolution: $('btnSolution'), btnRestore: $('btnRestore'),
  stepNum: $('stepNum'), stepTitle: $('stepTitle'),
  progressText: $('progressText'), progressBar: $('progressBar'),
  userName: $('userName'),
  btnProgram: $('btnProgram'), btnProgramClose: $('btnProgramClose'),
  program: $('program'), programList: $('programList'), scrim: $('scrim'),
  quiz: $('quiz')
};

/* ---------- Состояние ---------- */
const steps = flatSteps();
let progress = await store.loadProgress();
let current = null; /* { index, meta, def, ownCode, solutionShown } */

const isDone = id => progress[id]?.status === 'completed';
const accessible = i => steps[i]?.ready && steps.slice(0, i).every(s => isDone(s.id));

/* ---------- Сервисы ---------- */
const tracker = createTracker({
  onFlush: (stepId, seconds) => {
    store.updateStep(stepId, { inc: { activeSec: seconds } }).then(p => { progress[stepId] = p; });
  }
});

const preview = createPreview(els.preview, 450, {
  onFormSubmit: () => toast('Форма прошла встроенную проверку браузера. В песочнице отправка отключена, данные никуда не ушли.')
});

let draftTimer;
const editor = createEditor(els.code, els.gutter, els.marks, {
  onChange: code => {
    preview.schedule(code);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => current && store.saveDraft(current.meta.id, code), 400);
  },
  onBlocked: type => {
    toast('Вставка отключена: наберите код вручную.');
    if (current) {
      store.updateStep(current.meta.id, { inc: { pasteBlocked: 1 } }).then(p => { progress[current.meta.id] = p; });
      store.logEvent('paste_blocked', current.meta.id, { type });
    }
  },
  onSuspicious: length => {
    if (current) store.logEvent('bulk_insert', current.meta.id, { length });
  }
});

/* Копирование учебных текстов */
const onCopyAttempt = type => {
  toast('Материалы нельзя копировать. Попробуйте пересказать своими словами – так запоминается лучше.');
  if (current) {
    store.updateStep(current.meta.id, { inc: { copyBlocked: 1 } }).then(p => { progress[current.meta.id] = p; });
    store.logEvent('copy_blocked', current.meta.id, { type });
  }
};
[els.theory, els.task, els.hintBox, els.quiz].forEach(el => protect(el, onCopyAttempt));
guardDocument([els.code], onCopyAttempt);

/* ==================================================================
   Программа и прогресс
   ================================================================== */
function renderProgress() {
  const moduleSteps = steps.filter(s => s.moduleId === (current?.meta.moduleId || 'html'));
  const done = moduleSteps.filter(s => isDone(s.id)).length;
  els.progressText.textContent = `Пройдено ${done} из ${moduleSteps.length}`;
  els.progressBar.style.width = `${Math.round(done / moduleSteps.length * 100)}%`;
}

function renderProgram() {
  const root = els.programList;
  root.replaceChildren();
  let lastModule = null, lastSection = null, list = null;

  steps.forEach((s, i) => {
    if (s.moduleId !== lastModule) {
      root.append(h('p', { class: 'drawer__module' }, `Модуль ${s.moduleTitle}`));
      lastModule = s.moduleId; lastSection = null;
    }
    if (s.sectionTitle !== lastSection) {
      root.append(h('p', { class: 'drawer__section' }, s.sectionTitle));
      list = h('ol', { class: 'steps' });
      root.append(list);
      lastSection = s.sectionTitle;
    }
    const state = !s.ready ? 'soon' : isDone(s.id) ? 'done' : accessible(i) ? 'open' : 'locked';
    const stateText = { soon: 'скоро', done: '✓ пройден', open: '', locked: 'закрыт' }[state];
    const isCurrent = current?.index === i;
    const inner = [
      h('span', { class: 'steps__n' }, String(s.n)),
      h('span', { class: 'steps__title' }, s.title),
      h('span', { class: 'steps__state' }, stateText)
    ];
    const link = (state === 'open' || state === 'done')
      ? h('a', { class: 'steps__link', href: `?step=${s.id}`, dataset: { state },
          'aria-current': isCurrent ? 'step' : false,
          onclick: e => { e.preventDefault(); closeProgram(); goTo(i); } }, inner)
      : h('span', { class: 'steps__link', dataset: { state } }, inner);
    list.append(h('li', {}, link));
  });
}

function openProgram() {
  renderProgram();
  els.program.hidden = false;
  els.scrim.hidden = false;
  els.btnProgram.setAttribute('aria-expanded', 'true');
  (els.programList.querySelector('[aria-current="step"]') || els.btnProgramClose).focus();
}
function closeProgram() {
  els.program.hidden = true;
  els.scrim.hidden = true;
  els.btnProgram.setAttribute('aria-expanded', 'false');
  els.btnProgram.focus();
}
els.btnProgram.addEventListener('click', openProgram);
els.btnProgramClose.addEventListener('click', closeProgram);
els.scrim.addEventListener('click', closeProgram);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !els.program.hidden) closeProgram();
});

/* ==================================================================
   Шаг
   ================================================================== */
function pickInitialIndex() {
  const wanted = new URLSearchParams(location.search).get('step');
  let i = steps.findIndex(s => s.id === wanted);
  if (i >= 0 && accessible(i)) return i;
  i = steps.findIndex((s, k) => accessible(k) && !isDone(s.id));
  if (i >= 0) return i;
  for (let k = steps.length - 1; k >= 0; k--) if (accessible(k)) return k;
  return 0;
}

function setStatus(text, tone) {
  els.status.replaceChildren(rich(text || ''));
  if (tone) els.status.dataset.tone = tone; else delete els.status.dataset.tone;
}

/* Список «Строка N: что не так». Клик ставит курсор на строку. */
function renderDiagnostics(items, title) {
  if (!items.length) { els.diags.hidden = true; els.diagsList.replaceChildren(); return; }
  els.diagsTitle.textContent = title;
  els.diagsList.replaceChildren(...items.map(d => h('li', {},
    h('button', {
      class: 'diags__btn', type: 'button', dataset: { tone: d.tone },
      onclick: () => d.line && editor.goToLine(d.line)
    },
      h('span', { class: 'diags__line' }, d.line ? `Строка ${d.line}` : 'Весь код'),
      h('span', {}, rich(d.message))))));
  els.diags.hidden = false;
}

function clearFeedback() {
  editor.clearMarks();
  renderDiagnostics([]);
  els.hintBox.hidden = true;
  els.btnSolution.hidden = true;
  els.btnRestore.hidden = true;
}

function solutionFor(code) {
  const sol = current.def.solution;
  if (!sol) return null;
  return typeof sol === 'function' ? sol(makeContext(code)) : sol;
}

function renderRequirements(results) {
  const byId = Object.fromEntries((results || []).map(r => [r.id, r.ok]));
  els.reqList.replaceChildren(...current.def.checks.map(c => {
    const state = c.id in byId ? (byId[c.id] ? 'ok' : 'fail') : 'todo';
    const mark = { ok: '✓', fail: '✕', todo: '' }[state];
    const sr = { ok: 'выполнено: ', fail: 'не выполнено: ', todo: '' }[state];
    return h('li', { class: 'reqs__item', dataset: { state } },
      h('span', { class: 'reqs__mark', 'aria-hidden': 'true' }, mark),
      h('span', { class: 'reqs__text' }, h('span', { class: 'visually-hidden' }, sr), rich(c.label)));
  }));
}

/* Код, с которым шаг открывается впервые или после «Начать заново».
   starter: 'previous' – код, сданный на предыдущем шаге. */
function startCode(index, def) {
  if (def.starter !== 'previous') return def.starter ?? '';
  const prev = steps[index - 1];
  return (prev && progress[prev.id]?.finalCode) || def.fallbackStarter || FALLBACK_START;
}

function nextIndex() {
  const i = current.index + 1;
  return i < steps.length ? i : -1;
}

function renderButtons() {
  const p = progress[current.meta.id] || {};
  const rank = STATUS_RANK[p.status] || 0;
  els.btnQuiz.hidden = rank < 2;
  els.btnQuiz.textContent = rank >= 3 ? 'Пройти тест ещё раз' : 'Пройти тест';
  const n = nextIndex();
  els.btnNext.hidden = !(rank >= 3 && n >= 0);
  els.btnNext.disabled = !(n >= 0 && steps[n].ready);
  els.btnNext.textContent = n >= 0 && steps[n].ready ? 'Следующий шаг' : 'Следующий шаг скоро';
}

async function goTo(index) {
  if (!accessible(index)) return;
  tracker.flush();

  const meta = steps[index];
  const mod = await import(new URL(`../content/${meta.file}`, import.meta.url));
  current = { index, meta, def: mod.default, ownCode: null, solutionShown: false };
  const { def } = current;

  history.replaceState(null, '', `?step=${meta.id}`);
  document.title = `${meta.title} – HTML Course`;
  els.stepNum.textContent = `${meta.moduleTitle}, шаг ${meta.n} из ${meta.total}`;
  els.stepTitle.textContent = meta.title;
  els.userName.textContent = profile.displayName;

  els.theory.innerHTML = def.theory; /* доверенный текст из content/ */
  els.theory.scrollTop = 0;
  els.taskText.replaceChildren(paragraphs(def.task));
  els.task.open = true;

  const done = isDone(meta.id);
  renderRequirements(done ? def.checks.map(c => ({ id: c.id, ok: true })) : null);

  const draft = store.getDraft(meta.id);
  editor.value = draft ?? progress[meta.id]?.finalCode ?? startCode(index, def);
  preview.render(editor.value);

  clearFeedback();
  setStatus(done ? 'Шаг пройден.' : '', done ? 'ok' : null);

  if (!progress[meta.id]) {
    progress[meta.id] = await store.updateStep(meta.id, {
      set: { status: 'in_progress', moduleId: meta.moduleId, startedAt: new Date().toISOString() }
    });
    store.logEvent('step_open', meta.id);
  }

  tracker.start(meta.id);
  renderButtons();
  renderProgress();
}

/* ---------- Проверка ---------- */
async function check() {
  const { meta, def } = current;
  const code = editor.value;
  const { results, diagnostics } = analyze(code, def.checks);
  const failedResults = results.filter(r => !r.ok);
  const failed = failedResults.map(r => r.id);
  const passed = failed.length === 0;
  renderRequirements(results);

  const patch = {
    inc: { checkAttempts: 1, failedAttempts: passed ? 0 : 1 },
    set: { lastCheckAt: new Date().toISOString() }
  };
  if (failed.length) patch.incMap = { failedChecks: Object.fromEntries(failed.map(id => [id, 1])) };
  if (passed) {
    patch.set.finalCode = code.slice(0, MAX_CODE);
    if ((STATUS_RANK[progress[meta.id]?.status] || 0) < 2) patch.set.status = 'practice_done';
  }
  progress[meta.id] = await store.updateStep(meta.id, patch);
  store.logEvent(passed ? 'check_pass' : 'check_fail', meta.id, { failed, typos: diagnostics.length });

  if (passed) {
    clearFeedback();
    setStatus('Все требования выполнены.', 'ok');
    renderButtons();
    runQuiz();
    return;
  }

  /* Подсветка: опечатки – красным, строки невыполненных требований – жёлтым */
  const labelOf = id => def.checks.find(c => c.id === id)?.label || '';
  const items = [
    ...diagnostics.map(d => ({ ...d, tone: 'err' })),
    ...failedResults.filter(r => r.line && !diagnostics.some(d => d.line === r.line))
      .map(r => ({ line: r.line, tone: 'warn', message: `Не выполнено: ${labelOf(r.id)}` }))
  ];
  editor.mark(items.map(({ line, tone }) => ({ line, tone })));
  renderDiagnostics(items, 'Что исправить');

  const okCount = results.length - failed.length;
  const fails = progress[meta.id].failedAttempts || 0;

  /* Правильный код после SOLUTION_AFTER неудачных проверок */
  if (fails >= SOLUTION_AFTER && def.solution && !current.solutionShown) {
    if (SOLUTION_MODE === 'auto') { insertSolution(code); return; }
    els.btnSolution.hidden = false;
  }

  const level = hintLevel(fails);
  const left = attemptsToNextHint(fails);
  let text = `Выполнено ${okCount} из ${results.length}. Не выполнено: ${labelOf(failed[0])}`;
  if (failed.length > 1) text += ` и ещё ${failed.length - 1}`;
  text += '.';
  if (level === 0 && left) text += ` Подсказка откроется через ${left} ${plural(left, 'проверку', 'проверки', 'проверок')}.`;
  setStatus(text, 'fail');

  const firstFailed = def.checks.find(c => c.id === failed[0]);
  const shown = renderHint(els.hintBox, firstFailed, level);
  if (shown) {
    els.task.open = true;
    els.hintBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    progress[meta.id] = await store.updateStep(meta.id, { max: { hintLevelMax: shown } });
    store.logEvent('hint', meta.id, { check: firstFailed.id, level: shown });
  }
}

/* Вставить правильный код и показать, чем он отличается от варианта студента */
async function insertSolution(ownCode) {
  const { meta } = current;
  const solution = solutionFor(ownCode);
  if (!solution) return;

  current.ownCode = ownCode;
  current.solutionShown = true;
  editor.value = solution;
  store.saveDraft(meta.id, solution);
  preview.render(solution);

  const lines = changedLines(ownCode, solution);
  const solLines = solution.split('\n');
  editor.mark(lines.map(line => ({ line, tone: 'fix' })));
  if (lines.length) editor.goToLine(lines[0]);
  renderDiagnostics(
    lines.map(line => ({ line, tone: 'fix', message: '`' + solLines[line - 1].trim() + '`' })),
    'Правильный вариант отличается в этих строках'
  );
  renderRequirements(null);
  els.hintBox.hidden = true;
  els.btnSolution.hidden = true;
  els.btnRestore.hidden = false;
  setStatus(`После ${SOLUTION_AFTER} попыток вставлен правильный код. Зелёным отмечены строки, которые отличаются от вашего варианта. Сравните и нажмите «Проверить».`, 'ok');

  progress[meta.id] = await store.updateStep(meta.id, {
    inc: { solutionInserted: 1 },
    set: { solutionUsed: true }
  });
  store.logEvent('solution_inserted', meta.id, { ownCode: ownCode.slice(0, 5000), changedLines: lines });
}

function restoreOwnCode() {
  if (current.ownCode == null) return;
  editor.value = current.ownCode;
  store.saveDraft(current.meta.id, current.ownCode);
  preview.render(current.ownCode);
  clearFeedback();
  setStatus('Возвращён ваш вариант. Исправьте отмеченные ранее строки и проверьте снова.');
  store.logEvent('solution_restored', current.meta.id);
  editor.focus();
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/* ---------- Тест ---------- */
async function runQuiz() {
  const { meta, def } = current;
  const n = nextIndex();
  const { passed, next } = await openQuiz(els.quiz, {
    stepTitle: meta.title,
    questions: def.quiz,
    passScore: def.passScore ?? 0.8,
    hasNext: n >= 0 && steps[n].ready,
    onAttempt: async ({ score, answers, passed: ok, correct, total }) => {
      const patch = {
        inc: { quizAttempts: 1 },
        max: { quizBestScore: score },
        set: { quizAnswers: answers, lastQuizAt: new Date().toISOString() }
      };
      const wasDone = isDone(meta.id);
      if (ok && !wasDone) Object.assign(patch.set, { status: 'completed', completedAt: new Date().toISOString() });
      progress[meta.id] = await store.updateStep(meta.id, patch);
      store.logEvent('quiz_submit', meta.id, { score, correct, total });
      if (ok && !wasDone) {
        store.logEvent('step_complete', meta.id);
        tracker.flush();
        renderProgress();
        renderButtons();
        setStatus('Шаг пройден.', 'ok');
      }
    }
  });

  if (passed && next) goTo(nextIndex());
  else renderButtons();
}

/* ---------- Кнопки ---------- */
els.btnCheck.addEventListener('click', check);
els.btnSolution.addEventListener('click', () => insertSolution(editor.value));
els.btnRestore.addEventListener('click', restoreOwnCode);
els.btnQuiz.addEventListener('click', runQuiz);
els.btnNext.addEventListener('click', () => {
  const n = nextIndex();
  if (n >= 0 && accessible(n)) goTo(n);
});
els.btnReset.addEventListener('click', () => {
  if (!confirm('Стереть код в редакторе и начать шаг заново? Статистика попыток сохранится.')) return;
  editor.value = startCode(current.index, current.def);
  store.saveDraft(current.meta.id, editor.value);
  preview.render(editor.value);
  renderRequirements(null);
  setStatus('');
  clearFeedback();
  editor.focus();
});

/* Cmd/Ctrl+Enter – проверить */
els.code.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); check(); }
});

/* ---------- Старт ---------- */
goTo(pickInitialIndex());
