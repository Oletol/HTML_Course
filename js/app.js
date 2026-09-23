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
import { checkSite } from './sitecheck.js';
import { analyzeCss, parseCss } from './cssvalidator.js';
import { BASE_PAGE } from '../content/css/base-page.js';

const MAX_CODE = 20000;

/* Правильный код после N неудачных проверок.
   'auto'   – вставляется сам (свой вариант студент может вернуть кнопкой);
   'button' – появляется кнопка «Показать правильный код». */
const SOLUTION_AFTER = 7;
const SOLUTION_MODE = 'auto';
const STATUS_RANK = { in_progress: 1, practice_done: 2, completed: 3 };

/* ---------- Профиль ---------- */
await store.ready();
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
  quiz: $('quiz'), practice: $('practice'), assignment: $('assignment')
};

/* ---------- Состояние ---------- */
const steps = flatSteps();
let progress = await store.loadProgress();
let current = null; /* { index, meta, def, ownCode, solutionShown } */

const isDone = id => progress[id]?.status === 'completed';
const lessonsOf = moduleId => steps.filter(s => s.moduleId === moduleId && s.type !== 'assignment');

/* Модуль открыт, если пройдены все учебные шаги модуля из requires.
   Итоговые работы доступ к следующему модулю не блокируют. */
const moduleOpen = moduleId => {
  const req = steps.find(s => s.moduleId === moduleId)?.moduleRequires;
  return !req || lessonsOf(req).every(s => isDone(s.id));
};
/* Шаг открыт, если открыт модуль и пройдены предыдущие учебные шаги этого модуля */
const accessible = i => {
  const s = steps[i];
  if (!s?.ready || !moduleOpen(s.moduleId)) return false;
  return steps.slice(0, i).filter(p => p.moduleId === s.moduleId && p.type !== 'assignment').every(p => isDone(p.id));
};

/* ---------- Сервисы ---------- */
const tracker = createTracker({
  onFlush: (stepId, seconds) => {
    store.updateStep(stepId, { inc: { activeSec: seconds } }).then(p => { progress[stepId] = p; });
  }
});

const preview = createPreview(els.preview, 450, {
  onFormSubmit: () => toast('Форма прошла встроенную проверку браузера. В песочнице отправка отключена, данные никуда не ушли.')
});

/* ---------- Рабочее пространство: один файл (HTML) или два (HTML и CSS) ---------- */
let multi = false;
let activeFile = 'html';
let draftTimer;

const fileLabel = f => (f === 'css' ? 'style.css' : 'index.html');

function currentCode() {
  return multi ? { html: editors.html.value, css: editors.css.value } : editors.html.value;
}
function setCode(code) {
  if (multi) {
    editors.html.value = code?.html ?? '';
    editors.css.value = code?.css ?? '';
  } else {
    editors.html.value = typeof code === 'string' ? code : (code?.html ?? '');
  }
}
function renderNow() {
  if (multi) preview.render(editors.html.value, editors.css.value);
  else preview.render(editors.html.value);
}
function saveDraftNow() {
  if (!current) return;
  store.saveDraft(current.meta.id, multi ? JSON.stringify(currentCode()) : editors.html.value);
}
function readDraft(stepId) {
  const raw = store.getDraft(stepId);
  if (raw == null) return null;
  if (!multi) return raw;
  try { const o = JSON.parse(raw); return o && typeof o === 'object' ? o : null; } catch { return null; }
}

const editorHandlers = file => ({
  onChange: () => {
    if (multi) preview.schedule(editors.html.value, editors.css.value);
    else preview.schedule(editors.html.value);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, 400);
  },
  onBlocked: type => {
    toast('Вставка отключена: наберите код вручную.');
    if (current) {
      store.updateStep(current.meta.id, { inc: { pasteBlocked: 1 } }).then(p => { progress[current.meta.id] = p; });
      store.logEvent('paste_blocked', current.meta.id, { type, file });
    }
  },
  onSuspicious: length => {
    if (current) store.logEvent('bulk_insert', current.meta.id, { length, file });
  }
});

const editors = {
  html: createEditor(els.code, els.gutter, els.marks, editorHandlers('html')),
  css: createEditor($('codeCss'), $('gutterCss'), $('marksCss'), editorHandlers('css'))
};
const editor = editors.html;

const tabs = { html: $('tabHtml'), css: $('tabCss') };
const panels = { html: $('editorHtml'), css: $('editorCss') };

