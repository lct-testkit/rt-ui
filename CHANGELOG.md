# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии — [SemVer](https://semver.org/lang/ru/) (до 1.0 минорные версии могут менять API).

## [Unreleased]

### Исправлено

- **InputDate (период, `isRange`) — те же строгие правила, что у одиночной даты.** Маска каждого из двух концов только расставляет точки, текст разбирается `getDateRangeTextStatus`: `31.02`, месяц `13`, год из 2 цифр в любом из концов — ошибка поля («Такой даты нет», «Введите год полностью», «Введите дату полностью»), а не молчаливая поправка; конец раньше начала — ошибка «Конец периода раньше начала» (раньше концы молча менялись местами). Пока текст с ошибкой, наружу уходит `onChange(undefined, undefined)`, а набранный текст не стирается. Выбор в календаре не менялся. `onInvalid` теперь работает и у периода.
- InputDate: курсор в поле после отпускания клавиши ставился по длине текста на момент нажатия — при быстром наборе цифры периода ложились не на свои места; длина читается при установке курсора.
- **Подписи для скринридера — по-русски.** `aria-label` «Clear» → «Очистить» (Input, TextArea, Multiselect), «open» → «Открыть список» (Multiselect), «Input-right-icon» → «Действие» (кнопка-иконка Input; календарь InputDate — «Открыть календарь»), «breadcrumbs dividermenu» → «Скрытые разделы», «Slider marks» / «Mark at N» → «Метки» / «Метка N», «grid» → «Дерево». У иконок-кнопок без названия появились: «Предыдущий/Следующий месяц/год/день» (календарь), «Предыдущая/Следующая страница» (Pagination), «Уменьшить/Увеличить» (InputNumberStepper, Stepper), «Удалить» (закрытие тега). Поле поиска внутри Multiselect названо по `label` (без него — «Поиск»), поля периода InputDate — «Начало периода» / «Конец периода». У декоративной иконки в конце Input лишний `aria-label` на `<div>` убран.
- **Button больше не ставит всем кнопкам `id="button"`** (невалидный HTML, ломал связки по id): без `id` атрибута нет, свой `id` проходит как раньше.

### Добавлено

- Свои названия кнопок вместо русских по умолчанию: `clearLabel` (Input, TextArea, Multiselect), `iconSuffixLabel` (Input), `openLabel` и `searchLabel` (Multiselect), `moreLabel` (Breadcrumbs).
- **SideMenuItem: проп `href`.** Пункт — настоящая ссылка: поверх строки лежит пустой `<a href>` (`.atmr-side-menu__link`), строка остаётся `<li>` и выглядит так же; средняя кнопка, Ctrl/⌘-клик, «открыть в новой вкладке» и Enter работают как у любой ссылки. Обычный клик по-прежнему идёт в `onclick` (приложение переходит само, переход браузера отменяется), без `onclick` ссылку открывает браузер. Имя ссылки — `aria-label` / `title` пункта или текст подписи; выбранный пункт — `aria-current="page"`. Без `href` пункт как раньше.

## [0.1.2] — 2026-10-21

### Исправлено

- **InputDate (одиночная дата) больше не подменяет набранное молча.** `31.02.2026` оставалось в поле как `03.03.2026`, месяц `13` становился `12`, `01.01.26` показывалось в поле, но даты не было. Теперь маска только расставляет точки и пускает цифры, а текст разбирается строго (`getDateTextStatus`): несуществующая дата — ошибка «Такой даты нет», год короче четырёх цифр — «Введите год полностью», недописанная дата — «Введите дату полностью» (как остальные правила Input: после ухода из поля). Пока текст не дата, поле не хранит «старую» дату за кадром: `onChange(undefined)`. Период (`isRange`) остался на прежней маске.
- InputDate: Ctrl+A → Backspace удалял один символ (после отпускания клавиши курсор принудительно уходил в конец и снимал выделение) — выделение больше не сбрасывается.
- Темы: у `--atmr-font-family-base` добавлен системный шрифт как запасной — без файлов Rostelecom Basis интерфейс остаётся читаемым (во всех четырёх темах).
- e2e: убрана гонка в готовности страницы `/ext` перед визуальным скриншотом.

### Добавлено

- InputDate: проп `onInvalid(message | null)` (одиночная дата) — сообщение об ошибке набранного текста или `null`; форма по нему не сохраняет поле, в котором есть текст, но нет даты.

### Инфраструктура (CI/CD)

- Все workflow'ы (`ci.yml`, `release.yml`, `visual-baseline.yml`) идут на self-hosted раннере `[self-hosted, lct]` (aarch64): у организации отключён биллинг GitHub Actions; `playwright install` без `--with-deps` (на раннере нет пароля к sudo).
- Добавлен файл `LICENSE` (исходный код доступен для ознакомления).

## [0.1.1] — 2026-09-25

### Добавлено (авторские расширения `@lct-testkit/rt-ui/ext`, вне оригинала, выключены по умолчанию)

