<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
# rt-ui/ext — авторские расширения (движение на Svelte)

> **Авторское расширение — вне оригинала.** Всё, что лежит в `src/lib/ext/` и помечено `[ext, not in original]`, **не является
> частью дизайн-системы Rostelecom Atomaro**. Расширения **выключены по умолчанию**: без провайдера и без пропа `motion`
> оригинальные компоненты рендерят *тот же самый DOM* и ведут себя *ровно так же*, как оригинал. Это доказывается
> попиксельным сравнением с React Storybook (`tools/compare.py`, сторисы slider / stepper / wizard / оверлеи / pickerdate / inputdate / accordion / tabs /
> sidemenu) — они проходят так же, как до появления расширений.

## Правила

| правило | что это значит |
|---|---|
| Выключено по умолчанию | нет `ExtMotionProvider` и нет `motion` → оригинальный путь (для Modal/Popover/… это react-transition-group-подобные последовательности классов, для Slider/Wizard — мгновенные изменения) |
| Оригинал не меняется | при выключенном режиме тот же DOM, те же классы, те же inline-стили; никаких дополнительных атрибутов и классов |
| Помечено | каждый файл расширения начинается с баннера `/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */`, JSDoc пропа начинается с `[ext, not in original]` |
| Пространство имён | новые компоненты — только в `src/lib/ext/`, классы `rt-ext-*` (никогда `atmr-*`) |
| Токены | цвета, шрифт, отступы, скругления, длительности и кривые — из `var(--atmr-...)`, поэтому работают все 4 темы; расширенные компоненты (`Progress`) сами задают шрифт и цвет текста и выглядят правильно и без базового слоя `.rt-base` |
| `prefers-reduced-motion` | при `reduce` анимации отключены **всегда** — даже если `motion` включён явно |
| Svelte-native | значения двигают `Tween` / `Spring` (`svelte/motion`), появление/исчезновение — `transition:` / `animate:` (`svelte/transition`, `svelte/animate`); CSS-`transition` не используется. Единственное исключение — бесконечная анимация `indeterminate` у `Progress` (CSS keyframes, при `prefers-reduced-motion` статична) |

## Файлы

```
src/lib/ext/
  README.md                   этот файл
  index.ts                    единая точка импорта: `import { ExtMotionProvider, Progress, useMotion, rtSlide } from '$lib/ext'` (подключает и `ext.css`)
  motion.svelte.ts            ядро: useMotion, useMotionValue, getMotionMode, usePressTracker, токены длительностей/кривых (CSS не импортирует)
  driver.svelte.ts            `Driver`: одно число, которое ведёт Svelte `Tween` ИЛИ `Spring` (по типу движения) — движок хуков ниже; пресеты `SPRING`, `springSettleMs`
  ExtMotionProvider.svelte    глобальный переключатель ('off' | 'svelte') + переопределения по «видам» (kind); подключает `ext.css`
  transitions.ts              пресеты Svelte-переходов: rtFade, rtScale, rtFly, rtSlide, rtShift (+ rtFlip для animate:)
  toastMotion.ts              сторона появления Toast по `position`: toastFlyOffset (используется ToastNotificationsProvider)
  showMotion.svelte.ts        появление/исчезновение оверлеев (Tween или Spring → inline opacity/scale/translate): useShowMotion, originFromPlacement
  calendarMotion.svelte.ts    календарь: usePageNav (направление), useTextSwap (подписи шапки), softHighlight (выделение дня / периода)
  collapseMotion.svelte.ts    высота сворачиваемых блоков: useCollapseMotion (Accordion, SideMenuCollapse, SideMenuExpandContent)
  indicatorMotion.svelte.ts   скользящий индикатор: useIndicatorMotion (подчёркивание активной вкладки Tabs)
  sideMenuMotion.svelte.ts    ширина панели и подписи SideMenu: useSideMenuMotion
  tableMotion.svelte.ts       TableGrid: createTableMotion / useTableMotion (контекст таблицы), FLIP · появление · уход строк, иконки, цвет, hover; Svelte-переходы tableRowOut, tableSlide (CSS не нужен)
  Progress/Progress.svelte    новый авторский индикатор прогресса (линейный и круговой)
  ext.css                     ТОЛЬКО движение: стили для оригинальных элементов в расширенном состоянии (классы rt-ext-*); импортируют лишь index.ts и ExtMotionProvider
  layout-modal.css            крошечная «всегда безопасная» раскладка: `fullHeight` у Modal; импортирует сам Modal
  layout-drawer.css           то же для Drawer; импортирует сам Drawer
src/routes/ext/               демо (маршрут /ext)
src/routes/ext/table/         демо таблицы (маршрут /ext/table): переключатель «без провайдера / выкл / Tween / Spring», 30 / 200 строк, сортировка, фильтр, страницы, выбор, раскрытие, добавление
tools/ext-check-table.py      проверка движения таблицы (Playwright): DOM и геометрия «без расширения = выкл = вкл после анимации», запуск анимаций, reduced-motion, virtual; `--perf` — стоимость
tools/ext-check.py            проверка поведения в браузере (Playwright); `--only second` — только второй этап (календарь / accordion / tabs / sidemenu)
tools/ext-check-overlays.py   то же для оверлеев: Popover / Tooltip / DropdownMenu / Select / Multiselect / Modal / Drawer (Tween и Spring)
tools/check-ext-css.mjs       что получает потребитель собранного пакета: без расширения — ни байта motion-CSS
tools/check-ext-ssr.mjs       рендер на сервере (svelte/server) компонентов с `motion`: без провайдера, Tween и Spring — падений быть не должно
```

