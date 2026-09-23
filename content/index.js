/* ==================================================================
   content/index.js – программа песочницы.

   Модуль, в нём разделы, в разделах шаги. Порядок в этом файле = порядок прохождения.
   У шага:
     id    – глобальный и неизменный (по нему хранится статистика!)
     title – название в программе
     file  – путь к файлу шага от папки content/; нет file – шаг «скоро»
     type  – 'lesson' (по умолчанию) или 'assignment' (итоговая работа)

   Новые модули (CSS, JavaScript, дизайн-разборы) добавляются сюда
   так же: новый объект в modules и папка content/<id>/.
   ================================================================== */

export const modules = [
  {
    id: 'html',
    title: 'HTML',
    sections: [
      {
        title: 'Документ и текст',
        steps: [
          { id: 'html-01', title: 'Скелет документа', file: 'html/html-01.js' },
          { id: 'html-02', title: 'Заголовки и абзацы', file: 'html/html-02.js' },
          { id: 'html-03', title: 'Смысловое выделение', file: 'html/html-03.js' },
          { id: 'html-04', title: 'Списки', file: 'html/html-04.js' },
          { id: 'html-05', title: 'Цвет', file: 'html/html-05.js' }
        ]
      },
      {
        title: 'Связи и медиа',
        steps: [
          { id: 'html-06', title: 'Ссылки', file: 'html/html-06.js' },
          { id: 'html-07', title: 'Изображения', file: 'html/html-07.js' },
          { id: 'html-08', title: 'Аудио и видео', file: 'html/html-08.js' },
          { id: 'html-09', title: 'Встраивание', file: 'html/html-09.js' }
        ]
      },
      {
        title: 'Структура',
        steps: [
          { id: 'html-10', title: 'Семантические блоки', file: 'html/html-10.js' },
          { id: 'html-11', title: 'Таблицы', file: 'html/html-11.js' },
          { id: 'html-12', title: 'Раскрывающиеся блоки', file: 'html/html-12.js' }
        ]
      },
      {
        title: 'Формы',
        steps: [
          { id: 'html-13', title: 'Основа формы', file: 'html/html-13.js' },
          { id: 'html-14', title: 'Типы полей и списки', file: 'html/html-14.js' },
          { id: 'html-15', title: 'Встроенная проверка', file: 'html/html-15.js' }
        ]
      },
      {
        title: 'Локализация',
        steps: [
          { id: 'html-16', title: 'Язык и локализация' },
          { id: 'html-17', title: 'Доступность' },
          { id: 'html-18', title: 'Голова документа' }
        ]
      },
      {
        title: 'Итоговая работа',
        steps: [
          { id: 'html-19', title: 'Свой сайт на чистом HTML', type: 'assignment' }
        ]
      }
    ]
  }
];

/* Плоский список шагов с номерами и принадлежностью */
export function flatSteps() {
  const out = [];
  for (const m of modules) {
    let n = 0;
    const total = m.sections.reduce((s, sec) => s + sec.steps.length, 0);
    for (const sec of m.sections) {
      for (const st of sec.steps) {
        n++;
        out.push({
          ...st,
          type: st.type || 'lesson',
          ready: Boolean(st.file),
          n, total,
          moduleId: m.id,
          moduleTitle: m.title,
          sectionTitle: sec.title
        });
      }
    }
  }
  return out;
}