function showFile(file, focus = false) {
  activeFile = file;
  for (const f of ['html', 'css']) {
    const on = f === file;
    tabs[f].setAttribute('aria-selected', String(on));
    tabs[f].tabIndex = on ? 0 : -1;
    panels[f].hidden = !on;
  }
  if (focus) editors[file].focus();
}
Object.entries(tabs).forEach(([f, tab]) => {
  tab.addEventListener('click', () => showFile(f, true));
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = f === 'html' ? 'css' : 'html';
      showFile(next);
      tabs[next].focus();
    }
  });
});

function setMode(isMulti) {
  multi = isMulti;
  $('fileTabs').hidden = !isMulti;
  $('editorLabel').hidden = isMulti;
  $('previewTools').hidden = !isMulti;
  $('previewNote').hidden = isMulti;
  if (!isMulti) {
    panels.css.hidden = true; panels.html.hidden = false; activeFile = 'html';
    els.preview.style.removeProperty('inline-size');
    delete $('previewStage').dataset.width;
    preview.setSettings({ theme: 'auto', dir: 'auto', motion: 'auto' });
  }
}

/* ---------- Настройки окна результата (модули CSS) ---------- */
const PREVIEW_KEY = 'html-sandbox:preview';
const opts = { width: $('optWidth'), theme: $('optTheme'), dir: $('optDir'), motion: $('optMotion') };
function applyPreviewSettings() {
  const s = Object.fromEntries(Object.entries(opts).map(([k, el]) => [k, el.value]));
  try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(s)); } catch { /* ничего */ }
  const stage = $('previewStage');
  if (s.width === 'auto') { els.preview.style.removeProperty('inline-size'); delete stage.dataset.width; }
  else { els.preview.style.inlineSize = `${s.width}px`; stage.dataset.width = s.width; }
  preview.setSettings({ theme: s.theme, dir: s.dir, motion: s.motion });
}
try {
  const saved = JSON.parse(localStorage.getItem(PREVIEW_KEY) || '{}');
  Object.entries(saved).forEach(([k, v]) => { if (opts[k] && [...opts[k].options].some(o => o.value === v)) opts[k].value = v; });
} catch { /* ничего */ }
Object.values(opts).forEach(el => el.addEventListener('change', applyPreviewSettings));
const previewSettings = () => (multi ? { theme: opts.theme.value, dir: opts.dir.value, motion: opts.motion.value } : {});

/* Копирование учебных текстов */
const onCopyAttempt = type => {
  toast('Материалы нельзя копировать. Попробуйте пересказать своими словами – так запоминается лучше.');
  if (current) {
    store.updateStep(current.meta.id, { inc: { copyBlocked: 1 } }).then(p => { progress[current.meta.id] = p; });
    store.logEvent('copy_blocked', current.meta.id, { type });
  }
};
[els.theory, els.task, els.hintBox, els.quiz].forEach(el => protect(el, onCopyAttempt));
guardDocument([els.code, $('codeCss')], onCopyAttempt);

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
      if (!moduleOpen(s.moduleId)) {
        const req = steps.find(x => x.moduleId === s.moduleRequires);
        root.append(h('p', { class: 'drawer__note' }, `Откроется после учебных шагов модуля ${req?.moduleTitle || ''}. Итоговая работа для этого не нужна.`));
      }
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
      onclick: () => {
        const f = d.file || 'html';
        if (multi) showFile(f);
        if (d.line) editors[f].goToLine(d.line);
      }
    },
      h('span', { class: 'diags__line' }, d.line ? `${multi ? fileLabel(d.file || 'html') + ', с' : 'С'}трока ${d.line}` : 'Весь код'),
      h('span', {}, rich(d.message))))));
  els.diags.hidden = false;
}

function clearFeedback() {
  editors.html.clearMarks();
  editors.css.clearMarks();
  renderDiagnostics([]);
  els.hintBox.hidden = true;
  els.btnSolution.hidden = true;
  els.btnRestore.hidden = true;
}