В оригинальных компонентах сделаны минимальные «крючки», которые работают только при включённом `motion`:
`Slider` (проп `motion`, доп. проп `display` у `SliderThumb`), `WizardStepsHorizontal` / `StepItemHorizontal`
(проп `motion`, доп. поле `motion` в контексте) и `ToastNotificationsProvider` (проп `motion` провайдера и отдельного уведомления, см. «Toast»), а также на семейство оверлеев: `Popover`, `Tooltip`, `DropdownMenu`
(и через него `Select` / `Multiselect`), `Modal`, `Drawer`, `Overlay` (проп `motion`, см. «Оверлеи»). Второй этап: `PickerDate` / `InputDate` («Календарь»), `Accordion` /
`AccordionDetails` («Accordion»), `TabsGroup` / `TabsPanel` («Tabs»), `SideMenu` / `SideMenuCollapseContent` / `SideMenuExpandContent` («SideMenu») — у каждого проп `motion`,
всё **вне оригинала** и **выключено по умолчанию**. Третий этап: `TableGrid` (проп `motion`, «TableGrid»). `Stepper` — это контрол «−/+» без прогресс-полосы, анимировать в нём нечего.

## Как это работает

Приоритет настроек: **проп `motion` компонента → переопределение провайдера для этого вида → `mode` провайдера → выключено**.
Затем всё фильтруется `prefers-reduced-motion`.

```svelte
<script>
  import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
  import Slider from '$lib/components/Slider/Slider.svelte';
  import Progress from '$lib/ext/Progress/Progress.svelte';
</script>

<!-- всё как в оригинале -->
<Slider value={[30]} />

<ExtMotionProvider mode="svelte" type="spring" overrides={{ wizard: false }}>
  <Slider value={[30]} />                      <!-- наследует: Spring -->
  <Slider value={[30]} motion={false} />       <!-- свой проп сильнее: оригинал -->
  <Progress value={40} motion="tween" />       <!-- свой проп сильнее: Tween -->
  <Progress value={40} motion={{ type: 'tween', duration: 800, easing: 'expressive-standard' }} />
</ExtMotionProvider>
```

### `<ExtMotionProvider>`

Не создаёт DOM, только раздаёт настройки потомкам через контекст Svelte (вложенный провайдер заменяет внешний).

| проп | тип | по умолчанию | описание |
|---|---|---|---|
| `mode` | `'off' \| 'svelte'` | `'off'` | `'off'` — оригинальное поведение; `'svelte'` — Svelte-движение |
| `type` | `'tween' \| 'spring'` | `'tween'` | движок значений по умолчанию (для `mode: 'svelte'`) |
| `options` | `MotionOptions` | `{}` | опции по умолчанию (длительность, кривая, жёсткость…) для всех компонентов |
| `overrides` | `Partial<Record<MotionKind, MotionProp \| 'off' \| 'svelte'>>` | `{}` | настройка по видам, например `{ slider: 'spring', modal: false }` |

`MotionKind` — `'slider' \| 'progress' \| 'wizard' \| 'modal' \| 'drawer' \| 'popover' \| 'tooltip' \| 'dropdown' \| 'toast' \| 'accordion' \| 'tabs' \| 'calendar' \| 'sidemenu' \| 'table-rows'` или любая своя строка.

### Проп `motion` (Slider, WizardStepsHorizontal, Progress, оверлеи, Календарь, Accordion, Tabs, SideMenu)

| значение | смысл |
|---|---|
| не задан (`undefined`) | **по умолчанию**: наследуется от `ExtMotionProvider`; без провайдера — выключено |
| `false` | выключено (оригинал), даже если провайдер включён |
| `true` | включено, движок по умолчанию провайдера (`tween`) |
| `'tween'` / `'spring'` | включено с этим движком |
| `{ type?, duration?, delay?, easing?, stiffness?, damping?, precision? }` | включено с опциями (`MotionOptions`) |

`MotionOptions`:

| поле | по умолчанию | описание |
|---|---|---|
| `type` | `'tween'` | `'tween'` или `'spring'` |
| `duration` | `'m'` (300 мс) | миллисекунды или токен `'2xs' 100, 'xs' 150, 's' 200, 'm' 300, 'l' 600, 'xl' 1200` (`--atmr-motion-duration-*`) |
| `delay` | `0` | задержка, мс (Tween) |
| `easing` | `'productive-standard'` | функция `(t) => t` или токен (`--atmr-motion-easing-*`): `linear`, `productive-standard \| entrance \| exit \| bouncing`, `expressive-standard \| entrance \| exit \| bouncing` |
| `stiffness` | `0.15` | жёсткость пружины, 0..1 (Spring) |
| `damping` | `0.8` | затухание пружины, 0..1 (Spring) |
| `precision` | `0.01` | точность «успокоения» пружины (в единицах компонента; у Slider/Progress — проценты) |

Каждый хук расширения знает, какие из этих опций **заданы** пользователем (`ResolvedMotion.set`), а какие подставлены по умолчанию, и берёт для своего вида движения собственные разумные значения
(например, высота аккордеона — 'm' 300 мс и «замедляющаяся» кривая, индикатор Tabs — 'm' и `productive-standard`, пружина оверлеев — из `SPRING`), пока вы явно не задали `duration` / `easing` /
`stiffness` / `damping` в `motion` или в `options` провайдера — тогда действует ваше значение.

### Что делают расширенные компоненты

| компонент | что анимируется | детали |
|---|---|---|
| `Slider` | ползунки, заливка трека (и «зажигание» точек), число в подсказке | клик по треку — плавный «проезд»; **перетаскивание мгновенное** (пока указатель нажат на ползунке или движется); клавиатура плавная. С включённым `motion` проп `value` **следит** за внешними изменениями (в оригинале `value` — только начальное значение); `onChange` вызывается только для действий пользователя. `aria-valuenow` всегда настоящее значение |
| `WizardStepsHorizontal` | соединительная линия «заливается» слева направо, когда этап становится пройденным | при первом показе линия не «едет»; при выключенном режиме — исходная смена цвета |
| `Progress` | ширина полосы / дуга кольца при смене `value`, число в процентах | новый компонент, см. ниже |
| `ToastNotificationsProvider` (Toast) | появление / исчезновение уведомлений и перестроение стопки | Svelte-переходы `in:` / `out:rtFly` + `animate:rtFlip`, см. «Toast» |
| `Popover`, `Tooltip`, `DropdownMenu` (+ `Select`, `Multiselect`) | открытие / закрытие всплывающего окна | scale + fade из угла по `placement` (Tween или Spring), см. «Оверлеи» |
| `Modal`, `Drawer`, `Overlay` | открытие / закрытие окна, выезд панели, fade оверлея | fade + scale окна, выезд панели от края `position`, см. «Оверлеи» |
| `PickerDate`, `InputDate` | смена месяца / года, смена вида, подписи шапки, выделение дня и периода | **вне оригинала**, см. «Календарь» |
| `Accordion` / `AccordionDetails` | высота содержимого + fade и сдвиг контента, плавное «доезжание» при смене содержимого | **вне оригинала**, см. «Accordion» |
| `TabsGroup` / `TabsPanel` | одна линия-индикатор «переезжает» между вкладками, панель проявляется | **вне оригинала**, см. «Tabs» |
| `SideMenu` (+ `SideMenuCollapseContent`, `SideMenuExpandContent`) | ширина панели и подписи, раскрытие вложенных списков | **вне оригинала**, см. «SideMenu» |
| `TableGrid` | строки при сортировке / фильтре / смене страницы (FLIP, появление, уход), раскрытие строки, панель действий, стрелка сортировки и шеврон, цвет и hover строки | **вне оригинала**, см. «TableGrid» |
| переходы `rt*` | появление/исчезновение блоков | см. «Переходы» |

