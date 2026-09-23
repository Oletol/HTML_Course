/* ------------------------------------------------------------------
   firebase-init.js — единая точка подключения Firebase.

   Что делает: загружает конфиг, инициализирует приложение,
   Authentication и Firestore и реэкспортирует нужные функции SDK.
   Остальные модули импортируют Firebase только отсюда.

   Смена версии SDK: заменить 12.18.0 во всех строках import/export
   этого файла (поиском с заменой) — больше нигде версия не указана.

   Google Analytics не подключается намеренно: статистику курса
   собираем сами, в Firestore.
------------------------------------------------------------------- */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

export const sdkVersion = '12.18.0';

/* Конфиг грузится динамически, чтобы при его отсутствии
   показать понятную ошибку, а не пустую страницу. */
let firebaseConfig;
try {
  ({ firebaseConfig } = await import('./config.js'));
} catch (err) {
  throw new Error(
    'Не найден js/config.js. Скопируйте js/config.example.js в js/config.js ' +
    'и вставьте firebaseConfig из консоли Firebase.'
  );
}
if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
  throw new Error('В js/config.js не заполнены apiKey или projectId.');
}

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const projectId = firebaseConfig.projectId;

/* Authentication */
export {
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';

/* Firestore */
export {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs,
  query, where, orderBy, limit,
  serverTimestamp, increment, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
