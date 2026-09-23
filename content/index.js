/* ==================================================================
   content/index.js – программа песочницы.

   Модуль, в нём разделы, в разделах шаги. Порядок в этом файле = порядок прохождения.
   У шага:
     id    – глобальный и неизменный (по нему хранится статистика!)
     title – название в программе
     file  – путь к файлу шага от папки content/; нет file – шаг «скоро»
     type  – 'lesson' (по умолчанию) или 'assignment' (итоговая работа)

   Новые модули (JavaScript, дизайн-разборы) добавляются сюда
   так же: новый объект в modules и папка content/<id>/.

   Доступ: порядок шагов действует внутри модуля. Модуль с полем
   requires открывается, когда пройдены все учебные шаги модуля,
   указанного в requires. Итоговые работы (type: 'assignment')
   доступ к следующему модулю не блокируют.
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
          { id: 'html-16', title: 'Язык и локализация', file: 'html/html-16.js' },
          { id: 'html-17', title: 'Доступность', file: 'html/html-17.js' },
          { id: 'html-18', title: 'Голова документа', file: 'html/html-18.js' }
        ]
      },
      {
        title: 'Итоговая работа',
        steps: [
          { id: 'html-19', title: 'Свой сайт на чистом HTML', type: 'assignment', file: 'html/html-19.js' }
        ]
      }
    ]
  },
  {
    id: 'css1',
    title: 'CSS: оформление',
    requires: 'html',
    sections: [
      {
        title: 'Основы',
        steps: [
          { id: 'css-01', title: 'Подключение и синтаксис', file: 'css/css-01.js' },
          { id: 'css-02', title: 'Селекторы и классы' },
          { id: 'css-03', title: 'Каскад, наследование, специфичность' },
          { id: 'css-04', title: 'Современные селекторы' },
          { id: 'css-05', title: 'Сброс стилей и методология БЭМ' }
        ]
      },
      {
        title: 'Цвет и типографика',
        steps: [
          { id: 'css-06', title: 'Цвет и фон' },
          { id: 'css-07', title: 'Пользовательские свойства и темы' },
          { id: 'css-08', title: 'Шрифты' },
          { id: 'css-09', title: 'Размер и единицы' },
          { id: 'css-10', title: 'Текст и абзац' }
        ]
      },
      {
        title: 'Блочная модель',
        steps: [
          { id: 'css-11', title: 'Блочная модель и логические свойства' },
          { id: 'css-12', title: 'Отображение и поток' },
          { id: 'css-13', title: 'Декоративные эффекты' }
        ]
      }
    ]
  },
  {
    id: 'css2',
    title: 'CSS: раскладка и интерфейс',
    requires: 'css1',
    sections: [
      {
        title: 'Раскладка',
        steps: [
          { id: 'css-14', title: 'Flexbox: оси и выравнивание' },
          { id: 'css-15', title: 'Flexbox: гибкость и перенос' },
          { id: 'css-16', title: 'Grid: колонки и промежутки' },
          { id: 'css-17', title: 'Grid: области и авторазмещение' },
          { id: 'css-18', title: 'Позиционирование' }
        ]
      },
      {
        title: 'Адаптивность',
        steps: [
          { id: 'css-19', title: 'Медиазапросы и mobile-first' },
          { id: 'css-20', title: 'Контейнерные запросы' },
          { id: 'css-21', title: 'Гибкие размеры' },
          { id: 'css-22', title: 'Адаптивные изображения' }
        ]
      },
      {
        title: 'Формы и интерфейс',
        steps: [
          { id: 'css-23', title: 'Оформление полей' },
          { id: 'css-24', title: 'Собственные флажки и переключатели' }
        ]
      },
      {
        title: 'Состояния и движение',
        steps: [
          { id: 'css-25', title: 'Состояния интерактивных элементов' },
          { id: 'css-26', title: 'Переходы, анимация, плавная прокрутка' }
        ]
      },
      {
        title: 'Итоговая работа',
        steps: [
          { id: 'css-27', title: 'Оформление своего сайта', type: 'assignment' }
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
          moduleRequires: m.requires || null,
          sectionTitle: sec.title
        });
      }
    }
  }
  return out;
}
