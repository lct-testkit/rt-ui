<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Demo of the TableGrid motion (route /ext/table): src/lib/ext/tableMotion.svelte.ts, README of the table "Анимации (вне оригинала)".
	// It is the ORIGINAL TableGrid; the switch below sets the `mode` of an <ExtMotionProvider> around it:
	//   none    no provider and no `motion` prop at all (the baseline of the check script: what the table is without the extension)
	//   off     ExtMotionProvider mode="off"    -> the same original DOM / pixels
	//   tween   mode="svelte"                   -> rows FLIP / fade in / fade out, expand + action bar slide, sort arrow turns, colours fade, hover eases
	//   spring  mode="svelte" type="spring"     -> the same with a spring (a little overshoot) for FLIP / appearance
	//
	// Deep links: /ext/table?motion=none|off|tween|spring&rows=30 (1..1000; the buttons: 30 / 200)&virtual=1&paged=1&theme=rtk_purple_dark
	import { onMount } from 'svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import { ActionBar, TableGrid, type TableGridColumn } from '$lib/components/TableGrid';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
	import { prefersReducedMotion } from '$lib/ext/motion.svelte.js';

	const THEMES = [
		{ key: 'rtk_default_light', value: 'Rostelecom · светлая' },
		{ key: 'rtk_default_dark', value: 'Rostelecom · тёмная' },
		{ key: 'rtk_purple_light', value: 'Purple · светлая' },
		{ key: 'rtk_purple_dark', value: 'Purple · тёмная' }
	];
	type Sel = 'none' | 'off' | 'tween' | 'spring';
	const SEL: [Sel, string][] = [
		['none', 'Без провайдера'],
		['off', 'Выкл (оригинал)'],
		['tween', 'Tween'],
		['spring', 'Spring']
	];
	const STATUSES = ['Новый', 'В работе', 'Согласование', 'Оплачен', 'Закрыт'];
	const STATUS_COLOR = ['status-01', 'status-02', 'status-03', 'status-04', 'neutral'] as const;
	const FIRST = ['Иван', 'Пётр', 'Анна', 'Мария', 'Сергей', 'Ольга', 'Дмитрий', 'Елена'];
	const LAST = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Попов', 'Васильев', 'Морозов'];
	const CITY = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Самара'];

	interface Client {
		id: number;
		name: string;
		city: string;
		status: string;
		amount: number;
		date: string;
	}
	const makeClient = (i: number): Client => ({
		id: i + 1,
		name: `${LAST[(i * 7) % LAST.length]} ${FIRST[(i * 3) % FIRST.length]}`,
		city: CITY[(i * 5) % CITY.length],
		status: STATUSES[(i * 11) % STATUSES.length],
		amount: ((i * 7919) % 100000) / 100,
		date: `${String((i % 28) + 1).padStart(2, '0')}.${String((i % 12) + 1).padStart(2, '0')}.2025`
	});

	const query = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
	const N = Math.min(1000, Math.max(1, Math.round(Number(query.get('rows'))) || 30));

	let theme = $state(query.get('theme') ?? 'rtk_default_light');
	let sel = $state<Sel>((['none', 'off', 'tween', 'spring'] as const).find((s) => s === query.get('motion')) ?? 'off');
	const virtual = query.get('virtual') === '1';

	// `$state.raw`: plain row objects, no deep proxies (README of the table, "Производительность")
	let data = $state.raw<Client[]>(Array.from({ length: N }, (_, i) => makeClient(i)));
	let nextId = N + 1;
	let sortKey = $state<'amount' | 'name' | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');
	let shuffle = $state(0);
	let status = $state('');
	let text = $state('');
	let paged = $state(query.get('paged') === '1');
	let page = $state(1);
	const pageSize = 10;
	let selected = $state.raw<string[]>([]);
	let tint = $state(true);
	let expandedKeys = $state.raw<string[]>([]);
	let expandTick = 0;

	const hash = (id: number, seed: number) => ((id * 2654435761 + seed * 40503) >>> 0) % 100003;
	const filtered = $derived(data.filter((r) => (!status || r.status === status) && (!text || r.name.toLowerCase().includes(text.toLowerCase()))));
	const sorted = $derived.by(() => {
		if (shuffle) return [...filtered].sort((a, b) => hash(a.id, shuffle) - hash(b.id, shuffle));
		if (!sortKey) return filtered;
		const k = sortKey;
		const dir = sortDir === 'asc' ? 1 : -1;
		return [...filtered].sort((a, b) => (k === 'amount' ? a.amount - b.amount : a.name.localeCompare(b.name, 'ru')) * dir);
	});
	const pages = $derived(Math.max(1, Math.ceil(sorted.length / pageSize)));
	const currentPage = $derived(Math.min(page, pages));
	const rows = $derived(paged ? sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sorted);
	const selectedSet = $derived(new Set(selected));

	function setSort(key: 'amount' | 'name' | null, dir: 'asc' | 'desc' = 'asc') {
		shuffle = 0;
		sortKey = key;
		sortDir = dir;
	}
	const cycle = (key: 'amount' | 'name') => () => {
		shuffle = 0;
		if (sortKey !== key) setSort(key, 'asc');
		else if (sortDir === 'asc') setSort(key, 'desc');
		else setSort(null);
	};
	const sortOf = (key: 'amount' | 'name') => (sortKey === key ? sortDir : 'default');

	const columns: TableGridColumn<Client>[] = $derived([
		{ name: 'id', title: '№', size: { width: 70 } },
		{ name: 'name', title: 'Клиент', size: { width: 210 }, sorting: { sort: sortOf('name'), onSort: cycle('name') } },
		{ name: 'city', title: 'Город', size: { width: 160 } },
		{ name: 'status', title: 'Статус', size: { width: 150 }, render: statusCell },
		{ name: 'amount', title: 'Сумма', unit: '₽', align: 'right', size: { width: 130 }, sorting: { sort: sortOf('amount'), onSort: cycle('amount') } },
		{ name: 'date', title: 'Дата', size: { width: 110 } }
	]);

	const expandable = (r: Client) => r.id % 3 === 0;
	const rowConfig = $derived({
		highlightOnClick: true,
		backgroundColor: tint ? (r: Client) => (selectedSet.has(String(r.id)) ? 'var(--atmr-tablegrid-primary-row-bg-color-selected)' : undefined) : undefined,
		selection: { defaultSelected: selected, onSelectionChange: (keys: string[]) => (selected = keys), renderFirstColumnHeader: selectAll },
		expand: { hasExpanded: expandable, render: details, expandedKeys }
	});

	const allChecked = $derived(rows.length > 0 && rows.every((r) => selectedSet.has(String(r.id))));
	const someChecked = $derived(rows.some((r) => selectedSet.has(String(r.id))));
	const ids = (list: Client[]) => list.map((r) => String(r.id));
	function removeRows(keys: string[]) {
		const gone = new Set(keys);
		data = data.filter((r) => !gone.has(String(r.id)));
		selected = selected.filter((k) => !gone.has(k));
	}
	function addRow() {
		data = [makeClient(nextId++ + 7), ...data];
	}
	function setExpanded(all: boolean | 'first') {
		// a changed `expandedKeys` replaces the expanded rows: the counter makes every press a change (unknown keys are ignored)
		const list = rows.filter(expandable);
		expandedKeys = all === 'first' ? [...ids(list.slice(0, 1)), `_${++expandTick}`] : all ? [...ids(list), `_${++expandTick}`] : [`_${++expandTick}`];
	}

	let prevBody = '';
	onMount(() => {
		prevBody = document.body.className;
		return () => {
			document.body.className = prevBody;
		};
	});
	$effect(() => {
		document.body.className = `Theme_root_${theme} rt-base rt-ext-demo`;
	});
	const mode = $derived(sel === 'tween' || sel === 'spring' ? 'svelte' : 'off');
	const type = $derived(sel === 'spring' ? 'spring' : 'tween');
