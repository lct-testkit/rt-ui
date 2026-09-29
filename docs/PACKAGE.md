# rt-ui как пакет: `@lct-testkit/rt-ui`

Библиотека (`src/lib`) собирается `@sveltejs/package` в `dist/` и ставится в SvelteKit/Vite-приложение (например, CRM) как обычный npm-пакет.
Playground, истории, `tools/`, `design/` в пакет **не входят** (в tarball попадают только `dist`, `README.md`, `CHANGELOG.md`, `docs/PACKAGE.md`).

> **Пакет закрытый и должен таким оставаться.** В `dist/styles/fonts` лежит шрифт Rostelecom Basis, а сами стили и токены —
> фирменные материалы Ростелекома. Поля `"private": true` в `package.json` больше нет (с публикацией в GitHub Packages оно бы просто
> блокировало `npm publish` и туда); защита теперь — `publishConfig.registry` на `npm.pkg.github.com` и `access: "restricted"`, а сам
> пакет читают только участники организации `lct-testkit` с токеном (`read:packages`). Публичный npm всё равно недостижим: имя со скоупом
> `@lct-testkit` там никому не принадлежит, `npm publish` без `--registry` уйдёт по `publishConfig` в GitHub Packages, а не в публичный реестр.
> Ставим из GitHub Packages (см. §2, так делают frontend и Docker-образ), либо offline — из tarball, `file:` или git.
> Переименовать пакет: поле `name` в `package.json` + все спецификаторы `@lct-testkit/rt-ui` в приложении (имя tgz строится как `<scope>-rt-ui-<version>.tgz`).

## 1. Сборка

```bash
npm run package        # gen-barrel -> svelte-package (dist/) -> tools/build-package-assets.mjs
npm run package:check  # publint + are-the-types-wrong (профиль esm-only)
npm pack --pack-destination ../   # lct-testkit-rt-ui-0.1.1.tgz (prepack сам запускает npm run package)
```

`build-package-assets` добавляет в `dist/styles`: `rt-ui.min.css` (base + components + tablegrid + tree + side-menu + top-menu, **без тем и шрифта**),
`themes/<тема>.min.css`, копирует шрифты из `src/lib/styles/fonts` (если файлов нет — предупреждение, сборка проходит) и убирает из `.d.ts`
побочные импорты `.css`. Шрифты в git не лежат (лицензия), поэтому **tarball надо собирать на машине, где они есть**.

## 2. Установка

| способ | команда | примечание |
|---|---|---|
| GitHub Packages (реально используется — frontend, Docker-образ) | `.npmrc`: `@lct-testkit:registry=https://npm.pkg.github.com`, токен `//npm.pkg.github.com/:_authToken` (classic PAT, `read:packages`) или `NODE_AUTH_TOKEN` в CI, затем `npm i @lct-testkit/rt-ui@0.1.1` | публикует `release.yml` по тегу `vX.Y.Z`; `access: "restricted"` — читают только участники организации; см. `frontend/.npmrc` |
| tarball | `npm i ../lct-testkit-rt-ui-0.1.1.tgz` | воспроизводимо, шрифты внутри; для offline-стенда без доступа к GitHub Packages; проверено |
| папка | `npm i file:../rt-ui` | симлинк на `dist/` — сначала `npm run package`; проверено (Vite сам дедуплицирует `svelte`) |
| git | `npm i git+ssh://git@host/team/rt-ui.git#v0.1.1` | `dist/` в git нет: npm выполнит `prepare`/`prepack` и соберёт сам (нужны devDependencies); **шрифтов в git нет** — см. §4; способ не проверялся |

Пиры: `svelte ^5`. Зависимости (ставятся сами): `@popperjs/core`, `attr-accept`, `card-validator`, `clsx`, `dayjs`, `imask`, `virtua`.
Для типов нужен `"moduleResolution": "bundler"` (по умолчанию в SvelteKit). Типы проверялись со `strict` и `skipLibCheck: false` — 0 ошибок.

## 3. Минимальный пример

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '@lct-testkit/rt-ui/styles';               // все компоненты + 4 темы + base + шрифт
  import { ThemeProvider } from '@lct-testkit/rt-ui';
  let { children } = $props();
</script>

<ThemeProvider theme="rtk_default_light">{@render children()}</ThemeProvider>
```

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { Button, Input, Select, Checkbox, Modal } from '@lct-testkit/rt-ui';
  import { TableGrid, type TableGridColumn } from '@lct-testkit/rt-ui/components/TableGrid';
  let value = $state('');
</script>

<Input label="Имя" {value} onChange={(e) => (value = (e.target as HTMLInputElement).value)} />
<Button label="Сохранить" size="l" />
```

Компоненты повторяют React-API: `onChange(value)`, `label`, `size`, `variant` и т. д. (не `bind:value`, где React использует `value` + `onChange`).
Контент-пропсы принимают строку или сниппет. Полный список пропсов — в JSDoc/`.d.ts` и в `dist/components/TableGrid/README.md` (таблица).