function solutionFor(code) {
  const sol = current.def.solution;
  if (!sol) return null;
  if (typeof sol !== 'function') return sol;
  return multi ? sol({ html: makeContext(code.html), css: parseCss(code.css) }) : sol(makeContext(code));
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
  if (def.files) {
    const st = def.starter || {};
    const prev = steps[index - 1];
    const lastHtmlLesson = lessonsOf('html').at(-1);
    let html = BASE_PAGE;
    if (st.html === 'html-module') html = progress[lastHtmlLesson?.id]?.finalCode || BASE_PAGE;
    else if (st.html === 'previous') html = (prev && progress[prev.id]?.finalCode) || BASE_PAGE;
    else if (typeof st.html === 'string') html = st.html;
    const css = st.css === 'previous' ? ((prev && progress[prev.id]?.finalCss) || '') : (st.css ?? '');
    return { html, css };
  }
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
  const open = n >= 0 && accessible(n);
  els.btnNext.disabled = !open;
  const otherModule = n >= 0 && steps[n].moduleId !== current.meta.moduleId;
  els.btnNext.textContent = !open ? (steps[n]?.ready ? 'Следующий шаг закрыт' : 'Следующий шаг скоро')
    : otherModule ? `Модуль ${steps[n].moduleTitle}` : 'Следующий шаг';
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

  /* Итоговая работа: вместо редактора – панель сдачи */
  const isAssignment = def.type === 'assignment';
  els.practice.hidden = isAssignment;
  els.assignment.hidden = !isAssignment;
  if (isAssignment) {
    if (!progress[meta.id]) {
      progress[meta.id] = await store.updateStep(meta.id, {
        set: { status: 'in_progress', moduleId: meta.moduleId, startedAt: new Date().toISOString() }
      });
      store.logEvent('step_open', meta.id);
    }
    renderAssignment();
    tracker.start(meta.id);
    renderProgress();
    return;
  }

  setMode(Boolean(def.files));
  els.taskText.replaceChildren(paragraphs(def.task));
  els.task.open = true;

  const done = isDone(meta.id);
  renderRequirements(done ? def.checks.map(c => ({ id: c.id, ok: true })) : null);

  const draft = readDraft(meta.id);
  const saved = progress[meta.id]?.finalCode != null
    ? (multi ? { html: progress[meta.id].finalCode, css: progress[meta.id].finalCss ?? '' } : progress[meta.id].finalCode)
    : null;
  setCode(draft ?? saved ?? startCode(index, def));
  if (multi) { showFile(def.openFile || 'css'); applyPreviewSettings(); }
  renderNow();

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
  const code = currentCode();
  els.btnCheck.disabled = true;
  let analysis;
  try {
    analysis = multi
      ? await analyzeCss({ html: code.html, css: code.css, checks: def.checks, settings: previewSettings() })
      : analyze(code, def.checks);
  } finally {
    els.btnCheck.disabled = false;
  }
  const { results, diagnostics } = analysis;
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
    if (multi) {
      patch.set.finalCode = code.html.slice(0, MAX_CODE);
      patch.set.finalCss = code.css.slice(0, MAX_CODE);
    } else {
      patch.set.finalCode = code.slice(0, MAX_CODE);
    }
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
    ...diagnostics.map(d => ({ ...d, file: d.file || 'html', tone: 'err' })),
    ...failedResults.filter(r => r.line && !diagnostics.some(d => d.line === r.line && (d.file || 'html') === (r.file || 'html')))
      .map(r => ({ line: r.line, file: r.file || (multi ? 'css' : 'html'), tone: 'warn', message: `Не выполнено: ${labelOf(r.id)}` }))
  ];
  for (const f of ['html', 'css']) {
    editors[f].mark(items.filter(it => it.file === f).map(({ line, tone }) => ({ line, tone })));
  }
  if (multi && items[0] && items[0].file !== activeFile && !items.some(it => it.file === activeFile)) showFile(items[0].file);
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
  setCode(solution);
  saveDraftNow();
  renderNow();

  const files = multi ? ['html', 'css'] : ['html'];
  const own = f => (multi ? ownCode[f] : ownCode);
  const sol = f => (multi ? solution[f] : solution);
  const changes = files.flatMap(f => changedLines(own(f), sol(f)).map(line => ({ file: f, line })));
  for (const f of files) editors[f].mark(changes.filter(c => c.file === f).map(c => ({ line: c.line, tone: 'fix' })));
  if (changes.length) {
    if (multi) showFile(changes[0].file);
    editors[changes[0].file].goToLine(changes[0].line);
  }
  renderDiagnostics(
    changes.map(c => ({ ...c, tone: 'fix', message: '`' + sol(c.file).split('\n')[c.line - 1].trim() + '`' })),
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
  const ownText = multi ? `${ownCode.html}\n/* style.css */\n${ownCode.css}` : ownCode;
  store.logEvent('solution_inserted', meta.id, { ownCode: ownText.slice(0, 5000), changedLines: changes.map(c => `${c.file}:${c.line}`) });
}