### `Progress`

```svelte
<Progress value={40} label="Загрузка" showValue />
<Progress variant="circular" size="l" colorScheme="success" value={72} showValue motion="spring" />
<Progress indeterminate />
```

| проп | тип | по умолчанию | описание |
|---|---|---|---|
| `value` | `number` | `0` | значение от 0 до `max` |
| `max` | `number` | `100` | максимум |
| `variant` | `'linear' \| 'circular'` | `'linear'` | полоса или кольцо |
| `size` | `'s' \| 'm' \| 'l'` | `'m'` | размер (токены `--atmr-spacing-*`) |
| `label` | `Content` | — | подпись (строка или snippet); строка также попадает в `aria-label` |
| `showValue` | `boolean` | `false` | показать проценты |
| `indeterminate` | `boolean` | `false` | бесконечная анимация (CSS); при `prefers-reduced-motion` — без анимации |
| `colorScheme` | `'accent' \| 'neutral' \| 'success' \| 'error'` | `'accent'` | цвета из токенов темы |
| `motion` | `MotionProp` | наследуется | анимация изменения значения |

Корень — `div.rt-ext-progress[role=progressbar]` c `aria-valuemin/max/now`; на корне также `data-motion="off|tween|spring"`.

## Для авторов компонентов

```ts
import { useMotion, useMotionValue, getMotionMode } from '$lib/ext/motion.svelte.js';

let { motion } = $props();                                   // проп компонента: MotionProp
const m = useMotion(() => motion, 'slider');                 // вызывать при инициализации компонента
m.requested   // расширение включено (проп/провайдер), независимо от prefers-reduced-motion
m.enabled     // requested && !prefers-reduced-motion  → можно анимировать
m.config      // ResolvedMotion | null (тип, длительность, кривая, жёсткость…)
m.transition({ y: 24 })   // параметры для пресетов переходов: { enabled: m.enabled, y: 24 }

// значение, которое плавно догоняет цель (число или number[]); при выключенном режиме current === target
const anim = useMotionValue(() => target, () => m.config, () => dragging /* необязательно: обход сглаживания */);
anim.current

getMotionMode('modal')   // 'off' | 'svelte' — режим провайдера на момент вызова (без учёта пропа и reduced-motion)
```

`useMotionValue` — обёртка над `new Tween(...)` / `new Spring(...)` (`svelte/motion`; также доступны `Tween.of(() => v)` и
`Spring.of(() => v)`, но они не переключаются между режимами в рантайме). Пока движение выключено, ничего не создаётся,
`current` — это сама цель без задержки на кадр.

### Toast (`ToastNotificationsProvider`)

Проп `motion` есть у `ToastNotificationsProvider` и у отдельного уведомления (`addNotification({ …, motion })`, `addCustomNotification`); значения те же,
что у `MotionProp` (`false` — выключено, `true` — включено). Приоритет: **`motion` уведомления → `motion` провайдера → `overrides.toast` / `mode`
`ExtMotionProvider` → выключено**. Выключено (по умолчанию) — оригинальная разметка и react-transition-group-подобные классы, попиксельно как в React
(сторис `components-notification-*` проходят `tools/compare.py`).

Включено: стопка рисуется Svelte-переходами (каждый тост в `div.rt-ext-toast-item`, сам тост получает класс `rt-ext-toast`, естественную высоту вместо
`height: 0` + inline-высоты):

| что | как |
|---|---|
| появление | `in:rtFly` — со стороны `position` (`topRight` → справа и сверху, `bottomLeft` → слева и снизу, `*Center` → только по вертикали) + fade, `'m'` · `expressive-entrance` |
| исчезновение | `out:rtFly` — улетает обратно к своей стороне + fade, `'s'` · `expressive-exit` |
| остальные тосты | `animate:rtFlip` — плавно едут на новое место при появлении и исчезновении тостов |

`prefers-reduced-motion: reduce` — переходы нулевой длины. Если в одном контейнере смешаны включённые и выключенные уведомления, контейнер рисуется расширенной
разметкой, а выключенные появляются мгновенно; для предсказуемого результата задавайте `motion` на провайдере. Демо — блок «Toast» на `/ext`.

### Оверлеи (`Popover`, `Tooltip`, `DropdownMenu`, `Modal`, `Drawer`, `Overlay`)

Проп `motion` (JSDoc `[ext, not in original]`) есть у `Popover`, `Tooltip`, `DropdownMenu`, `Modal`, `Drawer` и `Overlay`; значения те же, что у `MotionProp`
(`false` — выключено, `true` / `{ duration, easing, delay }` — включено). Приоритет: **`motion` компонента → `overrides.<kind>` провайдера → `mode`
провайдера → выключено**; `kind`: `popover`, `tooltip`, `dropdown`, `modal`, `drawer` (у отдельного `Overlay` — `overlay`, внутри Modal / Drawer он берёт
`modal` / `drawer`). `Select` и `Multiselect` построены на `DropdownMenu` и получают анимацию меню «бесплатно» от `ExtMotionProvider` (своего пропа `motion`
у них нет; чтобы включить только для одного — обернуть его во вложенный `<ExtMotionProvider mode="svelte">`).

