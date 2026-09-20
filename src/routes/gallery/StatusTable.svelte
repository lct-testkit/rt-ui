<script lang="ts">
	// Status board of all stories as a real TableGrid (rt-ui) — sortable columns, row click opens the story.
	import { TableGrid, type TableGridColumn, type TableGridRow } from '$lib/components/TableGrid';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import { BADGES, kindOf, type GalleryStory } from './StoryCard.svelte';

	let { stories, theme }: { stories: GalleryStory[]; theme: string } = $props();

	interface Row extends TableGridRow {
		id: string;
		section: string;
		name: string;
		kind: string;
		failing: string;
		compared: string;
		order: number;
	}

	type Dir = 'asc' | 'desc' | 'default';
	let sortKey = $state<string>('');
	let sortDir = $state<Dir>('default');
	const ORDER = { fail: 0, built: 1, pass: 2, todo: 3 } as const;

	const base = $derived<Row[]>(
		stories.map((s, i) => ({
			id: s.id,
			section: s.title,
			name: s.name,
			kind: kindOf(s),
			failing: s.status && !s.status.ok ? s.status.failing.join(', ') : '',
			compared: s.status ? new Date(s.status.time * 1000).toLocaleTimeString('ru-RU', { hour12: false }) : '',
			order: i
		}))
	);
	const rows = $derived.by(() => {
		if (sortDir === 'default' || !sortKey) return base;
		const k = sortKey as keyof Row;
		const mul = sortDir === 'asc' ? 1 : -1;
		return [...base].sort((a, b) => {
			const av = k === 'kind' ? ORDER[a.kind as keyof typeof ORDER] : String(a[k]);
			const bv = k === 'kind' ? ORDER[b.kind as keyof typeof ORDER] : String(b[k]);
			return (av < bv ? -1 : av > bv ? 1 : 0) * mul;
		});
	});

	const sorting = (key: string) => ({
		sort: sortKey === key ? sortDir : ('default' as Dir),
		onSort: () => {
			if (sortKey !== key) { sortKey = key; sortDir = 'asc'; }
			else sortDir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? 'default' : 'asc';
		}
	});

	const columns: TableGridColumn<Row>[] = $derived([
		{ name: 'section', title: 'Section', size: { width: 260 }, sorting: sorting('section') },
		{ name: 'name', title: 'Story', size: { width: 240 }, sorting: sorting('name') },
		{ name: 'kind', title: 'Status', size: { width: 150 }, sorting: sorting('kind'), render: statusCell },
		{ name: 'failing', title: 'Failing states', size: { width: 260 } },
		{ name: 'compared', title: 'Compared', size: { width: 110 }, align: 'right' },
		{ name: 'id', title: 'Story id', size: { width: 420 } }
	]);
</script>

{#snippet statusCell(row: Row)}
	{@const b = BADGES[row.kind as keyof typeof BADGES]}
	<Badge size="s" variant="secondary" colorScheme={b.scheme} label={b.text} />
{/snippet}

<div class="wrap">
	<TableGrid
		id="gallery-status"
		size="s"
		{columns}
		{rows}
		columnConfig={{ sorting: true }}
		containerStyle={{ maxHeight: 'calc(100vh - 230px)' }}
		headerSticky
		alignCells
		rowConfig={{ key: 'id', highlightOnClick: true, onClick: (id: string | number) => window.open(`/story/${id}?theme=${theme}&base=1`, '_blank') }}
	/>
</div>

<style>
	.wrap { padding: 0 var(--atmr-spacing-4x); }
</style>
