<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Demo of the author's motion extensions (route /ext). Built from rt-ui components (Typography, Badge, Select, Switch,
	// SegmentedControl, Slider, Stepper, Wizard, Button) plus the extension layer in src/lib/ext (ExtMotionProvider, Progress,
	// transition presets). Everything is OFF by default: the segmented control below switches the global mode of the
	// <ExtMotionProvider> ('off' = the original behaviour, 'tween' / 'spring' = Svelte motion).
	//
	// Deep links: /ext?motion=off|tween|spring&theme=rtk_purple_dark
	import { onMount } from 'svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Slider from '$lib/components/Slider/Slider.svelte';
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import WizardStepsHorizontal from '$lib/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
	import { prefersReducedMotion } from '$lib/ext/motion.svelte.js';
	import Progress from '$lib/ext/Progress/Progress.svelte';
	import AccordionDemo from './AccordionDemo.svelte';
	import CalendarDemo from './CalendarDemo.svelte';
	import OverlaysDemo from './OverlaysDemo.svelte';
	import SideMenuDemo from './SideMenuDemo.svelte';
	import TabsDemo from './TabsDemo.svelte';
	import ToastsDemo from './ToastsDemo.svelte';
	import TransitionsDemo from './TransitionsDemo.svelte';

	const THEMES = [
		{ key: 'rtk_default_light', value: 'Rostelecom · светлая' },
		{ key: 'rtk_default_dark', value: 'Rostelecom · тёмная' },
		{ key: 'rtk_purple_light', value: 'Purple · светлая' },
		{ key: 'rtk_purple_dark', value: 'Purple · тёмная' }
	];
	type Sel = 'off' | 'tween' | 'spring';
	const SEL: [Sel, string][] = [
		['off', 'Выкл (оригинал)'],
		['tween', 'Tween'],
		['spring', 'Spring']
	];

	let theme = $state('rtk_default_light');
	/** global motion selection of the demo: the ExtMotionProvider's mode + default engine */
	let sel = $state<Sel>('off');
	const mode = $derived(sel === 'off' ? 'off' : 'svelte');
	const type = $derived(sel === 'spring' ? 'spring' : 'tween');

	// Progress
	let p = $state(25);
	let indeterminate = $state(false);
	const clamp = (n: number) => Math.min(100, Math.max(0, n));
	const rnd = () => Math.round(Math.random() * 100);

	// Slider
	let sv = $state(20);
	let range = $state<number[]>([20, 70]);
	/** motion off = the original Slider, whose `value` is only the initial value: the demo re-creates it on a button press */
	let sliderKey = $state(0);
	function setSlider(v: number) {
		sv = v;
		range = [Math.max(0, v - 40), v];
		sliderKey++;
	}

	// Wizard
	let step = $state(1);
	const STEPS = [
		{ title: 'Данные', subtitle: 'Шаг 1' },
		{ title: 'Проверка', subtitle: 'Шаг 2' },
		{ title: 'Оплата', subtitle: 'Шаг 3' },
		{ title: 'Подтверждение', subtitle: 'Шаг 4' },
		{ title: 'Готово', subtitle: 'Шаг 5' }
	];

	let prevBody = '';
	onMount(() => {
		prevBody = document.body.className;
		const u = new URLSearchParams(location.search);
		if (u.has('theme')) theme = u.get('theme')!;
		const m = u.get('motion');
		if (m === 'off' || m === 'tween' || m === 'spring') sel = m;
		return () => {
			document.body.className = prevBody;
		};
	});
	$effect(() => {
		// `rt-base` = the opt-in app base layer (src/lib/styles/base.css): font + text colour that the original components inherit from the app root
		document.body.className = `Theme_root_${theme} rt-base rt-ext-demo`;
	});
</script>

<svelte:head><title>rt-ui · авторские расширения</title></svelte:head>