- Второй этап движения на Svelte (проп `motion`): **Calendar** (`PickerDate` / `InputDate`: смена месяца / года со сдвигом и fade по направлению, смена вида, подписи шапки, мягкое выделение
  дня / периода), **Accordion** (высота `Tween` / `Spring` + fade контента, плавный рост содержимого), **Tabs** (один скользящий индикатор, появление панели), **SideMenu** (ширина панели и подписи,
  закрытое состояние после движения, вложенные списки). Исправление `.rt-base` для переноса подписей SideMenu не тронуто.
- `useShowMotion` понимает тип движения `spring` (Svelte `Spring`): оверлеи «вырастают» на пружине, Drawer — критически демпфированной; общий движок `Driver`, пресеты `SPRING`.
- Демо `/ext` (блоки «Календарь», «Accordion», «Tabs», «SideMenu», режим «Svelte · Spring» у оверлеев), `tools/ext-check.py --only second`, `tools/ext-check-overlays.py` (Spring), `tools/check-ext-css.mjs`.

### Инфраструктура (CI/CD)

- Публикация: пакет больше не `private` — `publishConfig` закрепляет **GitHub Packages** (`npm.pkg.github.com`, `access: restricted`); релиз по тегу `vX.Y.Z` (`release.yml`) требует зелёный `ci.yml`,
  версию тега = `package.json`, непустую секцию в `CHANGELOG.md`, публикует пакет и создаёт GitHub Release с заметками из changelog. `frontend` ставит `@lct-testkit/rt-ui@<версия>` из реестра.
- Проверки: ESLint (`npm run lint`) и stylelint (`npm run lint:styles`) в режиме **храповика** (число замечаний ограничено `--max-warnings` в `package.json`; новый «сырой» hex-цвет или новое замечание роняет CI),
  Vitest (`npm test`: SSR-рендер компонентов, целостность публичных экспортов), `npm audit`, визуальные регрессии собственных эталонов (`npm run test:visual`, эталоны создаёт workflow `visual-baseline`).
- Исправлено: `tools/gen-barrel.mjs` сортировал пути по-разному на Windows и Linux (разделитель `\` против `/`), из-за чего баррель, сгенерированный на Windows, расходился с закоммиченным и ломал CI
  (`git diff --exit-code src/lib/index.ts`). Теперь порядок — по путям с `/`, побайтово, одинаково на любой ОС.
- Убран мусор из git: `tools/__pycache__`, `tools/_*.txt` (добавлены в `.gitignore`).

### Изменено

- `ext.css` разделён: **движение** (`ext.css`) импортируют только `@lct-testkit/rt-ui/ext` и `ExtMotionProvider`; крошечная раскладка `fullHeight` (`ext/layout-modal.css` / `ext/layout-drawer.css`) — сами `Modal` и `Drawer`
  (и `rt-ui.min.css`). Потребитель без расширения больше не получает motion-CSS через `Modal` / `Popover` / …; `exports`: шаблон `./ext/*.css`. `npm run package` проверяет это (шаг 6
  `tools/build-package-assets.mjs`). Проп `motion` без провайдера требует одного `import '@lct-testkit/rt-ui/ext'` для Wizard / Toast / Tabs / SideMenu.

## [0.1.0] — 2026-09-20

Первая версия, пригодная для установки как пакет `@lct-testkit/rt-ui` (приватный: `"private": true`, в публичный npm не публикуется).

### Добавлено

- Пакет: `svelte-package` → `dist/` (JS, `.svelte`, `.d.ts` для каждого компонента и баррели), поля `svelte`, `types`, `exports`, `files`, `sideEffects: ["**/*.css"]`,
  пир `svelte ^5`, зависимости — только реально импортируемые (`@popperjs/core`, `attr-accept`, `card-validator`, `clsx`, `dayjs`, `imask`, `virtua`).
- Точки входа: `.` (баррель), `./ext`, `./icons`, `./components/*`, `./components/TableGrid`, `./hooks`, `./actions`, `./utils`, `./styles`, `./styles/*`, `./themes/*`.
- `npm run package`, `prepack`, `package:check` (publint + are-the-types-wrong).
- `tools/build-package-assets.mjs`: `dist/styles/rt-ui.min.css`, `themes/*.min.css`, копирование шрифтов, чистка `.d.ts` от CSS-импортов.
- Баррель (`tools/gen-barrel.mjs`) реэкспортирует публичные точки компонентных папок (`TableGrid`: `useSelection`, константы, типы).
- `docs/PACKAGE.md`: установка, CSS/темы/шрифты, SSR, tree-shaking, расширения.

### Исправлено

- `ListItemProps`: тип `prefix` конфликтовал с унаследованным `HTMLAttributes` (ошибка в `.d.ts` при `skipLibCheck: false`).

### Проверено

- Приложение-потребитель (SvelteKit + `adapter-node`, установка из tarball): `vite build`, SSR всех экспортов без ошибок, интерактив (Select, сортировка TableGrid, Modal, Checkbox),
  светлая и тёмная темы, загрузка шрифта, `svelte-check` (strict, `skipLibCheck: false`) — 0 ошибок.
