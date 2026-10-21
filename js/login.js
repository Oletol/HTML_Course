/* ==================================================================
   login.js – страница входа студента.

   Три состояния:
   1. Профиль уже открыт в этом браузере – «Продолжить».
      Если профиль анонимный (создан до появления входа по email),
      ниже предлагается привязать email и пароль.
   2. «Я здесь впервые» – фамилия, имя, код группы, email, пароль.
   3. «У меня есть профиль» – email и пароль; так студент попадает
      в свой профиль с любого устройства.
   ================================================================== */

import { store, normalizeGroup } from './store.js';

const $ = id => document.getElementById(id);
const form = $('loginForm');
const signinForm = $('signinForm');
const linkForm = $('linkForm');
const resume = $('resume');
const modeSwitch = $('modeSwitch');

const NAME_RE = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё' -]{0,38}[A-Za-zА-Яа-яЁё]$/;
const GROUP_RE = /^[a-z0-9-]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 6; /* минимум Firebase Authentication */

const MSG = {
  email: 'Введите email полностью, например ivanov@mail.ru.',
  password: `Пароль – не короче ${MIN_PASSWORD} знаков.`,
  passwordEmpty: 'Введите пароль.'
};

/* ---------- Ошибки у полей ---------- */
function setError(input, message) {
  const box = $(input.id + 'Error');
  box.textContent = message;
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    const ids = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    ids.add(box.id);
    input.setAttribute('aria-describedby', [...ids].join(' '));
  } else {
    input.removeAttribute('aria-invalid');
  }
  return !message;
}

function focusFirstError(f) {
  f.querySelector('[aria-invalid="true"]')?.focus();
}

/* Общий обработчик ошибок сервера */
function serverMessage(err) {
  if (err.code === 'auth' || err.code === 'rules') {
    const tail = err.code === 'rules' ? ` Код ошибки: ${err.cause?.code || 'нет'}.` : '';
    return err.message + tail;
  }
  return `Нет связи с сервером. Проверьте интернет и попробуйте ещё раз. Код ошибки: ${err.code || 'нет'}.`;
}

async function busy(button, fn) {
  button.disabled = true;
  try { await fn(); } finally { button.disabled = false; }
}

/* ---------- Состояния страницы ---------- */
function showResume(profile) {
  $('resumeName').textContent = profile.displayName;
  const email = store.accountEmail();
  $('resumeAccount').hidden = !email;
  if (email) $('resumeAccount').textContent = `Вход с других устройств: ${email}`;
  resume.hidden = false;
  $('linkBox').hidden = !store.isAnonymous();
  modeSwitch.hidden = true;
  form.hidden = true;
  signinForm.hidden = true;
}