**Выключено (по умолчанию)** — оригинал без изменений: тот же DOM, те же классы и inline-стили, react-transition-group-подобные последовательности
классов у Modal / Drawer / Overlay / Tooltip (`atmr-modal-enter-active`, `atmr-drawer--entering` …) и мгновенное появление у Popover / DropdownMenu. Это
проверяет `tools/compare.py` (сторисы popover / tooltip / dropdownmenu / select / multiselect / modal / drawer).

**Включено** — вместо CSS-классов и мгновенного показа работает Svelte-`Tween` или `Spring` (`svelte/motion`, по типу движения) из `showMotion.svelte.ts`. Оверлеи остаются в DOM
(Popover, Tooltip, DropdownMenu) или живут до `unmountOnExit` (Modal, Drawer), поэтому `{#if}`-переход тут не годится: прогресс (0 = скрыт, 1 = показан)
пишет в элемент **inline** `opacity`, `scale`, `translate` и `transform-origin` (индивидуальные CSS-свойства, `transform` Popper'а и самих компонентов
не трогаются) и после окончания возвращает всё как было (лишний пустой `style` тоже убирается) — итоговый DOM и пиксели равны оригинальным.

| компонент | появление | исчезновение |
|---|---|---|
| `Popover`, `DropdownMenu` (`Select`, `Multiselect`) | scale 0.95 → 1 + fade, `'s'` 200 мс · `productive-entrance` | обратно, `'s'` 200 мс · `productive-exit`; меню и список остаются в DOM до конца |
| `Tooltip` | то же; `enterDelay` / `leaveDelay` сохраняются (анимация стартует после задержки, `visibility` остаётся до конца выхода) | то же |
| `Modal` | окно: fade + scale 0.96 → 1 + сдвиг 16 px, `'m'` 300 мс · `expressive-entrance`; оверлей: fade | `'s'` 200 мс · `expressive-exit`; обёртка не скрывается (`--hidden`), пока идёт выход |
| `Drawer` | панель выезжает от края `position` (`translate` ±100 %), `'m'` · `expressive-entrance`; оверлей: fade | уезжает обратно, `'s'` · `expressive-exit` |
| `Overlay` | fade до собственной прозрачности варианта (50 % / 30 %), `'m'` | `'s'` |

* **`transform-origin` по `placement`.** Popover / Tooltip / меню растут из стороны, обращённой к триггеру (`bottom-start` → левый верхний угол, `top` →
  центр нижней грани, `right-end` → левый нижний …; `originFromPlacement(placement)`). Индивидуальное `scale` применяется *снаружи* `transform`, поэтому
  обычный `transform-origin: left top` «уводил» бы окно вслед за `translate(x, y)` Popper'а; хук пересчитывает origin в пиксели с поправкой на
  `translate` элемента (то же для центрированного Modal), и угол-якорь стоит на месте. Origin обновляется на каждом кадре, если Popper перевернул placement.
* **Длительность и кривая.** Значения по умолчанию — из таблицы (токены `--atmr-motion-*`); объект `motion={{ duration: 700, easing: 'linear', delay }}`
  задаёт их для обоих направлений (опции провайдера `options` тоже действуют). **Тип движения** — `Tween` по умолчанию; с `type: 'spring'` (`<ExtMotionProvider type="spring">`,
  `motion="spring"` или `motion={{ type: 'spring', stiffness, damping }}`) прогресс ведёт Svelte-`Spring` (`Driver`, `driver.svelte.ts`): `scale` и `translate` следуют за пружиной
  (небольшой «перелёт» и успокоение у Popover / Tooltip / меню / Modal — `SPRING.lively`, у Drawer критически демпфированная `SPRING.smooth`: панель не заезжает за свой край),
  `opacity` ограничена 0..1. Значения по умолчанию подобраны прогоном той же интеграции, что у Svelte (`springSettleMs`): `smooth` 0.2 / 0.75 — без перелёта, ~300 мс; `lively` 0.1 / 0.45 —
  ~1 % перелёта, ~370 мс, fade ~150 мс (у Svelte по умолчанию 0.15 / 0.8 — заметно медленнее, ~480 мс). `show.enter()` / `exit()` возвращают оценку времени успокоения.
* **Modal / Drawer: тайминги.** Включённый режим заменяет `transitionProps.timeout` длительностью анимации (колбэки `onEntering` / `onEntered` / `onExit` …
  вызываются как раньше), а `entering` / `exiting` у Drawer отрисовываются как `entered` (CSS-keyframes `drawerKeyframes*` не запускаются). Если
  `transitionProps` требует оригинального автомата (`mountOnEnter: false`, `unmountOnExit: false`, `enter: false`, `exit: false`), Modal / Drawer работают по
  оригинальному пути даже при включённом `motion`.
* **Что меняется в DOM, пока идёт анимация** (и только тогда): inline `opacity` / `scale` / `translate` / `transform-origin` / `transition: none` на анимируемом
  элементе, `data-show="true"` у Popover / меню до конца выхода, классы `--entering` / `--exiting` у Drawer не появляются, у Modal нет `atmr-modal-enter` /
  `-active` / `-exit`. После — как в оригинале.
* **`prefers-reduced-motion: reduce`** — путь оригинала (классы Modal / Drawer, мгновенные Popover / Tooltip / меню).
* **Конечное состояние закрытого окна.** Оригинальный Popover / меню при закрытии сразу становятся `display: none`, и Popper пересчитывает их позицию «скрытыми»;
  с включённым режимом окно скрывается после выхода, и после него Popper обновляется ещё раз (`onExited`), поэтому `transform` закрытого окна тот же, что у оригинала.
  У Tooltip окно всегда в раскладке (`visibility: hidden`), лишний пересчёт не нужен; `transition-delay` для `visibility` выставляется до первого пересчёта стилей,
  чтобы затухание шло, пока тултип ещё `visible` (в конце значение возвращается к оригинальному).

