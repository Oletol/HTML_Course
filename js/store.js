/* ==================================================================
   store.js – профиль, прогресс и события студента в Firestore.

   Интерфейс тот же, что у локальной версии, плюс ready():
     await ready()                      – дождаться входа (анонимного)
     getProfile()                       – профиль или null
     saveProfile({firstName, lastName, group})
     signOut()
     loadProgress()                     – { [stepId]: {...} }
     updateStep(stepId, patch)          – patch = { set, inc, max, incMap }
     logEvent(type, stepId, data)
     flush()                            – записать накопленное немедленно
     getDraft / saveDraft               – черновики кода только в браузере

   Экономия записей (бесплатный тариф: 20 000 записей в сутки):
   изменения копятся в памяти и уходят одним пакетом раз в 2 минуты,
   сразу – при прохождении проверки и теста, при уходе со страницы.
   Пакет: изменённые документы прогресса + сводка студента +
   один документ с накопленными событиями.

   Схема:
     students/{uid}                      сводка для панели преподавателя
     students/{uid}/progress/{stepId}    прогресс по шагу
     students/{uid}/eventBatches/{auto}  события пачками
   ================================================================== */

import {
  auth, db,
  signInAnonymously, onAuthStateChanged, signOut as fbSignOut,
  doc, getDoc, setDoc, collection, getDocs, writeBatch, serverTimestamp
} from './firebase-init.js';

const DRAFT_PREFIX = 'html-sandbox:draft:';
const FLUSH_MS = 120000;
const MAX_EVENTS_PER_BATCH = 300;

let user = null;
let profile = null;
let progress = {};
let dirty = new Set();
let events = [];
let lastStep = null;
let timer = null;
let flushing = null;

const nowIso = () => new Date().toISOString();
const clone = o => JSON.parse(JSON.stringify(o ?? null));

