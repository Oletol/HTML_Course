/* ==================================================================
   store.js – хранилище профиля, прогресса и событий.

   Сейчас: локальная версия (localStorage). На шаге 4 этот файл
   заменяется версией для Firestore с ТЕМ ЖЕ набором функций,
   поэтому остальной код менять не придётся.

   Интерфейс:
     getProfile()                      – профиль или null
     saveProfile({firstName, lastName, group})
     signOut()
     loadProgress()                    – { [stepId]: {...} }
     updateStep(stepId, patch)         – patch = { set, inc, max, incMap }
     logEvent(type, stepId, data)
     getDraft(stepId) / saveDraft(stepId, code)  – черновики всегда локальные
   ================================================================== */

const KEY = 'html-sandbox:v1';
const DRAFT_PREFIX = 'html-sandbox:draft:';
const MAX_EVENTS = 500;

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function writeAll(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch { /* хранилище недоступно или переполнено: работаем без сохранения */ }
}

let data = readAll();
data.progress ??= {};
data.events ??= [];

function nowIso() { return new Date().toISOString(); }

export function normalizeGroup(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

export const store = {
  mode: 'local',

  getProfile() {
    return data.profile || null;
  },

  async saveProfile({ firstName, lastName, group }) {
    const displayName = `${lastName.trim()} ${firstName.trim()}`;
    data.profile = {
      uid: data.profile?.uid || `local-${crypto.randomUUID?.() || Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName,
      nameKey: displayName.toLowerCase().replace(/ё/g, 'е'),
      group: normalizeGroup(group),
      createdAt: data.profile?.createdAt || nowIso()
    };
    writeAll(data);
    return data.profile;
  },

  async signOut() {
    data = { progress: {}, events: [] };
    writeAll(data);
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(DRAFT_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ничего */ }
  },

  async loadProgress() {
    return structuredClone(data.progress);
  },

  /* patch.set    – записать значения полей
     patch.inc    – прибавить к числовым полям
     patch.max    – записать, если новое значение больше
     patch.incMap – прибавить к полям внутри словаря: { failedChecks: { doctype: 1 } } */
  async updateStep(stepId, { set = {}, inc = {}, max = {}, incMap = {} } = {}) {
    const p = data.progress[stepId] ?? { createdAt: nowIso() };
    Object.assign(p, set);
    for (const [k, v] of Object.entries(inc)) p[k] = (p[k] || 0) + v;
    for (const [k, v] of Object.entries(max)) p[k] = Math.max(p[k] ?? -Infinity, v);
    for (const [k, map] of Object.entries(incMap)) {
      p[k] ??= {};
      for (const [kk, vv] of Object.entries(map)) p[k][kk] = (p[k][kk] || 0) + vv;
    }
    p.updatedAt = nowIso();
    data.progress[stepId] = p;
    writeAll(data);
    return structuredClone(p);
  },

  logEvent(type, stepId, payload = {}) {
    data.events.push({ type, stepId, ts: nowIso(), data: payload });
    if (data.events.length > MAX_EVENTS) data.events.splice(0, data.events.length - MAX_EVENTS);
    writeAll(data);
  },

  getDraft(stepId) {
    try { return localStorage.getItem(DRAFT_PREFIX + stepId); }
    catch { return null; }
  },

  saveDraft(stepId, code) {
    try { localStorage.setItem(DRAFT_PREFIX + stepId, code); }
    catch { /* ничего */ }
  }
};