```svelte
<ExtMotionProvider mode="svelte">
  <Popover title="Заголовок" body="…"><Button label="Открыть" /></Popover>     <!-- вырастает из угла -->
  <Select items={items} />                                                       <!-- меню тоже анимируется -->
  <Modal isOpened={open} isCentered onClose={() => (open = false)}>…</Modal>
  <Drawer isOpened={side} position="left" onClose={() => (side = false)}>…</Drawer>
  <Popover motion={false} …>…</Popover>                                          <!-- своё значение сильнее: оригинал -->
</ExtMotionProvider>
```

### `fullHeight` у Drawer и Modal (опция автора, не анимация)

`fullHeight?: boolean` (по умолчанию `false`, JSDoc `[ext, not in original]`): в оригинале панель `Drawer` (`.atmr-drawer__content`) ровно такой высоты, как её
содержимое, и «висит» от верхнего края экрана. С `fullHeight` панель `left` / `right` занимает всю высоту окна (содержимое прокручивается внутри), у `top` /
`bottom` — всю ширину. У `Modal` окно растягивается до высоты экрана с сохранением отступов `marginTop` сверху и снизу (учитывается явный `maxHeight`), тело
прокручивается внутри.

Реализовано модификаторами `rt-ext-drawer--full` (на корне `.atmr-drawer`) и `rt-ext-modal--full` (на окне `.atmr-modal`) и правилами в `src/lib/ext/layout-modal.css` / `layout-drawer.css` (два отдельных крошечных файла, которые импортируют сами Modal и Drawer; `ext.css` с движением они не подтягивают);
ни одно правило `atmr-*` не менялось. Без пропа (или с `false`) DOM и классы **те же, что в оригинале** (сторисы drawer / modal проходят `tools/compare.py`).
Не зависит от `motion` — работает и с ним, и без.

```svelte
<Drawer isOpened={open} position="right" dimension={420} fullHeight onClose={close}>…</Drawer>
<Modal isOpened={open} isCentered fullHeight onClose={close}>…</Modal>
```

Для авторов: `useShowMotion({ m, node, scale?, origin?, offset?, opacity?, in?, out?, spring?, prop? })` (`showMotion.svelte.ts`) — `show.enter({ delay?, restart? })` /
`show.exit({ delay? })` возвращают длительность в мс (`0` — режим выключен, ничего не сделано), `show.exiting` — реактивный флаг «идёт выход»
(держать элемент показанным, пока он `true`), `show.durationIn()` / `durationOut()` — для таймаутов автомата. `restart: true` начинает с «скрытой» позы, даже если
предыдущее появление ещё идёт. Движок всех императивных хуков — `Driver` (`driver.svelte.ts`): `d.go(to, leg)` возвращает промис «успокоился» (у прерванного движения он не
разрешается), `d.jump(v)`, `d.freeze()`, `d.value` реактивно; `legOf(cfg)`, `SPRING.smooth` / `SPRING.lively`, `springSettleMs(stiffness, damping)`.

### Календарь (`PickerDate`, `InputDate`) — вне оригинала, выключено по умолчанию

Проп `motion` (JSDoc `[ext, not in original]`) есть у `PickerDate` и `InputDate` (у `InputDate` он передаётся и в `Popover`, и в `PickerDate`); `kind`: `calendar` (всплывающее окно
`InputDate` — `popover`). **Выключено (по умолчанию)** — оригинал: месяц и год меняются «на месте» (сетка не пересоздаётся), выделение мгновенное — DOM тот же (сторисы
pickerdate / inputdate проходят `tools/compare.py`). **Включено** (`calendarMotion.svelte.ts`, `transitions.ts`):

| что | как |
|---|---|
| смена месяца / года / дня (стрелки `‹ ›`) | сетка `.atmr-calendar__calendar` обёрнута в `{#key}`; новая `in:rtShift`, старая `out:rtShift` — уезжает в противоположную сторону, гаснет и на время анимации становится `position: absolute` (оставаясь на месте и в своих размерах), поэтому размер календаря не «прыгает»; направление (`‹` / `›`) — из сравнения новой страницы со старой (`usePageNav`), `'m'` 300 мс · `productive-standard`, сдвиг 20 px |
| подписи шапки (месяц, год, дата) | сдвигаются и проявляются с той же стороны (`useTextSwap` → `useShowMotion`: inline `opacity` / `translate`, после — убираются) |
| смена вида (день ⇄ месяц ⇄ год) | весь `Calendar` пересоздаётся: его сетка «приближается» (`in:rtShift|global` c `kind: 'zoom'`, scale 0.97 → 1 + fade), бокс календаря (фон, рамка) остаётся непрозрачным |
| выделенный день / период | ячейка, у которой появилось выделение, «проявляется» (`softHighlight`: Tween inline `opacity` 0.4 → 1 и, у краёв периода, `scale` 0.88 → 1); ушедшее выделение и уже выделенные ячейки не анимируются |
| всплывающее окно `InputDate` | оверлейное движение `Popover` (scale + fade из угла по `placement`) — проп или провайдер |

Списки лет и времени не пересоздаются (сохраняется прокрутка): анимируются подписи и смена вида. **После анимации DOM тот же, что у оригинала** (лишние
inline-стили убираются), `motion={{ duration: 900 }}` задаёт длительность, `prefers-reduced-motion: reduce` — путь оригинала. Пока идёт смена страницы, в DOM две сетки — учитывайте это в тестах.
Демо — блок «Календарь» на `/ext` (`?cal=off|svelte|page`).

### Accordion (`Accordion`, `AccordionDetails`) — вне оригинала, выключено по умолчанию