## 4. CSS, темы, шрифты

| импорт | что даёт |
|---|---|
| `@lct-testkit/rt-ui/styles` | **всё**: 4 темы + components + tablegrid + tree + side-menu + top-menu + fonts + base (~2,3 МБ до сжатия, 137 КБ gzip после сборки Vite) |
| `@lct-testkit/rt-ui/styles/rt-ui.min.css` | минифицированные components + tablegrid + tree + side-menu + top-menu + base, без тем и шрифта |
| `@lct-testkit/rt-ui/themes/rtk_default_light.css` (`.min.css`) | одна тема: `rtk_default_light`, `rtk_default_dark`, `rtk_purple_light`, `rtk_purple_dark` |
| `@lct-testkit/rt-ui/styles/{base,fonts,components,tablegrid,tree,side-menu,top-menu}.css` | отдельные слои |

Стили глобальные и не делятся по компонентам (как в оригинале); tree-shaking работает только для JS.

* **Тема** — один класс на корне: `<ThemeProvider theme="rtk_default_dark">` (`<div class="Theme_root_rtk_default_dark rt-base">`) или класс на `<body>`
  (`src/app.html`: `<body class="Theme_root_rtk_default_light rt-base">` — тема видна уже в SSR-HTML). Вложенные `ThemeProvider` переопределяют тему поддерева;
  попапы в портале сохраняют тему триггера. Фон страницы задайте сами: `background: var(--atmr-bg-page)`.
* **Базовый слой `.rt-base`** (шрифт `--atmr-font-family-body`, цвет текста) — авторское дополнение: оригинальные компоненты шрифт и цвет не задают, а наследуют.
  `ThemeProvider` добавляет его сам (`base={false}` — выключить).
* **Шрифт Rostelecom Basis** — лицензия Ростелекома. В пакет он попадает из `src/lib/styles/fonts/RostelecomBasis-{Regular,Medium,Bold}.woff2|woff` и `Light.woff`
  и лежит в `dist/styles/fonts` (Vite сам хеширует и копирует их в сборку приложения). Если tarball собран без файлов, сборка приложения не падает, а
  печатает `didn't resolve at build time` — тогда подключите шрифт в приложении своим `@font-face` для семейства `'Rostelecom Basis'` (после импорта стилей библиотеки)
  либо импортируйте слои по отдельности (таблица выше) вместо `styles`, заменив `fonts.css` своим.

## 5. SSR (SvelteKit)

Проверено на `adapter-node`: `vite build` + запуск сервера и `vite dev`.

* импорт барреля (`@lct-testkit/rt-ui`, `/ext`, `/icons`; ~1500 экспортов) на сервере не падает: на верхнем уровне модулей нет обращений к `window`/`document`;
* каждый экспорт-компонент (включая все иконки, ~1460 шт.) рендерится через `svelte/server` без пропсов без ошибок; страница с Button, Input, Select, Checkbox,
  Tabs, TableGrid, Modal, Popover, Tooltip, DropdownMenu, Multiselect, Switch, Slider, ThemeProvider и др. отдаёт HTML, гидрация без предупреждений;
* всё, что трогает DOM (портал `use:portal`, `usePopper`, `outsideClick`, `valueCssVariable`), выполняется только в браузере (`$effect`/действия). Открытый на сервере
  попап (`isOpened` уже `true`) выводится в HTML на месте и переносится в `<body>` при гидрации; лучше открывать попапы по действию пользователя;
* `useId()` (хук) — модульный счётчик, id на сервере и клиенте могут не совпасть; в SSR используйте `$props.id()` (так сделаны сами компоненты);
* `Slider`: предупреждение `binding_property_non_reactive` в dev устранено (функциональный `bind:ref` для `thumbRefs`);
* компонентов, требующих `export const ssr = false`, не найдено.

