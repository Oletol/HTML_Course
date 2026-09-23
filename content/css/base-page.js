/* ==================================================================
   content/css/base-page.js – учебная страница курса.

   Открывается в модулях CSS у студента, который не сдал последний
   учебный шаг модуля HTML. Структура та же, что у страницы студента
   после модуля HTML: header с навигацией, main с разделами, footer.
   ================================================================== */

export const BASE_PAGE = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Главная – Центр изучения диалектов</title>
    <meta name="description" content="Учебный сайт о моём проекте: задачи, материалы, расписание и форма записи на занятия.">
    <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#1A40E7">
    <meta property="og:title" content="Главная – Центр изучения диалектов">
    <meta property="og:description" content="Учебный сайт о моём проекте, свёрстанный на HTML.">
    <meta property="og:image" content="https://oletol.github.io/HTML_Course/assets/img/globe.svg">
  </head>
  <body>
    <header>
      <a href="#content">Перейти к основному содержанию</a>
      <h1 style="color: #1A40E7;">Центр изучения диалектов</h1>
      <nav aria-label="Разделы страницы">
        <ul>
          <li><a href="#section-1">О проекте</a></li>
          <li><a href="#section-main">Как принять участие</a></li>
        </ul>
      </nav>
    </header>

    <main id="content">
      <section>
        <h2 id="section-1">О проекте</h2>
        <p style="color: #14161E; background-color: rgb(231 234 253);">Первый абзац раздела: что это за проект и для кого он создан.</p>
        <h3>Подробности</h3>
        <p>Абзац подраздела с уточняющими сведениями.</p>
      </section>
      <section>
        <h2 id="section-main">Как принять участие</h2>
        <p>Абзац второго раздела с описанием следующего шага для посетителя.</p>
        <p>Занятие длится два часа. <strong style="color: darkred;">Запись закрывается за сутки до начала.</strong></p>
        <p>Предварительная подготовка <em>не</em> требуется.</p>
        <p>Руководитель проекта повторяет: <q>лучше один раз попробовать самому</q>.</p>
        <blockquote>
          <p>Текст развёрнутой цитаты по теме проекта.</p>
        </blockquote>
        <p>Автор цитаты, должность или источник</p>
        <p>В стоимость входит:</p>
        <ul>
          <li>материалы
            <ul>
              <li>основной материал</li>
              <li>дополнительные материалы</li>
            </ul>
          </li>
          <li>инструменты</li>
          <li>консультация специалиста</li>
        </ul>
        <p>Как принять участие:</p>
        <ol>
          <li>Выберите удобную дату.</li>
          <li>Заполните форму записи.</li>
          <li>Дождитесь подтверждения.</li>
        </ol>
        <p>Источник по теме: <a href="https://ru.wikipedia.org/wiki/Лингвистика" target="_blank" rel="noopener noreferrer">статья «Лингвистика» в Википедии (откроется в новой вкладке)</a>.</p>
        <figure>
          <img src="assets/img/dialogue.svg" width="800" height="600" alt="Две реплики диалога: «Привет» и «Hello»">
          <figcaption>Одна и та же реплика в русском и английском тексте</figcaption>
        </figure>
        <img src="assets/img/globe.svg" width="800" height="600" loading="lazy" alt="Глобус с метками языков RU, EN, ZH и AR">
        <video width="640" height="360" poster="assets/media/poster.jpg" controls>
          <source src="assets/media/lingua.webm" type="video/webm">
          <source src="assets/media/lingua.mp4" type="video/mp4">
          <track src="assets/media/lingua.ru.vtt" kind="subtitles" srclang="ru" label="Русский" default>
          <track src="assets/media/lingua.en.vtt" kind="subtitles" srclang="en" label="English">
          <p>Видео не воспроизводится. <a href="assets/media/lingua.mp4">Скачать видео, MP4, 130 КБ</a></p>
        </video>
        <audio src="assets/media/chime.mp3" controls>
          Звуковой фрагмент не воспроизводится. <a href="assets/media/chime.mp3">Скачать звук, MP3</a>
        </audio>
        <iframe src="assets/embed/schedule.html" title="Расписание консультаций" width="600" height="260" loading="lazy" sandbox></iframe>
        <p><a href="assets/embed/schedule.html">Расписание консультаций на отдельной странице</a></p>
        <table>
          <caption>Расписание консультаций</caption>
          <thead>
            <tr>
              <th scope="col">День</th>
              <th scope="col">Время</th>
              <th scope="col">Формат</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Вторник</th>
              <td>15:00–16:30</td>
              <td>очно</td>
            </tr>
            <tr>
              <th scope="row">Четверг</th>
              <td>18:00–19:00</td>
              <td>онлайн</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section id="faq">
        <h2>Частые вопросы</h2>
        <details name="faq" open>
          <summary>Нужна ли предварительная подготовка?</summary>
          <p>Нет, участие рассчитано на начинающих.</p>
        </details>
        <details name="faq">
          <summary>Сколько длится одно занятие?</summary>
          <p>Полтора часа, включая время на вопросы.</p>
        </details>
        <details name="faq">
          <summary>Можно ли присоединиться в середине курса?</summary>
          <p>Да, материалы прошедших занятий доступны на сайте.</p>
        </details>
      </section>
      <section id="signup">
        <h2>Запись</h2>
        <form action="https://example.org/signup" method="post">
          <p>
            <label for="name">Имя (обязательное поле)</label>
            <input type="text" id="name" name="name" autocomplete="name" required minlength="2">
          </p>
          <p>
            <label for="email">Электронная почта (обязательное поле)</label>
            <input type="email" id="email" name="email" autocomplete="email" required>
          </p>
          <p>
            <label for="phone">Телефон в формате +7XXXXXXXXXX</label>
            <input type="tel" id="phone" name="phone" autocomplete="tel"
                   pattern="\+7[0-9]{10}" title="Знак + и 11 цифр без пробелов, например +79001234567">
          </p>
          <p>
            <label for="date">Желаемая дата</label>
            <input type="date" id="date" name="date" min="2026-10-01" max="2026-12-25">
          </p>
          <p>
            <label for="format">Формат участия</label>
            <select id="format" name="format">
              <option value="offline">Очно</option>
              <option value="online">Онлайн</option>
              <option value="record">В записи</option>
            </select>
          </p>
          <p>
            <label for="topic">Интересующая тема</label>
            <input type="text" id="topic" name="topic" list="topics">
            <datalist id="topics">
              <option value="Фонетика"></option>
              <option value="Лексика"></option>
              <option value="Грамматика"></option>
            </datalist>
          </p>
          <fieldset>
            <legend>Удобное время</legend>
            <label><input type="radio" name="time" value="morning" checked> Утро</label>
            <label><input type="radio" name="time" value="evening"> Вечер</label>
          </fieldset>
          <p>
            <label for="message">Комментарий, не больше 500 знаков</label>
            <textarea id="message" name="message" rows="4" maxlength="500"></textarea>
          </p>
          <button type="submit">Отправить заявку</button>
        </form>
      </section>
      <section id="languages">
        <h2>Языки и источники</h2>
        <p>Рабочее название исследования – <span lang="en">Language in Context</span>.</p>
        <p>Записи размечены в программе <span translate="no">ELAN</span>, требования к доступности сайта – по стандарту <abbr title="Web Content Accessibility Guidelines">WCAG</abbr>.</p>
        <p>Ближайший семинар – <time datetime="2026-11-17T18:30">17 ноября в 18:30</time>.</p>
        <p>Справочный материал: <a href="https://en.wikipedia.org/wiki/Linguistics" hreflang="en" lang="en">Linguistics – Wikipedia</a></p>
      </section>
    </main>

    <footer>
      <p><span aria-hidden="true">✉</span> Связаться с автором проекта: <a href="mailto:info@example.org">info@example.org</a></p>
    </footer>
  </body>
</html>`;