Проп `motion` есть у `Accordion` (наследуют вложенные `AccordionDetails`) и у `AccordionDetails` (свой сильнее); `kind`: `accordion`. Оригинал уже двигает высоту inline-CSS-`transition` внутри
react-transition-group-подобного автомата — это **выключенный** путь, он не менялся (`tools/compare.py`, сторисы `patterns-recipes-accordion`). **Включено** (`collapseMotion.svelte.ts`): высоту обёртки
ведёт Svelte `Tween` (или `Spring`, `SPRING.smooth`) — открытие `'m'` 300 мс · `expressive-entrance` (замедляющаяся), закрытие `'s'` · `productive-standard`; содержимое проявляется и «съезжает» на 8 px
(inline `opacity` / `translate` внутреннего блока); пока открыт, рост содержимого (добавили строку, раскрылся вложенный список) **плавно доезжает** до новой высоты. Пока идёт движение, inline
`transition: none`; автомат получает конец движения через `addEndListener` (а не по таймеру), поэтому `hidden` / `aria-hidden` / `visibility` выставляются ровно после закрытия. После — DOM оригинала:
`height: <n>px; overflow: hidden; transition: <исходный>; visibility: visible` / `height: 0px … hidden`. Шеврон рисует **потребитель** (в оригинальных сторисах у него свой inline-CSS-transition поворота, компонент
своего шеврона не имеет) — в демо при включённом движении угол ведёт `useMotionValue`. Демо — блок «Accordion» (`?acc=off|svelte|page`).

### Tabs (`TabsGroup`, `TabsPanel`) — вне оригинала, выключено по умолчанию

Проп `motion` есть у `TabsGroup` (индикатор) и `TabsPanel` (появление панели); `kind`: `tabs`. В оригинале у **каждой** вкладки своё подчёркивание (`::after`, CSS-`transition` ширины) —
путь «выкл» не менялся (сторисы `components-tabs`). **Включено** (`indicatorMotion.svelte.ts`): в `.atmr-tabs-group__tabs` добавляется **один** `span.rt-ext-tabs-indicator[aria-hidden]`, `TabsGroup`
получает класс `rt-ext-tabs` (правило в `ext.css` прячет `::after` выбранной вкладки по `opacity`, цвет и высота линии — те же токены `--atmr-tabitem-*-highlight-*`); хук пишет inline `left` / `top` /
`width` / `height` индикатора: первое размещение и смена раскладки той же вкладки (ресайз, шрифт) — мгновенно, смена **вкладки** — `Tween` (`'m'` · `productive-standard`) или `Spring` (`SPRING.lively`,
небольшой перелёт и успокоение), незавершённое движение продолжается из текущей позиции. `TabsPanel` при включённом движении появляется `in:rtFly` (fade + сдвиг вверх на 8 px, `'s'`). Итоговый DOM = оригинал
**плюс** индикатор и класс (это документированное отличие), а **попиксельно** выбранные вкладки совпадают с оригиналом (проверяет `ext-check`). Демо — блок «Tabs» (`?tabs=off|svelte|page`).

### SideMenu — вне оригинала, выключено по умолчанию

Проп `motion` есть у `SideMenu` (наследуют вложенные `SideMenuCollapseContent` и `SideMenuExpandContent`, у которых он есть и отдельно); `kind`: `sidemenu`. Оригинал переключает два класса
(`atmr-side-menu--opened` 256 px / `--closed` 56 px), ширина едет CSS-`transition`, а подписи рисуются / удаляются мгновенно (`{#if isMenuOpen}` в каждом пункте) — этот путь не менялся (сторисы
`patterns-recipes-sidemenu` и `topmenu-topwithsidemenu`). Исправление автора для переноса подписей (`.rt-base` в `base.css`) **остаётся как есть**. **Включено** (`sideMenuMotion.svelte.ts`):

* один `Tween` / `Spring` (`SPRING.smooth`) ведёт inline `width` панели (`transition: none` на время движения; целевая ширина берётся из CSS переключением классов без отрисовки) и CSS-переменную
  `--rt-ext-sm-label` (0..1) — прозрачность и сдвиг **всех** подписей (правила в `ext.css`, действуют, пока у панели класс `rt-ext-side-menu--motion`);
* при открытии подписи проявляются, когда для них появилось место; при закрытии — гаснут **до** сужения панели, а закрытое состояние (`isMenuOpen`, классы, удаление подписей) отрисовывается
  только **после** движения (`menu.open` остаётся `true`, пока панель закрывается);
* вложенные группы (`SideMenuCollapse`) и блок `SideMenuExpandContent` раскрываются так же, как Accordion (`useCollapseMotion`, высота + fade; у блока `height: auto` и `overflow: visible` после).

После движения — DOM оригинала (inline-стили и класс `rt-ext-side-menu--motion` убираются; inline `transition` возвращается на кадр позже, чтобы не «доезжали» доли пикселя). Шеврон пунктов
вращает оригинальный CSS (`.atmr-side-menu__chevron`) — он не менялся. Демо — блок «SideMenu» (`?sm=off|svelte|page`).

### TableGrid — вне оригинала, выключено по умолчанию

Проп `motion` у `TableGrid` (`true` / `false` / `'tween'` / `'spring'` / объект `MotionOptions` + переключатели `rows`, `expand`, `actionBar`, `icons`, `highlight`, `hover`, пороги `maxRows` (300) и `maxExpandRows` (80));
`kind`: `table-rows` — им же переключаются **все** движения таблицы (`overrides={{ 'table-rows': false }}`); вложенная таблица наследует `motion` внешней. Приоритет как везде: проп → провайдер (`overrides` → `mode`) → выкл;
`prefers-reduced-motion: reduce` и `virtual` выключают всё. Подробно (что и как, ограничения, стоимость) — в `src/lib/components/TableGrid/README.md`, «Анимации (вне оригинала)»; здесь — то, что важно авторам:

* Строки таблицы — `display: contents` (без рамки и transform), поэтому `animate:flip` неприменим. `createTableMotion()` (вызывает `TableGrid.svelte`) кладёт в контекст `TableMotion`; `_Layout.svelte` вызывает `tm.track({ root, rows, highlighted, expanded, sortings })`:
  два эффекта (`$effect.pre` — первый прямоугольник каждой строки и цвета, `$effect` — последний и запуск) ведут **ячейки** строк Web Animations (`translate` / `opacity` / `transform`, ключи по токенам темы; Spring — семплированной кривой).
  Без покадрового JS: покадровый inline-стиль на ячейках таблицы стоит ≈ 80 мкс на ячейку (у каждой ячейки inline `--column-index`).
