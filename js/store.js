/* ==================================================================
   store.js – профиль, прогресс и события студента в Firestore.

   Интерфейс тот же, что у локальной версии, плюс ready():
     await ready()                      – дождаться восстановления входа
     getProfile()                       – профиль или null
     isAnonymous()                      – вход без email (только это устройство)
     accountEmail()                     – email входа или null
     saveProfile({firstName, lastName, group, email, password})
     signIn(email, password)            – вход в существующий профиль
     linkAccount(email, password)       – привязать email к анонимному профилю
     resetPassword(email)               – письмо для смены пароля
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

   Вход. Студент сначала входит анонимно (так можно прочитать код
   группы), затем к этой же учётной записи привязываются email
   и пароль (linkWithCredential). UID при привязке не меняется,
   поэтому прогресс остаётся на месте, а правила Firestore менять
   не нужно. На другом устройстве студент входит по email и паролю
   и попадает в тот же профиль.

   Схема:
     students/{uid}                      сводка для панели преподавателя
     students/{uid}/progress/{stepId}    прогресс по шагу
     students/{uid}/eventBatches/{auto}  события пачками
   ================================================================== */

import {
  auth, db,
  signInAnonymously, signInWithEmailAndPassword, sendPasswordResetEmail,
  linkWithCredential, EmailAuthProvider, onAuthStateChanged, signOut as fbSignOut,
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

/* Письма Firebase (смена пароля) – на русском */
auth.languageCode = 'ru';

const nowIso = () => new Date().toISOString();
const clone = o => JSON.parse(JSON.stringify(o ?? null));

export function normalizeGroup(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

/* Понятные сообщения для ошибок Firebase Authentication */
function authError(err) {
  const map = {
    'auth/invalid-credential': 'Неверный email или пароль.',
    'auth/wrong-password': 'Неверный email или пароль.',
    'auth/user-not-found': 'Неверный email или пароль.',
    'auth/invalid-email': 'Email записан с ошибкой.',
    'auth/missing-password': 'Введите пароль.',
    'auth/weak-password': 'Пароль слишком простой: нужно не меньше 6 знаков.',
    'auth/email-already-in-use': 'Этот email уже занят другим профилем. Если это ваш профиль, войдите по нему.',
    'auth/credential-already-in-use': 'Этот email уже занят другим профилем. Если это ваш профиль, войдите по нему.',
    'auth/provider-already-linked': 'К этому профилю email уже привязан.',
    'auth/too-many-requests': 'Слишком много попыток. Подождите несколько минут и попробуйте снова.',
    'auth/network-request-failed': 'Нет связи с сервером. Проверьте интернет.',
    'auth/operation-not-allowed': 'Вход по email выключен в настройках Firebase. Сообщите преподавателю.'
  };
  const e = new Error(map[err?.code] || 'Не удалось войти. Попробуйте ещё раз.');
  e.code = 'auth';
  e.authCode = err?.code;
  e.cause = err;
  return e;
}

async function readProfile(u) {
  try {
    const snap = await getDoc(doc(db, 'students', u.uid));
    return snap.exists() ? { uid: u.uid, ...snap.data() } : null;
  } catch (err) {
    console.warn('Профиль не загружен', err);
    return null;
  }
}

/* ---------- Вход ---------- */
const readyPromise = new Promise(resolve => {
  const stop = onAuthStateChanged(auth, async u => {
    stop();
    user = u;
    if (u) profile = await readProfile(u);
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

  isAnonymous() { return !!user?.isAnonymous; },

  accountEmail() { return user?.email || null; },

  /* Регистрация: анонимный вход, проверка группы, привязка email, профиль */
  async saveProfile({ firstName, lastName, group, email, password }) {
    email = String(email || '').trim().toLowerCase();
    /* Вошли по другому email (чужая сессия на общем компьютере) – начать заново */
    if (user && !user.isAnonymous && user.email !== email) {
      await fbSignOut(auth);
      user = null;
    }
    if (!user) user = (await signInAnonymously(auth)).user;
    const displayName = `${lastName.trim()} ${firstName.trim()}`;
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName,
      nameKey: displayName.toLowerCase().replace(/ё/g, 'е'),
      group: normalizeGroup(group),
      email,
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
    /* Привязка email и пароля к той же учётной записи (UID не меняется) */
    if (user.isAnonymous) {
      try {
        user = (await linkWithCredential(user, EmailAuthProvider.credential(email, password))).user;
      } catch (err) {
        throw authError(err);
      }
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

  /* Вход в существующий профиль с любого устройства */
  async signIn(email, password) {
    try { await store.flush(); } catch { /* ничего */ }
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, String(email).trim().toLowerCase(), password);
    } catch (err) {
      throw authError(err);
    }
    user = cred.user;
    progress = {}; dirty = new Set(); events = [];
    profile = await readProfile(user);
    return profile;
  },

  /* Привязать email и пароль к уже созданному анонимному профилю */
  async linkAccount(email, password) {
    if (!user || !profile) throw authError({ code: 'auth/user-not-found' });
    email = String(email).trim().toLowerCase();
    try {
      user = (await linkWithCredential(user, EmailAuthProvider.credential(email, password))).user;
    } catch (err) {
      throw authError(err);
    }
    /* Email – в сводку, чтобы преподаватель видел, у кого вход настроен */
    try {
      await setDoc(doc(db, 'students', user.uid), { email }, { merge: true });
      profile.email = email;
    } catch (err) {
      console.warn('Email не записан в профиль', err);
    }
    return profile;
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, String(email).trim().toLowerCase());
    } catch (err) {
      throw authError(err);
    }
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