<ExtMotionProvider {mode} {type}>
	<main class="page">
		<header class="head">
			<Typography variant="heading-h3" as="h1">Движение на Svelte</Typography>
			<Badge size="s" variant="primary" colorScheme="warning" label="Авторское расширение — вне оригинала" data-testid="ext-badge" />
			<div class="spacer"></div>
			<div class="theme"><Select size="s" items={THEMES} value={theme} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k) => k && (theme = String(k))} /></div>
		</header>

		<Typography variant="body-m" as="p" class="note" data-testid="ext-note">
			Всё выключено по умолчанию: без <code>ExtMotionProvider</code> и без пропа <code>motion</code> оригинальные компоненты
			отрисовываются и ведут себя ровно как в Rostelecom Atomaro (это проверяет <code>tools/compare.py</code>). Здесь глобальный
			режим переключается ниже; проп <code>motion</code> компонента его переопределяет. При
			<code>prefers-reduced-motion: reduce</code> анимации не работают ни в одном режиме.
		</Typography>

		<section class="card controls">
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Режим ExtMotionProvider</Typography>
				<SegmentedControl size="s" value={sel} onChange={(i: string) => (sel = i as Sel)}>
					{#each SEL as [k, label] (k)}
						<Segment index={k} {label} data-testid="motion-{k}" />
					{/each}
				</SegmentedControl>
			</div>
			<Typography variant="body-s" as="span" class="muted" data-testid="rm-state">
				Системная настройка «уменьшить движение»: {prefersReducedMotion() ? 'включена — анимации отключены' : 'выключена'}
			</Typography>
		</section>

		<!-- ───────────────────────── Progress ───────────────────────── -->
		<section class="card" data-testid="sec-progress">
			<Typography variant="heading-h5" as="h2">Progress <span class="tag">ext</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				Авторский индикатор: линейный и круговой, схемы accent / neutral / success / error из токенов темы. Значение
				меняется кнопками — с включённым движением заливка плавно догоняет цель (Tween / Spring).
			</Typography>
			<div class="actions">
				{#each [0, 25, 50, 75, 100] as v (v)}
					<Button size="s" variant="outline" colorScheme="neutral" label="{v}%" onclick={() => (p = v)} data-testid="p-{v}" />
				{/each}
				<Button size="s" variant="outline" colorScheme="neutral" label="Случайное" onclick={() => (p = rnd())} data-testid="p-random" />
				<Stepper size="m" label="{p}%" onClickIconPrefix={() => (p = clamp(p - 10))} onClickIconSuffix={() => (p = clamp(p + 10))} data-testid="p-stepper" />
				<Switch size="s" label="indeterminate" checked={indeterminate} onChange={(v: boolean) => (indeterminate = v)} />
			</div>
			<div class="grid2">
				<div class="stack">
					<Progress label="Загрузка файла" showValue value={p} {indeterminate} data-testid="pg-main" />
					<Progress size="s" colorScheme="success" label="Успех" showValue value={p} {indeterminate} data-testid="pg-success" />
					<Progress size="l" colorScheme="neutral" label="Нейтральный" showValue value={p} {indeterminate} />
					<Progress colorScheme="error" label="Ошибка" showValue value={p} {indeterminate} />
				</div>
				<div class="rings">
					<Progress variant="circular" size="s" showValue label="S" value={p} {indeterminate} data-testid="pg-ring-s" />
					<Progress variant="circular" showValue label="M · accent" value={p} {indeterminate} data-testid="pg-ring" />
					<Progress variant="circular" size="l" colorScheme="success" showValue label="L · success" value={p} {indeterminate} />
					<Progress variant="circular" size="l" colorScheme="error" label="L · error" value={p} {indeterminate} />
				</div>
			</div>

			<Typography variant="body-s" strong as="p">Переопределение пропом <code>motion</code> у компонента (сильнее провайдера)</Typography>
			<div class="stack">
				<Progress size="s" label={'motion={false} — всегда мгновенно'} showValue value={p} motion={false} data-testid="ov-false" />
				<Progress size="s" label={'motion="tween" — всегда Tween'} showValue value={p} motion="tween" data-testid="ov-tween" />
				<Progress size="s" label={'motion="spring" — всегда Spring'} showValue value={p} motion="spring" data-testid="ov-spring" />
				<Progress size="s" label={'motion={{ duration: 1200, easing: "expressive-standard" }}'} showValue value={p} motion={{ type: 'tween', duration: 1200, easing: 'expressive-standard' }} data-testid="ov-custom" />
			</div>
		</section>

		<!-- ───────────────────────── Slider ───────────────────────── -->
		<section class="card" data-testid="sec-slider">
			<Typography variant="heading-h5" as="h2">Slider <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				Оригинальный <code>Slider</code> с пропом <code>motion</code> (наследуется от провайдера): ползунок, заливка и число в
				подсказке плавно едут к значению. Клик по треку — «скольжение», перетаскивание — мгновенное. С выключенным движением
				это оригинал: <code>value</code> — только начальное значение, поэтому демо пересоздаёт слайдер по кнопке.
			</Typography>
			<div class="actions">
				{#each [0, 50, 100] as v (v)}
					<Button size="s" variant="outline" colorScheme="neutral" label="→ {v}" onclick={() => setSlider(v)} data-testid="s-{v}" />
				{/each}
				<Button size="s" variant="outline" colorScheme="neutral" label="Случайное" onclick={() => setSlider(rnd())} data-testid="s-random" />
			</div>
			<div class="stack">
				<div data-testid="ext-slider-single">
					{#key mode === 'off' ? sliderKey : 'follow'}
						<Slider label="Громкость" value={[sv]} min={0} max={100} step={1} tooltip="always" subLabel={(v) => `${v[0]}%`} onChange={(v) => (sv = v[0])} />
					{/key}
				</div>
				<div data-testid="ext-slider-range">
					{#key mode === 'off' ? sliderKey : 'follow'}
						<Slider label="Диапазон" value={range} min={0} max={100} step={1} tooltip="always" subLabel={(v) => `${v[0]} – ${v[1]}`} onChange={(v) => (range = [...v])} />
					{/key}
				</div>
				<div data-testid="ext-slider-off">
					<Slider label={'motion={false} — всегда оригинал'} value={[sv]} min={0} max={100} step={1} tooltip="hover" motion={false} />
				</div>
			</div>
		</section>

		<!-- ───────────────────────── Wizard ───────────────────────── -->
		<section class="card" data-testid="sec-wizard">
			<Typography variant="heading-h5" as="h2">Wizard <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				Соединительные линии этапов «заливаются» слева направо при смене текущего этапа (Stepper — «±» контрол, у него
				нечего анимировать, здесь он просто переключает этап).
			</Typography>
			<div class="actions">
				<Button size="s" variant="outline" colorScheme="neutral" label="Назад" onclick={() => (step = Math.max(0, step - 1))} data-testid="w-prev" />
				<Button size="s" label="Далее" onclick={() => (step = Math.min(STEPS.length, step + 1))} data-testid="w-next" />
				<Button size="s" variant="ghost" colorScheme="neutral" label="Сначала" onclick={() => (step = 0)} data-testid="w-reset" />
				<Stepper size="m" label={step >= STEPS.length ? 'Готово' : `Шаг ${step + 1}`} onClickIconPrefix={() => (step = Math.max(0, step - 1))} onClickIconSuffix={() => (step = Math.min(STEPS.length, step + 1))} />
			</div>
			<div data-testid="ext-wizard"><WizardStepsHorizontal currentStep={step} steps={STEPS} /></div>
			<div data-testid="ext-wizard-bottom"><WizardStepsHorizontal currentStep={step} textPlacement="bottom" steps={STEPS} /></div>
		</section>

		<!-- ───────────────────────── Transitions ───────────────────────── -->
		<section class="card" data-testid="sec-transitions">
			<Typography variant="heading-h5" as="h2">Svelte-переходы <span class="tag">ext · transitions.ts</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				Пресеты <code>rtFade</code> / <code>rtScale</code> / <code>rtFly</code> / <code>rtSlide</code> (и <code>rtFlip</code> для
				<code>animate:</code>) берут длительности и кривые из токенов темы. Их можно подключать к Modal, Drawer, Popover,
				Tooltip, Dropdown, Toast, Accordion, Tabs и строкам TableGrid.
			</Typography>
			<TransitionsDemo />
		</section>

		<!-- ───────────────────────── Toast ───────────────────────── -->
		<section class="card" data-testid="sec-toasts">
			<Typography variant="heading-h5" as="h2">Toast <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>ToastNotificationsProvider</code> с пропом <code>motion</code>: «выкл» кладёт уведомление с <code>motion: false</code> —
				оригинальная разметка и классы; «Svelte» — с <code>motion: true</code>: тост влетает со стороны своего <code>position</code>
				(+ fade), при закрытии улетает обратно и гаснет, а остальные тосты плавно перестраиваются (<code>animate:flip</code>). Проп
				уведомления сильнее провайдера и глобального режима; при <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<ToastsDemo />
		</section>

		<!-- ───────────────────────── Overlays ───────────────────────── -->
		<section class="card" data-testid="sec-overlays">
			<Typography variant="heading-h5" as="h2">Оверлеи <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>Popover</code>, <code>Tooltip</code>, <code>DropdownMenu</code> (а с ним <code>Select</code> и <code>Multiselect</code>),
				<code>Modal</code> и <code>Drawer</code> с пропом <code>motion</code>. «Выкл» — оригинал: тот же DOM и то же поведение (Popover / Tooltip /
				DropdownMenu появляются мгновенно, Modal / Drawer — со своими CSS-классами). «Svelte» — Tween: popover, tooltip и меню растут (scale + fade) из
				угла по <code>placement</code>, модальное окно проявляется (fade + scale), drawer выезжает от края <code>position</code>, оверлей плавно
				появляется. Итоговое состояние после анимации совпадает с оригинальным. При <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<OverlaysDemo />
		</section>

		<!-- ───────────────────────── Calendar ───────────────────────── -->
		<section class="card" data-testid="sec-calendar">
			<Typography variant="heading-h5" as="h2">Календарь <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>PickerDate</code> и <code>InputDate</code> с пропом <code>motion</code>. «Выкл» — оригинал: месяцы и годы меняются на месте. «Svelte» — сетка
				месяца плавно уезжает и приезжает (slide + fade в сторону перехода «назад» / «вперёд»), подписи месяца и года сдвигаются с ней, смена вида (день /
				месяц / год) «приближается», выбранный день и период проявляются мягко; календарь в <code>InputDate</code> раскрывается как Popover. Итоговый DOM
				после анимации совпадает с оригиналом. При <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<CalendarDemo />
		</section>

		<!-- ───────────────────────── Accordion ───────────────────────── -->
		<section class="card" data-testid="sec-accordion">
			<Typography variant="heading-h5" as="h2">Accordion <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>Accordion</code> / <code>AccordionDetails</code> с пропом <code>motion</code>. «Выкл» — оригинал: CSS-<code>transition</code> высоты и
				react-transition-group-подобный автомат. «Svelte» — высоту ведёт <code>Tween</code> или <code>Spring</code>, содержимое плавно проявляется и сдвигается,
				а смена размера содержимого «доезжает» плавно; в конце DOM тот же, что у оригинала. Шеврон рисует потребитель (у оригинала это CSS-transition, здесь
				при включённом движении — <code>useMotionValue</code>). При <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<AccordionDemo />
		</section>

		<!-- ───────────────────────── Tabs ───────────────────────── -->
		<section class="card" data-testid="sec-tabs">
			<Typography variant="heading-h5" as="h2">Tabs <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>TabsGroup</code> / <code>TabsPanel</code> с пропом <code>motion</code>. «Выкл» — оригинал: у каждой вкладки своя линия (CSS-<code>transition</code> её
				ширины), панель появляется сразу. «Svelte» — одна линия «переезжает» с вкладки на вкладку (<code>Tween</code> или <code>Spring</code> по <code>left</code> и
				<code>width</code>), панель проявляется и чуть сдвигается вверх (<code>in:rtFly</code>). При включённом движении в вкладки добавляется
				<code>span.rt-ext-tabs-indicator</code> и класс <code>rt-ext-tabs</code>. При <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<TabsDemo />
		</section>

		<!-- ───────────────────────── SideMenu ───────────────────────── -->
		<section class="card" data-testid="sec-sidemenu">
			<Typography variant="heading-h5" as="h2">SideMenu <span class="tag">ext · motion</span></Typography>
			<Typography variant="body-s" as="p" class="muted">
				<code>SideMenu</code> с пропом <code>motion</code>. «Выкл» — оригинал: два класса, ширина едет CSS-<code>transition</code>, подписи появляются и пропадают сразу
				(базовый слой <code>.rt-base</code> удерживает их в одну строку — это исправление автора остаётся как есть). «Svelte» — ширину панели и прозрачность подписей ведёт
				один <code>Tween</code> (или <code>Spring</code>): подписи проявляются, когда для них есть место, и гаснут <em>до</em> сужения панели; вложенные группы
				(<code>SideMenuCollapse</code>) и блок <code>SideMenuExpandContent</code> раскрываются высотой + fade. Пока панель движется, у неё класс
				<code>rt-ext-side-menu--motion</code> и inline-<code>width</code>; в конце DOM тот же, что у оригинала. При <code>prefers-reduced-motion: reduce</code> анимации нет.
			</Typography>
			<SideMenuDemo />
		</section>
	</main>
</ExtMotionProvider>

<style>
	:global(body.rt-ext-demo) {
		margin: 0;
		background: var(--atmr-bg-page);
		color: var(--atmr-fg-default);
		font-family: var(--atmr-font-family-body);
	}
	.page {
		box-sizing: border-box;
		max-width: 1040px;
		margin: 0 auto;
		padding: var(--atmr-spacing-6x) var(--atmr-spacing-4x) var(--atmr-spacing-16x);
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-4x);
	}
	.head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
	}
	.spacer {
		flex: 1;
	}
	.theme {
		width: 240px;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-3x);
		padding: var(--atmr-spacing-5x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-muted);
		background: var(--atmr-bg-elevated-s);
	}
	.controls {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
	}
	.ctl {
		display: flex;
		align-items: center;
		gap: var(--atmr-spacing-3x);
	}
	.tag {
		margin-inline-start: var(--atmr-spacing-2x);
		padding: 0 var(--atmr-spacing-2x);
		border-radius: var(--atmr-border-radius-full);
		background: var(--atmr-warning-container-default);
		color: var(--atmr-warning-on-container);
		font-size: 0.7em;
		font-weight: 500;
		vertical-align: middle;
	}
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-2x) var(--atmr-spacing-3x);
	}
	.grid2 {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: var(--atmr-spacing-6x);
		align-items: start;
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-4x);
		min-width: 0;
	}
	.rings {
		display: flex;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-5x);
		align-items: flex-start;
	}
	:global(.muted) {
		color: var(--atmr-fg-muted);
	}
	:global(.note) {
		color: var(--atmr-fg-soft);
	}
	code {
		font-size: 0.9em;
	}
	@media (max-width: 720px) {
		.grid2 {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