* `out:tableRowOut={tm}` на строке (`_LayoutRow.svelte`) держит удалённую строку в DOM, пока гаснут её ячейки (они закреплены `position: absolute`); Svelte 5 не разрушает группу outro одного `{#each}`, если часть исходов синхронна (длительность 0),
  а часть — нет, поэтому пока движение активно, **каждая** удалённая строка отвечает ненулевой длительностью (невидимая просто скрывается `display: none`).
* `transition:tableSlide={tm.slide('expand' | 'actionBar')}` (`_ExpandContainer.svelte`, `_FooterArea.svelte`) — `rtSlide` + возврат пустого `style`, который Svelte оставляет после `overflow: hidden`.
* Ничего не остаётся в DOM: ни классов, ни атрибутов; inline-стили и вспомогательные узлы (копия старой стрелки сортировки) живут только пока идёт анимация. Отсюда проверка `tools/ext-check-table.py`: DOM «без провайдера» = «выкл» = «вкл после анимации».
* Прочее: `type: 'spring'` действует на FLIP / появление (пружина семплируется), `transition:tableSlide` всегда Tween; нагрузка — на композитор (у SVG `rotate` / `scale` как отдельные свойства не идут на композиторе — используется `transform`).

### CSS: что подключается и откуда

Файлов два, чтобы потребитель без расширения не получал ни байта движения (`npm run package`, `tools/build-package-assets.mjs` это проверяет и падает при нарушении):

| файл | что внутри | кто импортирует |
|---|---|---|
| `layout-modal.css`, `layout-drawer.css` (≈ 1 КБ каждый) | «всегда безопасная» раскладка: `fullHeight` у Modal / Drawer (нужен модификатор `rt-ext-modal--full` / `rt-ext-drawer--full`, без него ничего не совпадает) | каждый — свой компонент (`Modal.svelte` / `Drawer.svelte`); оба входят и в `rt-ui.min.css` |
| `ext.css` (≈ 5 КБ) | только движение: коннектор Wizard, стопка Toast, индикатор Tabs, подписи SideMenu | **только** `ext/index.ts` (`@lct-testkit/rt-ui/ext`) и `ExtMotionProvider.svelte`; оригинальные компоненты и `motion.svelte.ts` его **не** импортируют |

Проп `motion` компонента **без** провайдера и без импорта `@lct-testkit/rt-ui/ext` не подключает `ext.css`: для Wizard / Toast / Tabs / SideMenu (их разметка в расширенном режиме опирается на эти правила)
подключите его один раз: `import '@lct-testkit/rt-ui/ext'` или `import '@lct-testkit/rt-ui/ext/ext.css'` (все CSS расширения доступны через `exports` одним шаблоном `./ext/*.css`, в том числе раскладка `…/ext/layout-modal.css` и `…/ext/layout-drawer.css`). Оверлеи, Календарь и Accordion работают и без него.
Проверка потребителя: `node tools/check-ext-css.mjs` (после `npm run package` собирает три крошечных приложения против `dist/`). Движению `TableGrid` CSS не нужен вовсе (Web Animations и inline-стили только на время анимации): подключать для него ничего не требуется.

### Переходы (`transitions.ts`)

Тонкие обёртки над `svelte/transition` / `svelte/animate`. Длительности и кривые берутся из токенов активной темы
(`--atmr-motion-duration-*`, `--atmr-motion-easing-*`, с теми же значениями как запасными), поэтому следуют за темой.
При `enabled: false` или `prefers-reduced-motion: reduce` переход нулевой длины — мгновенно.

| пресет | что делает | по умолчанию | для чего |
|---|---|---|---|
| `rtFade` | прозрачность | `'s'` 200 мс · `productive-standard` | любые блоки, оверлеи |
| `rtScale` | масштаб + прозрачность (`start` 0.95) | `'s'` 200 мс · `productive-entrance` | Popover, Tooltip, Dropdown, Toast |
| `rtFly` | сдвиг + прозрачность (`y` 12) | `'m'` 300 мс · `expressive-entrance` | Modal, Drawer, Toast |
| `rtSlide` | сворачивание высоты/ширины (`axis`) | `'m'` 300 мс · `productive-standard` | Accordion, панели, раскрытие строк TableGrid |
| `rtShift` | сдвиг по оси + fade (`axis`, `dir` ±1, `distance` 20), `kind: 'zoom'` — масштаб 0.97 → 1; уходящий элемент `position: absolute` | `'m'` 300 мс · `productive-standard` | смена страницы (сетка календаря), смена вида |
| `rtFlip` | `animate:rtFlip` для `{#each}` с ключами | `'m'` 300 мс · `productive-standard` | строки TableGrid, Tabs, Tags |

Общие параметры: `enabled`, `duration` (мс или токен), `delay`, `easing` (функция или токен).

```svelte
<script>
  import { useMotion } from '$lib/ext/motion.svelte.js';
  import { rtSlide } from '$lib/ext/transitions.js';
  const m = useMotion(undefined, 'accordion');   // читает ExtMotionProvider
  let open = $state(false);
</script>

{#if open}
  <div transition:rtSlide={m.transition()}>…</div>   <!-- мгновенно, пока режим выключен -->
{/if}
```

Пресеты `transition:` / `in:` / `out:` / `animate:` подключены к Toast (см. выше), к сетке Календаря (`rtShift`) и к панели Tabs (`rtFly`); оверлеи (Modal, Drawer, Popover, Tooltip, DropdownMenu),
Accordion, индикатор Tabs и панель SideMenu не пересоздают свой DOM, поэтому используют `Tween` / `Spring` через `Driver` (см. соответствующие разделы) с теми же токенами. Оригиналы
сохраняют свои react-transition-group-подобные последовательности классов (это «выключенный» путь, за который отвечает попиксельная сверка). К TableGrid подключён `rtSlide` (обёртка `tableSlide`: раскрытие строки и панель
действий), строки двигает измеряющий FLIP из `tableMotion.svelte.ts` (см. «TableGrid»).

## Демо и проверка

