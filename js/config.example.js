/* ------------------------------------------------------------------
   Шаблон конфигурации Firebase.

   Локально: скопируйте этот файл в js/config.js и вставьте значения
   из консоли Firebase (Project settings → General → Your apps → Config).
   js/config.js в .gitignore и в репозиторий не попадает.

   На GitHub Pages js/config.js собирается автоматически из секрета
   репозитория FIREBASE_CONFIG (см. .github/workflows/pages.yml).

   Эти значения не секретны: они видны в браузере каждого посетителя.
   Данные защищают правила Firestore (firebase/firestore.rules).
------------------------------------------------------------------- */
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
