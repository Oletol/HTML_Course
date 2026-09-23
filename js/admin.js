/* ==================================================================
   admin.js – панель преподавателя.

   Вход по почте и паролю учётной записи Firebase; доступ есть только
   у пользователя, чей UID записан в коллекции admins.
   Таблица студентов обновляется сама (onSnapshot), подробности
   по студенту и сводка по шагам загружаются по кнопке.
   Все тексты из базы выводятся через textContent – без innerHTML.
   ================================================================== */

import {
  auth, db,
  signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut,
  doc, getDoc, collection, getDocs, query, where, onSnapshot
} from './firebase-init.js';
import { flatSteps } from '../content/index.js';
import { rich, toast, h } from './ui.js';

const $ = id => document.getElementById(id);
const steps = flatSteps();
const stepIndex = Object.fromEntries(steps.map((s, i) => [s.id, i]));
const TOTAL = steps.filter(s => s.moduleId === 'html').length;
const ACTIVE_MS = 5 * 60 * 1000;

let students = [];
let unsubscribe = null;
let sortKey = 'displayName';
let sortDir = 1;
let stepsData = null;      /* { uid: { stepId: progress } } после загрузки сводки */
const labels = {};         /* stepId -> { checkId: label } */

/* ---------- Форматирование ---------- */
const toDate = v => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
function duration(sec = 0) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, '0')} мин`;
}
function when(d) {
  if (!d) return '–';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.round(diff / 60000)} мин назад`;
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
const stepTitle = id => {
  const s = steps[stepIndex[id]];
  return s ? `${s.n}. ${s.title}` : '–';
};

async function loadLabels() {
  await Promise.all(steps.filter(s => s.file).map(async s => {
    try {
      const mod = await import(new URL(`../content/${s.file}`, import.meta.url));
      labels[s.id] = Object.fromEntries((mod.default.checks || []).map(c => [c.id, c.label]));
    } catch { labels[s.id] = {}; }
  }));
}

/* ==================================================================
   Вход
   ================================================================== */
const loginView = $('loginView');
const dashView = $('dashView');

onAuthStateChanged(auth, async user => {
  if (!user || user.isAnonymous) { showLogin(); return; }
  try {
    const adm = await getDoc(doc(db, 'admins', user.uid));
    if (!adm.exists()) throw new Error('not admin');
  } catch {
    $('adminError').textContent = 'У этой учётной записи нет доступа к панели преподавателя.';
    await signOut(auth);
    return;
  }
  showDashboard();
});

function showLogin() {
  unsubscribe?.();
  dashView.hidden = true;
  loginView.hidden = false;
  $('email').focus();
}

$('adminForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('adminError').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, $('email').value.trim(), $('password').value);
  } catch (err) {
    $('adminError').textContent = /invalid|wrong|user-not-found/.test(err.code || '')
      ? 'Неверная почта или пароль.'
      : 'Не удалось войти. Проверьте подключение к интернету.';
  }
});

$('btnReset').addEventListener('click', async () => {
  const email = $('email').value.trim();
  if (!email) { $('adminError').textContent = 'Введите почту, на неё придёт ссылка для нового пароля.'; $('email').focus(); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    $('adminError').textContent = 'Письмо со ссылкой для нового пароля отправлено. Проверьте и папку «Спам».';
  } catch {
    $('adminError').textContent = 'Не удалось отправить письмо. Проверьте адрес.';
  }
});

$('btnLogout').addEventListener('click', () => signOut(auth));

/* ==================================================================
   Панель
   ================================================================== */
async function showDashboard() {
  loginView.hidden = true;
  dashView.hidden = false;
  loadLabels();
  const snap = await getDocs(collection(db, 'groups'));
  const select = $('groupSelect');
  select.replaceChildren(...snap.docs.map(d => h('option', { value: d.id }, `${d.id}${d.data().title ? ' – ' + d.data().title : ''}`)));
  const saved = localStorage.getItem('html-sandbox:admin-group');
  if (saved && snap.docs.some(d => d.id === saved)) select.value = saved;
  select.onchange = () => { localStorage.setItem('html-sandbox:admin-group', select.value); watchGroup(select.value); };
  if (select.value) watchGroup(select.value);
  else $('studentsNote').textContent = 'Групп пока нет. Добавьте документ в коллекцию groups в консоли Firebase.';
}

function watchGroup(group) {
  unsubscribe?.();
  stepsData = null;
  $('stepsTable').hidden = true;
  $('liveState').textContent = 'подключение…';
  unsubscribe = onSnapshot(query(collection(db, 'students'), where('group', '==', group)), snap => {
    students = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    $('liveState').textContent = 'обновляется автоматически';
    render();
  }, err => {
    $('liveState').textContent = '';
    $('studentsNote').textContent = `Не удалось загрузить студентов: ${err.code || err.message}. Проверьте, опубликованы ли правила Firestore.`;
  });
}

/* ---------- Таблица студентов ---------- */
function sortValue(s, key) {
  if (key === 'lastSeen') return toDate(s.lastSeenAt)?.getTime() || 0;
  if (key === 'currentStep') return stepIndex[s.currentStep] ?? -1;
  if (key === 'displayName') return (s.displayName || '').toLowerCase();
  return Number(s[key]) || 0;
}