export function normalizeGroup(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

/* ---------- Вход ---------- */
const readyPromise = new Promise(resolve => {
  const stop = onAuthStateChanged(auth, async u => {
    stop();
    user = u;
    if (u) {
      try {
        const snap = await getDoc(doc(db, 'students', u.uid));
        profile = snap.exists() ? { uid: u.uid, ...snap.data() } : null;
      } catch (err) {
        console.warn('Профиль не загружен', err);
        profile = null;
      }
    }
    resolve();
  });
});

/* ---------- Запись пакетом ---------- */
function schedule(ms = FLUSH_MS) {
  if (timer && ms >= FLUSH_MS) return;
  clearTimeout(timer);
  timer = setTimeout(() => { timer = null; store.flush(); }, ms);
}

function summary() {
  const all = Object.values(progress);
  const sum = k => all.reduce((s, p) => s + (Number(p[k]) || 0), 0);
  return {
    completedSteps: all.filter(p => p.status === 'completed').length,
    totalActiveSec: sum('activeSec'),
    totalAttempts: sum('checkAttempts'),
    totalFailed: sum('failedAttempts'),
    pasteBlocked: sum('pasteBlocked'),
    copyBlocked: sum('copyBlocked'),
    solutionUsed: all.filter(p => p.solutionUsed).length,
    currentStep: lastStep,
    lastSeenAt: serverTimestamp()
  };
}

export const store = {
  mode: 'firestore',

  ready: () => readyPromise,

  getProfile() { return profile; },

  async saveProfile({ firstName, lastName, group }) {
    if (!user) user = (await signInAnonymously(auth)).user;
    const displayName = `${lastName.trim()} ${firstName.trim()}`;
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName,
      nameKey: displayName.toLowerCase().replace(/ё/g, 'е'),
      group: normalizeGroup(group),
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
      completedSteps: 0, totalActiveSec: 0, totalAttempts: 0, totalFailed: 0,
      pasteBlocked: 0, copyBlocked: 0, solutionUsed: 0, currentStep: null
    };
    /* Сначала группа: так ошибка кода группы не смешивается с ошибкой доступа к базе */
    let groupDoc;
    try {
      groupDoc = await getDoc(doc(db, 'groups', data.group));
    } catch (err) {
      const e = new Error('База данных не пускает: правила Firestore не опубликованы или устарели.');
      e.code = 'rules';
      e.cause = err;
      throw e;
    }
    if (!groupDoc.exists() || groupDoc.data().active !== true) {
      const e = new Error('Такого кода группы нет или набор в группу закрыт.');
      e.code = 'group';
      throw e;
    }
    try {
      await setDoc(doc(db, 'students', user.uid), data);
    } catch (err) {
      const e = new Error('База данных отклонила запись профиля. Сообщите преподавателю.');
      e.code = 'rules';
      e.cause = err;
      throw e;
    }
    profile = { uid: user.uid, ...data, createdAt: nowIso(), lastSeenAt: nowIso() };
    return profile;
  },

  async signOut() {
    try { await store.flush(); } catch { /* ничего */ }
    await fbSignOut(auth);
    user = null; profile = null; progress = {}; dirty = new Set(); events = [];
    try {
      Object.keys(localStorage).filter(k => k.startsWith(DRAFT_PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch { /* ничего */ }
  },

  async loadProgress() {
    if (!user) return {};
    const snap = await getDocs(collection(db, 'students', user.uid, 'progress'));
    progress = {};
    snap.forEach(d => {
      const data = d.data();
      delete data.updatedAt;
      progress[d.id] = data;
    });
    return clone(progress);
  },

  async updateStep(stepId, { set = {}, inc = {}, max = {}, incMap = {} } = {}) {
    const p = progress[stepId] ?? { createdAt: nowIso() };
    Object.assign(p, set);
    for (const [k, v] of Object.entries(inc)) p[k] = (Number(p[k]) || 0) + v;
    for (const [k, v] of Object.entries(max)) p[k] = Math.max(Number.isFinite(p[k]) ? p[k] : -Infinity, v);
    for (const [k, map] of Object.entries(incMap)) {
      p[k] = p[k] && typeof p[k] === 'object' ? p[k] : {};
      for (const [kk, vv] of Object.entries(map)) p[k][kk] = (Number(p[k][kk]) || 0) + vv;
    }
    p.lastActivityAt = nowIso();
    progress[stepId] = p;
    dirty.add(stepId);
    lastStep = stepId;
    const important = ['practice_done', 'completed'].includes(set.status) || 'solutionUsed' in set;
    schedule(important ? 1000 : FLUSH_MS);
    return clone(p);
  },

  logEvent(type, stepId, payload = {}) {
    events.push({ type, stepId, ts: nowIso(), data: payload });
    if (events.length >= MAX_EVENTS_PER_BATCH) schedule(1000);
    else schedule();
  },

  async flush() {
    if (flushing) return flushing;
    if (!user || !profile || (!dirty.size && !events.length)) return;
    const ids = [...dirty];
    const evs = events.splice(0, MAX_EVENTS_PER_BATCH);
    dirty = new Set();
    const batch = writeBatch(db);
    for (const id of ids) {
      batch.set(doc(db, 'students', user.uid, 'progress', id),
        { ...progress[id], group: profile.group, updatedAt: serverTimestamp() }, { merge: true });
    }
    batch.set(doc(db, 'students', user.uid), summary(), { merge: true });
    if (evs.length) {
      batch.set(doc(collection(db, 'students', user.uid, 'eventBatches')), { ts: serverTimestamp(), events: evs });
    }
    flushing = batch.commit()
      .catch(err => {
        console.warn('Не удалось сохранить статистику, повторим позже', err);
        ids.forEach(id => dirty.add(id));
        events.unshift(...evs);
        schedule();
      })
      .finally(() => { flushing = null; });
    return flushing;
  },

  getDraft(stepId) {
    try { return localStorage.getItem(DRAFT_PREFIX + stepId); } catch { return null; }
  },

  saveDraft(stepId, code) {
    try { localStorage.setItem(DRAFT_PREFIX + stepId, code); } catch { /* ничего */ }
  }
};

/* Уход со страницы или сворачивание вкладки – отправить накопленное */
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); });
window.addEventListener('pagehide', () => { store.flush(); });