function showMode(mode) {
  resume.hidden = true;
  $('linkBox').hidden = true;
  modeSwitch.hidden = false;
  modeSwitch.querySelectorAll('[data-mode]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  form.hidden = mode !== 'register';
  signinForm.hidden = mode !== 'signin';
}

modeSwitch.addEventListener('click', e => {
  const btn = e.target.closest('[data-mode]');
  if (!btn) return;
  showMode(btn.dataset.mode);
  (btn.dataset.mode === 'register' ? $('lastName') : $('inEmail')).focus();
});

await store.ready();
const profile = store.getProfile();
if (profile) showResume(profile);
else showMode('register');

/* ---------- «Это не я» ---------- */
$('notMe').addEventListener('click', async () => {
  const text = store.isAnonymous()
    ? 'Выйти из профиля? Email к нему не привязан, поэтому вернуться к этому прогрессу потом не получится.'
    : 'Выйти из профиля на этом устройстве? Вернуться к нему можно по email и паролю.';
  if (!confirm(text)) return;
  await store.signOut();
  showMode('signin');
  $('inEmail').focus();
});

/* ---------- Регистрация ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  const last = form.lastName, first = form.firstName, group = form.group;
  const email = $('regEmail'), password = $('regPassword');
  const g = normalizeGroup(group.value);

  const ok = [
    setError(last, NAME_RE.test(last.value.trim()) ? '' : 'Введите фамилию буквами, от 2 до 40 символов.'),
    setError(first, NAME_RE.test(first.value.trim()) ? '' : 'Введите имя буквами, от 2 до 40 символов.'),
    setError(group, GROUP_RE.test(g) ? '' : 'Код группы пишется латиницей и цифрами, без пробелов – так, как его назвал преподаватель.'),
    setError(email, EMAIL_RE.test(email.value.trim()) ? '' : MSG.email),
    setError(password, password.value.length >= MIN_PASSWORD ? '' : MSG.password)
  ].every(Boolean);
  if (!ok) return focusFirstError(form);

  $('formError').textContent = '';
  await busy(form.querySelector('button[type="submit"]'), async () => {
    try {
      await store.saveProfile({
        firstName: first.value, lastName: last.value, group: g,
        email: email.value, password: password.value
      });
      location.href = 'learn.html';
    } catch (err) {
      console.warn(err);
      if (err.code === 'group') setError(group, err.message);
      else if (err.authCode === 'auth/email-already-in-use' || err.authCode === 'auth/credential-already-in-use') setError(email, err.message);
      else if (err.authCode === 'auth/invalid-email') setError(email, err.message);
      else if (err.authCode === 'auth/weak-password') setError(password, err.message);
      else $('formError').textContent = serverMessage(err);
    }
  });
});

/* ---------- Вход в существующий профиль ---------- */
signinForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('inEmail'), password = $('inPassword');
  const ok = [
    setError(email, EMAIL_RE.test(email.value.trim()) ? '' : MSG.email),
    setError(password, password.value ? '' : MSG.passwordEmpty)
  ].every(Boolean);
  if (!ok) return focusFirstError(signinForm);

  $('signinError').textContent = '';
  $('signinInfo').textContent = '';
  await busy(signinForm.querySelector('button[type="submit"]'), async () => {
    try {
      const p = await store.signIn(email.value, password.value);
      if (p) {
        location.href = 'learn.html';
      } else {
        /* Учётная запись есть, а профиля нет (регистрация оборвалась) – дозаполнить */
        showMode('register');
        $('regEmail').value = email.value.trim();
        $('regPassword').value = password.value;
        $('formError').textContent = 'Профиль не заполнен до конца. Введите фамилию, имя и код группы.';
        $('lastName').focus();
      }
    } catch (err) {
      console.warn(err);
      $('signinError').textContent = serverMessage(err);
    }
  });
});

/* ---------- Забыли пароль ---------- */
$('btnReset').addEventListener('click', async () => {
  const email = $('inEmail');
  $('signinError').textContent = '';
  $('signinInfo').textContent = '';
  if (!setError(email, EMAIL_RE.test(email.value.trim()) ? '' : 'Введите email, и мы пришлём на него ссылку для смены пароля.')) {
    return email.focus();
  }
  await busy($('btnReset'), async () => {
    try {
      await store.resetPassword(email.value);
      $('signinInfo').textContent = 'Если такой email зарегистрирован, на него придёт письмо со ссылкой для нового пароля. Проверьте и папку «Спам».';
    } catch (err) {
      console.warn(err);
      $('signinError').textContent = serverMessage(err);
    }
  });
});

/* ---------- Привязка email к анонимному профилю ---------- */
linkForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('linkEmail'), password = $('linkPassword');
  const ok = [
    setError(email, EMAIL_RE.test(email.value.trim()) ? '' : MSG.email),
    setError(password, password.value.length >= MIN_PASSWORD ? '' : MSG.password)
  ].every(Boolean);
  if (!ok) return focusFirstError(linkForm);

  $('linkFormError').textContent = '';
  await busy(linkForm.querySelector('button[type="submit"]'), async () => {
    try {
      const p = await store.linkAccount(email.value, password.value);
      showResume(p);
      $('resumeAccount').textContent = `Готово. Теперь с других устройств входите по ${store.accountEmail()} и паролю.`;
      resume.querySelector('.btn--primary').focus();
    } catch (err) {
      console.warn(err);
      if (err.authCode === 'auth/weak-password') setError(password, err.message);
      else if (err.authCode === 'auth/invalid-email' || err.authCode === 'auth/email-already-in-use' || err.authCode === 'auth/credential-already-in-use') setError(email, err.message);
      else $('linkFormError').textContent = serverMessage(err);
    }
  });
});