function restoreOwnCode() {
  if (current.ownCode == null) return;
  setCode(current.ownCode);
  saveDraftNow();
  renderNow();
  clearFeedback();
  setStatus('Возвращён ваш вариант. Исправьте отмеченные ранее строки и проверьте снова.');
  store.logEvent('solution_restored', current.meta.id);
  editors[activeFile].focus();
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

/* ==================================================================
   Итоговая работа
   ================================================================== */
const SITE_RE = /^https:\/\/[a-z0-9-]+\.github\.io(\/[^\s]*)?$/i;
const REPO_RE = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i;

function renderAssignment() {
  const { meta, def } = current;
  const p = () => progress[meta.id] || {};
  const box = els.assignment;

  const siteInput = h('input', { class: 'field__input', id: 'siteUrl', type: 'url', inputmode: 'url', autocomplete: 'off',
    placeholder: 'https://имя.github.io/репозиторий/', value: p().siteUrl || '' });
  const repoInput = h('input', { class: 'field__input', id: 'repoUrl', type: 'url', inputmode: 'url', autocomplete: 'off',
    placeholder: 'https://github.com/имя/репозиторий', value: p().repoUrl || '' });
  const siteErr = h('p', { class: 'field__error', id: 'siteUrlError' });
  const repoErr = h('p', { class: 'field__error', id: 'repoUrlError' });
  const saveMsg = h('p', { class: 'assignment__msg', role: 'status', 'aria-live': 'polite' });
  const report = h('div', { class: 'assignment__report', 'aria-live': 'polite' });
  const btnRun = h('button', { class: 'btn', type: 'button' }, 'Проверить опубликованный сайт');

  const checklist = h('fieldset', { class: 'assignment__checklist' },
    h('legend', {}, 'Самопроверка перед сдачей'),
    ...def.checklist.map((text, i) => {
      const id = `chk${i}`;
      return h('label', { class: 'check', for: id },
        h('input', { type: 'checkbox', id, checked: Boolean(p().checklist?.[i]),
          onchange: e => saveChecklist(i, e.target.checked) }),
        h('span', {}, rich(text)));
    }));

  const statusLine = h('p', { class: 'assignment__status', role: 'status' });

  function updateStatus() {
    const pr = p();
    const ticks = def.checklist.filter((_, i) => pr.checklist?.[i]).length;
    const done = pr.status === 'completed';
    statusLine.dataset.tone = done ? 'ok' : '';
    statusLine.textContent = done
      ? 'Работа отмечена как сданная в песочнице. Оценка появится в Moodle после проверки преподавателем.'
      : `Ссылки ${pr.siteUrl && pr.repoUrl ? 'сохранены' : 'не сохранены'}, пунктов самопроверки отмечено ${ticks} из ${def.checklist.length}.`;
  }

  async function maybeComplete() {
    const pr = p();
    const all = def.checklist.every((_, i) => pr.checklist?.[i]);
    if (pr.siteUrl && pr.repoUrl && all && pr.status !== 'completed') {
      progress[meta.id] = await store.updateStep(meta.id, { set: { status: 'completed', completedAt: new Date().toISOString() } });
      store.logEvent('assignment_submitted', meta.id, { siteUrl: pr.siteUrl, repoUrl: pr.repoUrl });
      renderProgress();
      toast('Готово. Не забудьте отправить ссылки в задание в Moodle.');
    }
    updateStatus();
  }

  async function saveChecklist(i, value) {
    const map = { ...(p().checklist || {}) };
    map[i] = value;
    progress[meta.id] = await store.updateStep(meta.id, { set: { checklist: map } });
    maybeComplete();
  }

  async function saveLinks(e) {
    e.preventDefault();
    const site = siteInput.value.trim();
    const repo = repoInput.value.trim();
    siteErr.textContent = SITE_RE.test(site) ? '' : 'Нужен адрес GitHub Pages вида https://имя.github.io/репозиторий/';
    repoErr.textContent = REPO_RE.test(repo) ? '' : 'Нужен адрес репозитория вида https://github.com/имя/репозиторий';
    if (siteErr.textContent || repoErr.textContent) return;
    progress[meta.id] = await store.updateStep(meta.id, { set: { siteUrl: site, repoUrl: repo, linksSavedAt: new Date().toISOString() } });
    saveMsg.textContent = 'Ссылки сохранены.';
    maybeComplete();
  }

  async function runCheck() {
    const site = siteInput.value.trim();
    if (!SITE_RE.test(site)) { siteErr.textContent = 'Сначала укажите адрес сайта на GitHub Pages.'; siteInput.focus(); return; }
    btnRun.disabled = true;
    btnRun.textContent = 'Проверяю…';
    report.replaceChildren(h('p', {}, 'Загружаю страницы сайта…'));
    try {
      const res = await checkSite(site);
      if (res.fatal) { report.replaceChildren(h('p', { class: 'assignment__fatal' }, res.fatal)); return; }
      const passed = res.items.filter(i => i.ok).length;
      report.replaceChildren(
        h('p', { class: 'assignment__score' }, `Выполнено ${passed} из ${res.items.length}. Проверено страниц: ${res.pages.filter(pg => !pg.error).length}.`),
        h('ul', { class: 'reqs' }, res.items.map(it => h('li', { class: 'reqs__item', dataset: { state: it.ok ? 'ok' : 'fail' } },
          h('span', { class: 'reqs__mark', 'aria-hidden': 'true' }, it.ok ? '✓' : '✕'),
          h('span', { class: 'reqs__text' }, h('span', { class: 'visually-hidden' }, it.ok ? 'выполнено: ' : 'не выполнено: '),
            rich(it.label), it.detail ? h('span', { class: 'assignment__detail' }, it.detail) : null)))));
      progress[meta.id] = await store.updateStep(meta.id, {
        set: { autoCheck: { passed, total: res.items.length, at: new Date().toISOString(), failed: res.items.filter(i => !i.ok).map(i => i.id) } },
        inc: { autoCheckRuns: 1 }
      });
      store.logEvent('site_check', meta.id, { passed, total: res.items.length });
    } catch (err) {
      report.replaceChildren(h('p', { class: 'assignment__fatal' },
        `Сайт не удалось загрузить: ${err.message}. Проверьте адрес и что публикация включена. Если сайт открывается в браузере, а проверка не проходит, проверьте требования по списку вручную.`));
    } finally {
      btnRun.disabled = false;
      btnRun.textContent = 'Проверить опубликованный сайт';
    }
  }

  btnRun.addEventListener('click', runCheck);

  const n = nextIndex();
  const nextModule = n >= 0 && steps[n].moduleId !== meta.moduleId && accessible(n)
    ? h('p', { class: 'assignment__next' }, h('button', { class: 'btn', type: 'button', onclick: () => goTo(n) },
        `Перейти к модулю ${steps[n].moduleTitle}`),
      ' Итоговую работу можно сдать позже: следующий модуль уже открыт.')
    : null;

  box.replaceChildren(
    h('h2', { class: 'assignment__title' }, 'Сдача работы'),
    ...(nextModule ? [nextModule] : []),
    h('p', {}, `Оценка – до ${def.points} баллов, выставляется в Moodle. Здесь сохраните ссылки, проверьте опубликованный сайт и отметьте пункты самопроверки.`),
    h('form', { class: 'assignment__form', onsubmit: saveLinks, novalidate: true },
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'siteUrl' }, 'Адрес сайта на GitHub Pages'), siteInput, siteErr),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'repoUrl' }, 'Адрес репозитория'), repoInput, repoErr),
      h('div', { class: 'login__actions' }, h('button', { class: 'btn btn--primary', type: 'submit' }, 'Сохранить ссылки'), btnRun),
      saveMsg),
    report,
    checklist,
    statusLine
  );
  if (p().autoCheck) {
    const a = p().autoCheck;
    report.replaceChildren(h('p', { class: 'assignment__score' },
      `Последняя автопроверка: выполнено ${a.passed} из ${a.total}. Запустите её снова после исправлений.`));
  }
  updateStatus();
}

/* ---------- Кнопки ---------- */
els.btnCheck.addEventListener('click', check);
els.btnSolution.addEventListener('click', () => insertSolution(currentCode()));
els.btnRestore.addEventListener('click', restoreOwnCode);
els.btnQuiz.addEventListener('click', runQuiz);
els.btnNext.addEventListener('click', () => {
  const n = nextIndex();
  if (n >= 0 && accessible(n)) goTo(n);
});
els.btnReset.addEventListener('click', () => {
  if (!confirm('Стереть код в редакторе и начать шаг заново? Статистика попыток сохранится.')) return;
  setCode(startCode(current.index, current.def));
  saveDraftNow();
  renderNow();
  renderRequirements(null);
  setStatus('');
  clearFeedback();
  editors[activeFile].focus();
});

/* Cmd/Ctrl+Enter – проверить */
[els.code, $('codeCss')].forEach(area => area.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); check(); }
}));

/* ---------- Старт ---------- */
goTo(pickInitialIndex());