> **Сделано:** CSS авторского расширения разнесён на два файла. `src/lib/ext/layout-modal.css` и `layout-drawer.css` (≈ 1 КБ каждый: `fullHeight` у Modal / Drawer — правила совпадают только при модификаторе
> `rt-ext-modal--full` / `rt-ext-drawer--full`) импортируют сами `Modal.svelte` и `Drawer.svelte` (каждый — свой файл) и они входят в `rt-ui.min.css`; `src/lib/ext/ext.css` (≈ 5 КБ, только движение: Wizard, Toast, Tabs,
> SideMenu) импортируют **только** `ext/index.ts` и `ExtMotionProvider.svelte` — `motion.svelte.ts` (его тянут все оригинальные компоненты) CSS не импортирует. Потребитель без расширения
> не получает ни байта motion-CSS. Проверки: `tools/build-package-assets.mjs` (шаг 6) роняет `npm run package`, если `ext.css` импортирует кто-то, кроме двух допустимых файлов, или попал в
> `rt-ui.min.css`; `node tools/check-ext-css.mjs` собирает три крошечных приложения против `dist/` (без расширения — нет `rt-ext-wizard-step` / `rt-ext-toast` / `rt-ext-tabs` / `rt-ext-side-menu`,
> только `fullHeight`-раскладка при Modal / Drawer; Popover + Tabs — вообще нет `rt-ext-`; с `@lct-testkit/rt-ui/ext` — motion-CSS на месте). Все три файла доступны через `exports`
> одним шаблоном `./ext/*.css` (как `./styles/*`; явные записи для CSS ломают `npm run package:check`: attw не находит для них типов). Проп `motion` без провайдера и без импорта `@lct-testkit/rt-ui/ext` `ext.css` не подключает (нужен для Wizard / Toast / Tabs / SideMenu). Цифры
> `bench:size` пересчитаются при следующем прогоне (`node tools/bench/size.mjs --only s2,s3 --no-marginal --no-barrel`: в CSS сборки не должно быть `rt-ext-`, кроме `rt-ext-modal--full` /
> `rt-ext-drawer--full` в s2). **Открыто:** ускорение монтирования Button/Checkbox/Badge/Typography сделано частично (см. CHANGELOG/отчёт): остаток - спред `{...rest}` (~12 мкс на экземпляр)
> и нативные DOM-операции.

## 6. Tree-shaking и глубокие импорты

`"sideEffects": ["**/*.css"]`: JS не имеет побочных эффектов, неиспользованные компоненты вырезаются. Страница с одной `Button` из барреля — 92 КБ JS (35 КБ gzip,
из них рантайм Svelte), демо с TableGrid/Select/Modal/Input — 281 КБ (96 КБ gzip).

| subpath | пример |
|---|---|
| `.` (баррель: все компоненты, иконки, hooks, utils, actions, константы, `useSelection`) | `import { Button } from '@lct-testkit/rt-ui'` |
| `./components/<путь>.svelte` | `import Button from '@lct-testkit/rt-ui/components/Button/Button/Button.svelte'` |
| `./components/<путь>.js` (constants, types) | `import type { DropdownMenuItem } from '@lct-testkit/rt-ui/components/DropdownMenu/types.js'` |
| `./components/TableGrid` | `import { TableGrid, ActionBar, useSelection, type TableGridColumn } from '@lct-testkit/rt-ui/components/TableGrid'` |
| `./icons`, `./icons/<путь>.svelte` | `import { Search } from '@lct-testkit/rt-ui/icons'`, `.../icons/24/action/AddLarge.svelte` |
| `./hooks`, `./actions`, `./utils` (+ `/<файл>.js`) | `import { usePopper } from '@lct-testkit/rt-ui/hooks'` |
| `./ext` | авторские расширения (§7) |
| `./styles`, `./styles/*`, `./themes/*` | CSS (§4) |

## 7. Авторские расширения (`@lct-testkit/rt-ui/ext`)

Вне оригинала и **выключены по умолчанию**: `ExtMotionProvider`, `Progress`, хуки движения (`useMotion`, `rtSlide`, …), CSS `rt-ext-*`; проп `motion` у Calendar (`PickerDate` / `InputDate`), Accordion,
Tabs, SideMenu и оверлеев (Tween или Spring). Не входят в основной баррель;
пока не подключены и не включены пропом `motion`, DOM и поведение компонентов ровно оригинальные. Подробно: `dist/ext/README.md`
(в примерах там `$lib/ext` — в приложении это `@lct-testkit/rt-ui/ext`).

## 8. TableGrid

Таблица CRM: `import { TableGrid, ActionBar, useSelection } from '@lct-testkit/rt-ui/components/TableGrid'` (или из барреля).
Пропсы и примеры (сортировка, выбор, фильтры, вложенные таблицы, бесконечная прокрутка): `node_modules/@lct-testkit/rt-ui/dist/components/TableGrid/README.md`
(в репозитории `src/lib/components/TableGrid/README.md`; пути `$lib/...` в нём заменяйте на пакет).

## 9. Версии

SemVer, пока `0.x`: минорная версия может менять API. Порядок релиза: поправить `version` в `package.json` и `CHANGELOG.md` → `npm run package:check` → `npm pack`.
Пиксельное соответствие оригиналу проверяется `tools/compare.py` до релиза (см. `docs/DESIGN-SYSTEM-PORT.md`).

## 10. Размеры (0.1.1)

| | |
|---|---|
| tarball | 1,7 МБ (3389 файлов) |
| `dist` | 9,6 МБ: иконки 1,9 · CSS 5,9 (в т. ч. min-копии, шрифты 0,2) · компоненты и код 1,7 |
| приложение-потребитель, всё CSS (`styles`) | 2,3 МБ, 137 КБ gzip |
| приложение-потребитель, JS главной страницы | 281 КБ, 96 КБ gzip |