function render() {
  const q = $('search').value.trim().toLowerCase();
  const list = students
    .filter(s => !q || (s.displayName || '').toLowerCase().includes(q))
    .sort((a, b) => {
      const x = sortValue(a, sortKey), y = sortValue(b, sortKey);
      return (x > y ? 1 : x < y ? -1 : 0) * sortDir;
    });

  const now = Date.now();
  const active = students.filter(s => now - (toDate(s.lastSeenAt)?.getTime() || 0) < ACTIVE_MS).length;
  const avg = students.length ? students.reduce((a, s) => a + (s.completedSteps || 0), 0) / students.length : 0;
  $('kpiStudents').textContent = students.length;
  $('kpiActive').textContent = active;
  $('kpiAvg').textContent = students.length ? avg.toFixed(1).replace('.', ',') : '–';
  $('kpiSolution').textContent = students.reduce((a, s) => a + (s.solutionUsed || 0), 0);

  $('studentsBody').replaceChildren(...list.map(s => {
    const last = toDate(s.lastSeenAt);
    const live = last && now - last.getTime() < ACTIVE_MS;
    const pct = Math.round(((s.completedSteps || 0) / TOTAL) * 100);
    return h('tr', {},
      h('th', { scope: 'row' }, h('button', { type: 'button', class: 'student-link', onclick: () => openStudent(s) }, s.displayName || 'Без имени')),
      h('td', {}, h('span', { class: 'mini-bar', 'aria-hidden': 'true' }, h('span', { style: `width:${pct}%` })), `${s.completedSteps || 0} из ${TOTAL}`),
      h('td', {}, stepTitle(s.currentStep)),
      h('td', { class: 'num' }, duration(s.totalActiveSec)),
      h('td', { class: 'num' }, String(s.totalAttempts || 0)),
      h('td', { class: 'num' }, String(s.totalFailed || 0)),
      h('td', { class: 'num' }, s.solutionUsed ? h('span', { class: 'badge badge--warn' }, `${s.solutionUsed}`) : '0'),
      h('td', { class: 'num' }, s.pasteBlocked ? h('span', { class: 'badge badge--err' }, `${s.pasteBlocked}`) : '0'),
      h('td', {}, live ? h('span', { class: 'dot-live', 'aria-hidden': 'true' }) : null, when(last))
    );
  }));
  $('studentsNote').textContent = students.length ? '' : 'В этой группе пока нет студентов. Они появятся здесь, как только войдут в песочницу.';
}

$('search').addEventListener('input', render);
document.querySelectorAll('.sort').forEach(btn => btn.addEventListener('click', () => {
  const key = btn.dataset.key;
  sortDir = key === sortKey ? -sortDir : (key === 'displayName' ? 1 : -1);
  sortKey = key;
  document.querySelectorAll('.sort').forEach(b => b.removeAttribute('aria-sort'));
  btn.setAttribute('aria-sort', sortDir === 1 ? 'ascending' : 'descending');
  render();
}));

/* ---------- Карточка студента ---------- */
async function loadProgress(uid) {
  const snap = await getDocs(collection(db, 'students', uid, 'progress'));
  return Object.fromEntries(snap.docs.map(d => [d.id, d.data()]));
}

const STATUS = {
  completed: ['пройден', 'badge--ok'],
  practice_done: ['практика выполнена, тест нет', 'badge--warn'],
  in_progress: ['в работе', 'badge--muted']
};

function topFailed(stepId, map, n = 3) {
  return Object.entries(map || {}).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([id, count]) => ({ label: labels[stepId]?.[id] || id, count }));
}

async function openStudent(s) {
  const dlg = $('studentDialog');
  const body = h('div', { class: 'dialog__body' },
    h('p', { class: 'dialog__eyebrow' }, `Группа ${s.group}`),
    h('h2', { class: 'dialog__title', id: 'studentTitle' }, s.displayName || 'Без имени'),
    h('p', {}, `Пройдено ${s.completedSteps || 0} из ${TOTAL}. Время ${duration(s.totalActiveSec)}. Последняя активность: ${when(toDate(s.lastSeenAt))}.`),
    h('p', {}, 'Загрузка…'));
  const foot = h('div', { class: 'dialog__foot' }, h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Закрыть'));
  dlg.replaceChildren(body, foot);
  dlg.showModal();

  let prog;
  try { prog = stepsData?.[s.uid] || await loadProgress(s.uid); }
  catch (err) { body.lastChild.textContent = `Не удалось загрузить: ${err.code || err.message}`; return; }

  const rows = steps.filter(st => prog[st.id]).map(st => {
    const p = prog[st.id];
    const [text, cls] = STATUS[p.status] || ['–', 'badge--muted'];
    const errs = topFailed(st.id, p.failedChecks);
    return h('tr', {},
      h('th', { scope: 'row' }, `${st.n}. ${st.title}`),
      h('td', {}, h('span', { class: `badge ${cls}` }, text)),
      h('td', { class: 'num' }, duration(p.activeSec)),
      h('td', { class: 'num' }, `${p.checkAttempts || 0} / ${p.failedAttempts || 0}`),
      h('td', { class: 'num' }, p.quizAttempts ? `${Math.round((p.quizBestScore || 0) * 100)} % за ${p.quizAttempts}` : '–'),
      h('td', {}, p.solutionUsed ? h('span', { class: 'badge badge--warn' }, 'да') : 'нет'),
      h('td', {}, errs.length ? errs.map(e => h('div', {}, rich(e.label), ` – ${e.count}`)) : '–'),
      h('td', {}, p.finalCode ? h('button', { class: 'btn btn--small', type: 'button', onclick: () => showCode(body, st, p.finalCode) }, 'Код') : '–')
    );
  });

  body.lastChild.replaceWith(
    rows.length
      ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
          h('thead', {}, h('tr', {}, ...['Шаг', 'Статус', 'Время', 'Проверок / ошибок', 'Тест', 'Решение вставлено', 'Частые ошибки', 'Сданный код']
            .map(t => h('th', { scope: 'col' }, t)))),
          h('tbody', {}, rows)))
      : h('p', {}, 'Студент ещё не начал ни одного шага.'),
    h('div', { id: 'codeSlot' })
  );
}

