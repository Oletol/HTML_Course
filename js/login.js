/* ==================================================================
   login.js – вход студента: фамилия, имя, код группы.
   Если профиль уже есть, предлагает продолжить.
   ================================================================== */

import { store, normalizeGroup } from './store.js';

const form = document.getElementById('loginForm');
const resume = document.getElementById('resume');
const profile = store.getProfile();

if (profile) {
  document.getElementById('resumeName').textContent = profile.displayName;
  resume.hidden = false;
  form.hidden = true;
}

document.getElementById('notMe').addEventListener('click', async () => {
  const ok = confirm('Выйти из профиля? Прогресс на этом компьютере будет удалён.');
  if (!ok) return;
  await store.signOut();
  resume.hidden = true;
  form.hidden = false;
  document.getElementById('lastName').focus();
});

const NAME_RE = /^[A-Za-zА-Яа-яЁё][A-Za-zА-Яа-яЁё' -]{0,38}[A-Za-zА-Яа-яЁё]$/;
const GROUP_RE = /^[a-z0-9-]{3,20}$/;

function setError(input, message) {
  const box = document.getElementById(input.id + 'Error');
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

form.addEventListener('submit', async e => {
  e.preventDefault();
  const last = form.lastName, first = form.firstName, group = form.group;
  const g = normalizeGroup(group.value);

  const ok = [
    setError(last, NAME_RE.test(last.value.trim()) ? '' : 'Введите фамилию буквами, от 2 до 40 символов.'),
    setError(first, NAME_RE.test(first.value.trim()) ? '' : 'Введите имя буквами, от 2 до 40 символов.'),
    setError(group, GROUP_RE.test(g) ? '' : 'Код группы пишется латиницей и цифрами, без пробелов – так, как его назвал преподаватель.')
  ].every(Boolean);

  if (!ok) {
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  await store.saveProfile({ firstName: first.value, lastName: last.value, group: g });
  location.href = 'learn.html';
});