</script>

<svelte:head><title>rt-ui · таблица · анимации</title></svelte:head>

{#snippet statusCell(row: Client)}
	<div class="status"><Badge size="s" variant="secondary" colorScheme={STATUS_COLOR[STATUSES.indexOf(row.status)]} label={row.status} /></div>
{/snippet}
{#snippet selectAll()}
	<Checkbox
		variant="primary"
		checked={allChecked}
		indeterminate={someChecked && !allChecked}
		data-testid="t-select-all-box"
		onChange={(v: boolean) => (selected = v ? [...new Set([...selected, ...ids(rows)])] : selected.filter((k) => !ids(rows).includes(k)))}
	/>
{/snippet}
{#snippet details(row: Client)}
	<div class="details" data-testid="t-details">
		<Typography variant="body-s" strong as="p">Клиент {row.name}</Typography>
		<Typography variant="body-s" as="p" class="muted">Договор № {row.id * 17}, город {row.city}. Сумма по счетам {row.amount.toLocaleString('ru-RU')} ₽.</Typography>
		<Typography variant="body-s" as="p" class="muted">Последнее обращение: {row.date}. Ответственный: {LAST[(row.id * 5) % LAST.length]} {FIRST[(row.id * 2) % FIRST.length]}.</Typography>
	</div>
{/snippet}
{#snippet actionBar()}
	<ActionBar onDelete={removeRows} deleteLabel="Удалить" cancelLabel="Отмена" />
{/snippet}
{#snippet footer()}
	<div class="foot" data-testid="t-footer">
		<Typography variant="body-s" as="span" data-testid="t-count">Строк: {rows.length}{paged ? ` · страница ${currentPage} из ${pages}` : ''} · всего {sorted.length}</Typography>
		{#if paged}
			<div class="pager">
				<Button size="s" variant="outline" colorScheme="neutral" label="Назад" disabled={currentPage <= 1} onclick={() => (page = currentPage - 1)} data-testid="t-page-prev" />
				<Button size="s" variant="outline" colorScheme="neutral" label="Вперёд" disabled={currentPage >= pages} onclick={() => (page = currentPage + 1)} data-testid="t-page-next" />
			</div>
		{/if}
	</div>
{/snippet}

{#snippet page_()}
	<main class="page">
		<header class="head">
			<Typography variant="heading-h3" as="h1">Таблица · движение на Svelte</Typography>
			<Badge size="s" variant="primary" colorScheme="warning" label="Авторское расширение — вне оригинала" data-testid="ext-badge" />
			<div class="spacer"></div>
			<div class="theme"><Select size="s" items={THEMES} value={theme} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k) => k && (theme = String(k))} /></div>
		</header>

		<Typography variant="body-s" as="p" class="note">
			Оригинальный <code>TableGrid</code>. «Выкл» и «Без провайдера» — оригинал: тот же DOM и пиксели. «Tween» / «Spring» — строки переезжают на новые места (FLIP) при сортировке,
			фильтре, смене страницы и перемешивании, новые строки проявляются, ушедшие гаснут; раскрытие строки и панель действий «выезжают», стрелка сортировки и шеврон
			поворачиваются, цвет выбранной / подсвеченной строки меняется плавно, наведение на строку и нажатие кнопок мягкие. После анимации DOM тот же, что у оригинала.
			В <code>virtual</code> и при <code>prefers-reduced-motion: reduce</code> анимации нет ({prefersReducedMotion() ? 'сейчас включено «уменьшить движение»' : 'сейчас не включено'}).
		</Typography>

		<section class="card controls">
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Режим</Typography>
				<SegmentedControl size="s" value={sel} onChange={(i: string) => (sel = i as Sel)}>
					{#each SEL as [k, label] (k)}
						<Segment index={k} {label} data-testid="m-{k}" />
					{/each}
				</SegmentedControl>
			</div>
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Строк</Typography>
				<div class="actions">
					{#each [30, 200] as n (n)}
						<Button size="s" variant={n === N ? 'primary' : 'outline'} colorScheme={n === N ? 'accent' : 'neutral'} label={String(n)} onclick={() => (location.search = `?motion=${sel}&rows=${n}${paged ? '&paged=1' : ''}${virtual ? '&virtual=1' : ''}&theme=${theme}`)} data-testid="n-{n}" />
					{/each}
				</div>
			</div>
		</section>

		<section class="card controls">
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Сортировка</Typography>
				<div class="actions">
					<Button size="s" variant="outline" colorScheme="neutral" label="Сумма ↑" onclick={() => setSort('amount', 'asc')} data-testid="t-sort-amount-asc" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Сумма ↓" onclick={() => setSort('amount', 'desc')} data-testid="t-sort-amount-desc" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Имя А→Я" onclick={() => setSort('name', 'asc')} data-testid="t-sort-name" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Сбросить" onclick={() => setSort(null)} data-testid="t-sort-reset" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Перемешать" onclick={() => (shuffle = shuffle + 1)} data-testid="t-shuffle" />
				</div>
			</div>
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Фильтр</Typography>
				<div class="actions">
					<div class="sel"><Select size="s" items={[{ key: '', value: 'Все статусы' }, ...STATUSES.map((s) => ({ key: s, value: s }))]} value={status} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k) => (status = k ? String(k) : '')} /></div>
					<Button size="s" variant="outline" colorScheme="neutral" label="Только «Оплачен»" onclick={() => (status = 'Оплачен')} data-testid="t-filter-paid" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Иван*" onclick={() => (text = 'Иван')} data-testid="t-filter-text" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Сбросить фильтр" onclick={() => ((status = ''), (text = ''))} data-testid="t-filter-reset" />
				</div>
			</div>
		</section>

		<section class="card controls">
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Страницы</Typography>
				<div class="actions">
					<Switch size="s" label="По 10 строк" checked={paged} onChange={(v: boolean) => ((paged = v), (page = 1))} data-testid="t-paged" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Стр. 2" disabled={!paged || pages < 2} onclick={() => (page = 2)} data-testid="t-page-2" />
				</div>
			</div>
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Выбор</Typography>
				<div class="actions">
					<Button size="s" variant="outline" colorScheme="neutral" label="Выбрать 3 строки" onclick={() => (selected = ids(rows.slice(0, 3)))} data-testid="t-select-3" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Выбрать все" onclick={() => (selected = ids(rows))} data-testid="t-select-all" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Снять выбор" onclick={() => (selected = [])} data-testid="t-select-none" />
					<Switch size="s" label="Подсвечивать выбранные" checked={tint} onChange={(v: boolean) => (tint = v)} data-testid="t-tint" />
				</div>
			</div>
			<div class="ctl">
				<Typography variant="body-s" strong as="span">Строки</Typography>
				<div class="actions">
					<Button size="s" variant="outline" colorScheme="neutral" label="Раскрыть первую" onclick={() => setExpanded('first')} data-testid="t-expand-first" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Раскрыть все" onclick={() => setExpanded(true)} data-testid="t-expand-all" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Свернуть все" onclick={() => setExpanded(false)} data-testid="t-collapse-all" />
					<Button size="s" variant="outline" colorScheme="neutral" label="Добавить" onclick={addRow} data-testid="t-add" />
				</div>
			</div>
		</section>

		<div class="tbl" data-testid="tbl">
			<TableGrid
				id="ext-table"
				{columns}
				{rows}
				columnConfig={{ sorting: true }}
				alignCells
				{rowConfig}
				headerSticky
				footerSticky
				containerStyle={{ maxHeight: 520 }}
				virtual={virtual ? { isEnable: true, overscanCount: 4 } : undefined}
				renders={{ footer, actionBar }}
			/>
		</div>
	</main>
{/snippet}

{#if sel === 'none'}
	{@render page_()}
{:else}
	<ExtMotionProvider {mode} {type}>{@render page_()}</ExtMotionProvider>
{/if}

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
		padding: var(--atmr-spacing-4x) var(--atmr-spacing-5x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-muted);
		background: var(--atmr-bg-elevated-s);
	}
	.controls {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--atmr-spacing-3x) var(--atmr-spacing-6x);
	}
	.ctl {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-2x) var(--atmr-spacing-3x);
	}
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-2x);
	}
	.sel {
		width: 180px;
	}
	.tbl {
		min-width: 0;
	}
	.status {
		display: flex;
		align-items: center;
		height: 100%;
		padding: 0 var(--atmr-spacing-3x);
	}
	.details {
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-1x);
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--atmr-spacing-3x);
	}
	.pager {
		display: flex;
		gap: var(--atmr-spacing-2x);
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
</style>