* `/ext` — демо на компонентах rt-ui: переключатель режима (выкл / Tween / Spring), кнопки, меняющие значения, живой пример
  `transition:rtSlide`, блок «Оверлеи» (кнопки открытия / закрытия Popover, Tooltip, DropdownMenu, Select, Multiselect, Modal, Drawer со своим
  переключателем режима — «как на странице» / выкл / Svelte / Svelte · Spring — и выбором placement / position), блоки **«Календарь», «Accordion», «Tabs», «SideMenu»** (у каждого свой
  переключатель «как на странице / выкл (оригинал) / Svelte»: `?cal=`, `?acc=`, `?tabs=`, `?sm=` = `off|svelte|page`; в каждом есть ячейки `motion={false}` и `motion="spring"`),
  переопределения пропом, выбор темы. Глубокие ссылки: `/ext?motion=spring&theme=rtk_purple_dark`.
  Страница ставит на `<body>` классы `Theme_root_<тема> rt-base`: `rt-base` — опциональный базовый слой приложения
  (`src/lib/styles/base.css`: шрифт и цвет текста, которые оригинальные компоненты сами не задают, а наследуют от корня).
* `python tools/ext-check.py` — Playwright: при выключенном режиме значения меняются мгновенно, при включённом — постепенно
  (> 100 мс, с промежуточными кадрами) и приходят в цель; перетаскивание ползунка не сглаживается; проп переопределяет
  провайдер; `prefers-reduced-motion: reduce` отключает всё; весь текст демо в 3 темах набран шрифтом Rostelecom (не serif / не чёрным).
  **Второй этап** (`--only second [--sections calendar,accordion,tabs,sidemenu]`): каждый из четырёх блоков загружается дважды (`=off` и `=svelte`) и снимается на каждом кадре.
  Выкл — путь оригинала: никаких `rt-ext-*`, inline-стилей расширения, одна сетка календаря на любом кадре, оригинальный inline-CSS-`transition` у аккордеона, классы SideMenu переключаются сразу;
  вкл — движение действительно идёт (прогрессивно, монотонно, > 100 мс; направление сдвига сетки; высота аккордеона и «доезжание» при росте содержимого; индикатор Tabs и его точная посадка
  под выбранную вкладку; ширина SideMenu, подписи гаснут до сужения и появляются, когда есть место; вложенные списки), итоговый DOM после тех же действий **равен** DOM «выкл»
  (Tabs — за вычетом документированных индикатора и класса, плюс **попиксельное** равенство выбранных вкладок); `motion={false}` / `motion="spring"` сильнее режима;
  `prefers-reduced-motion: reduce` возвращает оригинальный путь.
* `python tools/ext-check-overlays.py` — Playwright по блоку «Оверлеи» демо (`/ext?ov=off|svelte|spring|page`, переключатель режима оверлеев, placement / position и
  переключатели `fullHeight` у Drawer и Modal на странице):
  для каждого компонента открытие/закрытие в трёх загрузках страницы — с выключенным режимом ничего не анимируется (Popover / Tooltip / меню — мгновенно;
  у Modal / Drawer идёт оригинальная последовательность классов и никаких inline `opacity` / `scale` / `translate`), с включённым — прогрессивно (> 100 мс,
  монотонно, с промежуточными кадрами), окно не «сползает» при scale, drawer выезжает от каждого из 4 краёв; **со Spring** те же оверлеи ведёт Svelte-`Spring`, drawer не заезжает за
  свой край; итоговый DOM и размеры открытого и закрытого состояния совпадают во всех режимах; `fullHeight` (геометрия и класс, без него — оригинальные классы); проп `motion`
  сильнее режима; `prefers-reduced-motion: reduce` возвращает оригинальный путь.
* `/ext/table` — демо `TableGrid` с движением (30 / 200 строк, `?motion=none|off|tween|spring&rows=…&paged=1&virtual=1&theme=…`); `python tools/ext-check-table.py [--perf | --perf-only]` — Playwright, один и тот же сценарий (сортировка, перемешивание,
  фильтр, страницы, выбор + панель действий, раскрытие, добавление строк) в загрузках «без провайдера», «выкл», Tween, Spring, reduced-motion, virtual: без расширения и с выключенным режимом DOM идентичен после каждого шага и ничего не запускается;
  с включённым — анимации действительно идут (FLIP / появление / уход строк, иконка, цвет, раскрытие и панель едут), строки стартуют ровно с прежних мест и приходят в новые монотонно, клик по чекбоксу посреди движения попадает, клавиатура
  работает, а после анимации DOM и геометрия равны «выкл» и ничего не остаётся; reduced-motion и virtual — без анимаций; `--perf` — стоимость (первый кадр после действия и главный поток) для 30 и 200 строк, выкл против вкл.
* `node tools/check-ext-css.mjs` (после `npm run package`) — потребитель собранного пакета: без `@lct-testkit/rt-ui/ext` в его CSS нет motion-правил (только крошечная раскладка `fullHeight`, если
  подключены Modal / Drawer), с ним — есть.
* `node tools/check-ext-ssr.mjs` — SSR-проверка: каждый компонент с `motion` (календарь, accordion, tabs, sidemenu, оверлеи, Slider, Wizard, Progress) рендерится на сервере без провайдера и внутри
  `<ExtMotionProvider mode="svelte">` (Tween и Spring); ни один хук не трогает `window` / `document` при инициализации. У сервера нет `prefers-reduced-motion`, поэтому с включённым `motion` он выводит
  расширенную разметку (например, индикатор Tabs); если у пользователя включено «уменьшить движение», клиент при гидрации заменит этот блок оригинальным. (Плейграунд — `ssr = false`, браузерные проверки SSR не покрывают.)
* `python tools/compare.py --match "^components-slider--"` (а также `stepper`, `wizard`, `popover`, `tooltip`, `dropdownmenu`, `select`, `multiselect`,
  `patterns-recipes-modal`, `patterns-recipes-drawer`, `components-pickerdate`, `components-inputdate`, `patterns-recipes-accordion`, `components-tabs`, `patterns-recipes-sidemenu`,
  `patterns-recipes-topmenu-topwithsidemenu`, `^tablegrid`, `^tree-tree`, `components-pagination`, `patterns-recipes-accordion--table`) — оригинал не изменился.
