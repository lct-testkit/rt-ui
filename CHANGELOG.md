# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/), версии — [SemVer](https://semver.org/lang/ru/) (до 1.0 минорные версии могут менять API).

## [Unreleased]

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
