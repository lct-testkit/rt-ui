<script lang="ts">
	// DEMO / BENCH of the TableGrid on big data (10 000+ rows). Open: /examples/table-perf?rows=10000&mode=virtual
	//   mode = virtual (default: only the visible rows are in the DOM) | paged (20 rows per page) | all (every row in the DOM - slow, on purpose)
	//   rows = 1000 | 10000 | 100000 ...   theme = rtk_default_light | rtk_default_dark | rtk_purple_light | rtk_purple_dark
	// The panel shows the number of rows in the DOM, the time of the first render and the frame rate; "Автопрокрутка" scrolls the table
	// up and down like tools/bench does. Numbers, method and the limits of the virtual mode: tools/bench/results/table-perf-notes.md,
	// src/lib/components/TableGrid/README.md ("Производительность").
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { TableGrid, type TableGridColumn } from '$lib/components/TableGrid';

	const query = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
	const N = Math.max(1, Number(query.get('rows') ?? 10000) || 10000);
	const mode = (['virtual', 'paged', 'all'] as const).find((m) => m === query.get('mode')) ?? 'virtual';
	const theme = query.get('theme') ?? 'rtk_default_light';

	const FIRST = ['Иван', 'Пётр', 'Анна', 'Мария', 'Сергей', 'Ольга', 'Дмитрий', 'Елена'];
	const LAST = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Попов', 'Васильев', 'Морозов'];
	const CITY = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Самара'];
	const STATUS = ['Новый', 'В работе', 'Согласование', 'Оплачен', 'Закрыт'];

	// `$state.raw`: the rows are plain objects, no deep proxies (see README, "Производительность")
	const all = Array.from({ length: N }, (_, i) => ({
		id: i + 1,
		name: `${LAST[(i * 7) % LAST.length]} ${FIRST[(i * 3) % FIRST.length]}`,
		city: CITY[(i * 5) % CITY.length],
		status: STATUS[(i * 11) % STATUS.length],
		amount: ((i * 7919) % 100000) / 100,
		date: `${String((i % 28) + 1).padStart(2, '0')}.${String((i % 12) + 1).padStart(2, '0')}.2025`
	}));
	let sort = $state<'asc' | 'desc' | 'default'>('default');
	let selected = $state.raw<string[]>([]);
	let page = $state(1);
	let pageSize = $state(20);

	const sorted = $derived(sort === 'default' ? all : [...all].sort((a, b) => (sort === 'asc' ? a.amount - b.amount : b.amount - a.amount)));
	const from = $derived((page - 1) * pageSize);
	const rows = $derived(mode === 'paged' ? sorted.slice(from, from + pageSize) : sorted);

	const columns: TableGridColumn[] = $derived([
		{ name: 'id', title: '№', size: { width: 90 } },
		{ name: 'name', title: 'Клиент', size: { width: 240 } },
		{ name: 'city', title: 'Город', size: { width: 200 } },
		{ name: 'status', title: 'Статус', size: { width: 160 } },
		{ name: 'amount', title: 'Сумма', unit: '₽', align: 'right', size: { width: 140 }, sorting: { sort, onSort: () => (sort = sort === 'default' ? 'asc' : sort === 'asc' ? 'desc' : 'default') } },
		{ name: 'date', title: 'Дата', size: { width: 140 } }
	]);

	// --- the panel ----------------------------------------------------------------------------------------------------------------
	let host = $state<HTMLDivElement>();
	let renderedRows = $state(0);
	let firstRenderMs = $state(0);
	let fps = $state(0);
	let autoScroll = $state(false);
	const t0 = performance.now();

	const go = (next: Record<string, string>) => {
		const u = new URLSearchParams(location.search);
		for (const [k, v] of Object.entries(next)) u.set(k, v);
		location.search = u.toString();
	};

	onMount(() => {
		document.body.className = `Theme_root_${theme} rt-base`;
		requestAnimationFrame(() => requestAnimationFrame(() => (firstRenderMs = Math.round(performance.now() - t0))));
		let frames = 0;
		let last = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			frames++;
			if (now - last >= 1000) {
				fps = Math.round((frames * 1000) / (now - last));
				renderedRows = document.querySelectorAll('.atmr-tablegrid__row[data-table-row]').length - 1; // - the header row
				frames = 0;
				last = now;
			}
			const layout = host?.querySelector<HTMLElement>('.atmr-tablegrid__layout');
			if (autoScroll && layout) {
				const range = layout.scrollHeight - layout.clientHeight;
				const p = ((now / 1000) * 1500) % (2 * range); // 1500 px / s, ping-pong over the whole list
				layout.scrollTop = p < range ? p : 2 * range - p;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#snippet selectAll()}
	<Checkbox variant="primary" checked={selected.length === N} indeterminate={selected.length > 0 && selected.length < N} onChange={(v: boolean) => (selected = v ? all.map((r) => String(r.id)) : [])} />
{/snippet}
{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={N}
		{pageSize}
		{page}
		onPageChange={(p: number) => (page = p)}
		onPageSizeChange={(size: number) => {
			pageSize = size;
			page = 1;
		}}
		total={{ enabled: true, label: `Строки ${from + 1}-${Math.min(from + pageSize, N)} из ${N}` }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [20, 50, 100] }}
	/>
{/snippet}

<div style="padding: 24px; display: flex; flex-direction: column; gap: 16px; max-width: 1100px">
	<Typography variant="heading-h5">TableGrid: {N.toLocaleString('ru-RU')} строк, режим «{mode}»</Typography>
	<div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center">
		{#each ['virtual', 'paged', 'all'] as m (m)}
			<Button size="s" variant={m === mode ? 'primary' : 'outline'} colorScheme={m === mode ? 'accent' : 'neutral'} label={m} onclick={() => go({ mode: m })} />
		{/each}
		<span style="width: 16px"></span>
		{#each [1000, 10000, 100000] as n (n)}
			<Button size="s" variant={n === N ? 'primary' : 'outline'} colorScheme={n === N ? 'accent' : 'neutral'} label={n.toLocaleString('ru-RU')} onclick={() => go({ rows: String(n) })} />
		{/each}
		<span style="width: 16px"></span>
		<Button size="s" variant="outline" colorScheme="neutral" label={autoScroll ? 'Стоп' : 'Автопрокрутка'} onclick={() => (autoScroll = !autoScroll)} />
	</div>
	<Typography variant="body-m">
		В DOM строк: <b>{renderedRows}</b> · первый рендер: <b>{firstRenderMs} мс</b> · кадров/с: <b>{fps}</b> · выбрано: <b>{selected.length}</b>
		{#if mode === 'all' && N > 1000}· режим «all» на такой размер медленный: браузер считает стили и раскладку ~{Math.round((N * 19) / 1000)} тыс. элементов{/if}
	</Typography>

	<div bind:this={host}>
		<TableGrid
			id="table-perf"
			{columns}
			{rows}
			columnConfig={{ sorting: true, resize: true }}
			headerSticky
			footerSticky={mode === 'paged'}
			containerStyle={{ maxHeight: 560 }}
			virtual={mode === 'virtual' ? { isEnable: true, overscanCount: 4 } : undefined}
			rowConfig={{ selection: { defaultSelected: selected, onSelectionChange: (keys: string[]) => (selected = keys), renderFirstColumnHeader: selectAll } }}
			renders={{ footer: mode === 'paged' ? footer : undefined }}
		/>
	</div>
</div>