function showCode(body, st, code) {
  const slot = body.querySelector('#codeSlot');
  slot.replaceChildren(h('h3', {}, `Код, сданный на шаге ${st.n}`), h('pre', { class: 'code-view' }, code));
  slot.scrollIntoView({ block: 'nearest' });
}

/* ---------- Сводка по шагам ---------- */
$('btnSteps').addEventListener('click', async () => {
  const btn = $('btnSteps');
  btn.disabled = true;
  btn.textContent = 'Загрузка…';
  try {
    stepsData = {};
    await Promise.all(students.map(async s => { stepsData[s.uid] = await loadProgress(s.uid); }));
    renderSteps();
  } catch (err) {
    toast(`Не удалось загрузить сводку: ${err.code || err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Обновить сводку';
  }
});

function renderSteps() {
  const all = Object.values(stepsData);
  const rows = steps.filter(s => s.ready).map(st => {
    const ps = all.map(p => p[st.id]).filter(Boolean);
    const done = ps.filter(p => p.status === 'completed');
    const avg = (arr, k) => (arr.length ? arr.reduce((a, p) => a + (Number(p[k]) || 0), 0) / arr.length : 0);
    const failed = {};
    ps.forEach(p => Object.entries(p.failedChecks || {}).forEach(([k, v]) => { failed[k] = (failed[k] || 0) + v; }));
    const errs = topFailed(st.id, failed);
    return h('tr', {},
      h('th', { scope: 'row' }, `${st.n}. ${st.title}`),
      h('td', { class: 'num' }, String(ps.length)),
      h('td', { class: 'num' }, String(done.length)),
      h('td', { class: 'num' }, ps.length ? avg(ps, 'checkAttempts').toFixed(1).replace('.', ',') : '–'),
      h('td', { class: 'num' }, ps.length ? duration(avg(ps, 'activeSec')) : '–'),
      h('td', { class: 'num' }, String(ps.filter(p => p.solutionUsed).length)),
      h('td', {}, errs.length ? errs.map(e => h('div', {}, rich(e.label), ` – ${e.count}`)) : '–')
    );
  });
  $('stepsBody').replaceChildren(...rows);
  $('stepsTable').hidden = false;
}

/* ---------- Выгрузка CSV ---------- */
function csvCell(v) {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

$('btnCsv').addEventListener('click', async () => {
  if (!stepsData) {
    toast('Загружаю прогресс по шагам для выгрузки…');
    stepsData = {};
    await Promise.all(students.map(async s => { stepsData[s.uid] = await loadProgress(s.uid); }));
    renderSteps();
  }
  const head = ['Студент', 'Группа', 'Шаг', 'Название шага', 'Статус', 'Время, мин', 'Проверок', 'Ошибок',
    'Лучший результат теста, %', 'Попыток теста', 'Решение вставлено', 'Попытки вставки', 'Попытки копирования', 'Уровень подсказки'];
  const lines = [head];
  students.forEach(s => steps.filter(st => st.ready).forEach(st => {
    const p = stepsData[s.uid]?.[st.id];
    if (!p) return;
    lines.push([s.displayName, s.group, st.n, st.title, p.status, Math.round((p.activeSec || 0) / 60),
      p.checkAttempts || 0, p.failedAttempts || 0, p.quizBestScore != null ? Math.round(p.quizBestScore * 100) : '',
      p.quizAttempts || 0, p.solutionUsed ? 'да' : 'нет', p.pasteBlocked || 0, p.copyBlocked || 0, p.hintLevelMax || 0]);
  }));
  /* Точка с запятой и BOM – чтобы Excel с русскими настройками открыл файл без мастера импорта */
  const csv = '\ufeff' + lines.map(r => r.map(csvCell).join(';')).join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })),
    download: `html-course-${$('groupSelect').value}-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
});
