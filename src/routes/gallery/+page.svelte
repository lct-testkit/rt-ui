<script lang="ts">
	// Live gallery of the Svelte port — the site itself is built from rt-ui components (Typography, Input, Select, SegmentedControl,
	// Switch, Button, Badge, TableGrid) and is themeable with the four Rostelecom themes. It updates while agents work.
	import { onMount } from 'svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Seg from './Seg.svelte';
	import StatusTable from './StatusTable.svelte';
	import StoryCard, { kindOf, type GalleryStory } from './StoryCard.svelte';

	const THEMES = [
		{ key: 'rtk_default_light', value: 'Rostelecom · светлая' },
		{ key: 'rtk_default_dark', value: 'Rostelecom · тёмная' },
		{ key: 'rtk_purple_light', value: 'Purple · светлая' },
		{ key: 'rtk_purple_dark', value: 'Purple · тёмная' }
	];

	let stories = $state<GalleryStory[]>([]);
	let updated = $state(0);
	let error = $state('');

	let mode = $state<'gallery' | 'table'>('gallery');
	let view = $state<'both' | 'ours' | 'ref' | 'diff'>('both');
	let cols = $state(2);
	let zoom = $state(1);
	let filter = $state<'all' | 'done' | 'pass' | 'fail' | 'built' | 'todo'>('all');
	let q = $state('');
	let section = $state('all');
	let stateName = $state('default');
	let live = $state(true);
	let theme = $state('rtk_default_light');

	const KEY = 'rt-gallery-prefs-v2';
	let prevBody = '';
	onMount(() => {
		prevBody = document.body.className;
		try {
			const p = JSON.parse(localStorage.getItem(KEY) ?? '{}');
			mode = p.mode ?? mode; view = p.view ?? view; cols = p.cols ?? cols; zoom = p.zoom ?? zoom;
			filter = p.filter ?? filter; section = p.section ?? section; theme = p.theme ?? theme;
		} catch { /* no storage */ }
		// deep links (for slides / sharing): /gallery?q=tablegrid&theme=rtk_purple_dark&mode=table&view=ours&cols=1&zoom=1&filter=pass&section=Components&state=hover1
		const u = new URLSearchParams(location.search);
		if (u.has('q')) q = u.get('q')!;
		if (u.has('mode')) mode = u.get('mode') as typeof mode;
		if (u.has('view')) view = u.get('view') as typeof view;
		if (u.has('cols')) cols = Number(u.get('cols'));
		if (u.has('zoom')) zoom = Number(u.get('zoom'));
		if (u.has('filter')) filter = u.get('filter') as typeof filter;
		if (u.has('section')) section = u.get('section')!;
		if (u.has('theme')) theme = u.get('theme')!;
		if (u.has('state')) stateName = u.get('state')!;
		load();
		const t = setInterval(() => live && load(), 3000);
		return () => { clearInterval(t); document.body.className = prevBody; };
	});
	$effect(() => {
		document.body.className = `Theme_root_${theme} rt-base rt-gallery`;
	});
	$effect(() => {
		try { localStorage.setItem(KEY, JSON.stringify({ mode, view, cols, zoom, filter, section, theme })); } catch { /* no storage */ }
	});

	async function load() {
		try {
			const d = await (await fetch('/api/stories')).json();
			// keep object identity stable for unchanged stories so iframes are not recreated
			const byId = new Map(stories.map((s) => [s.id, s]));
			stories = d.stories.map((n: GalleryStory) => {
				const o = byId.get(n.id);
				return o && o.implemented === n.implemented && o.mtime === n.mtime && JSON.stringify(o.status) === JSON.stringify(n.status) && o.states.length === n.states.length ? o : n;
			});
			updated = d.generatedAt;
			error = '';
		} catch (e) {
			error = String(e);
		}
	}

	const counts = $derived({
		total: stories.length,
		impl: stories.filter((s) => s.implemented).length,
		pass: stories.filter((s) => kindOf(s) === 'pass').length,
		fail: stories.filter((s) => kindOf(s) === 'fail').length,
		built: stories.filter((s) => kindOf(s) === 'built').length
	});
	const sections = $derived([...new Set(stories.map((s) => s.title.split('/')[0]))]);
	const sectionItems = $derived([{ key: 'all', value: 'Все разделы' }, ...sections.map((s) => ({ key: s, value: s }))]);
	const allStates = $derived([...new Set(stories.flatMap((s) => s.states))].sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b))));
	const stateItems = $derived(allStates.map((s) => ({ key: s, value: s === 'default' ? 'состояние: default' : s })));
	const shown = $derived(
		stories.filter((s) => {
			const k = kindOf(s);
			if (filter === 'done' ? !s.implemented : filter !== 'all' && k !== filter) return false;
			if (section !== 'all' && s.title.split('/')[0] !== section) return false;
			if (q && !(s.id + ' ' + s.title + ' ' + s.name).toLowerCase().includes(q.toLowerCase())) return false;
			return true;
		})
	);
	const groups = $derived.by(() => {
		const m = new Map<string, GalleryStory[]>();
		for (const s of shown) (m.get(s.title) ?? m.set(s.title, []).get(s.title)!).push(s);
		// groups that already have work in them come first (stable otherwise = storybook order)
		return [...m.entries()].sort(([, a], [, b]) => Number(b.some((x) => x.implemented)) - Number(a.some((x) => x.implemented)));
	});
	const pct = (n: number) => (counts.total ? (n / counts.total) * 100 : 0);
</script>

<svelte:head><title>rt-ui · gallery</title></svelte:head>

<div class="bar">
	<div class="top">
		<Typography variant="heading-h4" as="h1">rt-ui <span class="sub">порт дизайн-системы Ростелекома на Svelte · live</span></Typography>
		<div class="badges">
			<Badge size="s" colorScheme="success" label="{counts.pass} pass" />
			<Badge size="s" colorScheme="error" label="{counts.fail} fail" />
			<Badge size="s" colorScheme="info" label="{counts.built} не сверено" />
			<Badge size="s" variant="secondary" colorScheme="neutral" label="{counts.impl}/{counts.total} реализовано" />
		</div>
		<div class="spacer"></div>
		<Seg options={[['gallery', 'Галерея'], ['table', 'Таблица']]} value={mode} onChange={(v) => (mode = v)} />
		<div class="theme"><Select size="s" items={THEMES} value={theme} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k: string) => k && (theme = k)} /></div>
		<Switch size="s" label="live" checked={live} onChange={(v: boolean) => (live = v)} />
		<Button size="s" variant="outline" colorScheme="neutral" label="Обновить" onclick={load} />
		<Button size="s" variant="ghost" colorScheme="neutral" label="Графики (вне оригинала)" onclick={() => (location.href = '/charts')} data-testid="nav-charts" />
	</div>

	<div class="progress" title="pass / fail / не сверено">
		<i class="p" style="width:{pct(counts.pass)}%"></i><i class="f" style="width:{pct(counts.fail)}%"></i><i class="b" style="width:{pct(counts.built)}%"></i>
	</div>

	<div class="controls">
		<div class="search"><Input size="s" placeholder="Поиск по сторис" clearable value={q} onChange={(e: any) => (q = e.target.value)} onClear={() => (q = '')} /></div>
		<div class="section"><Select size="s" items={sectionItems} value={section} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k: string) => (section = k || 'all')} /></div>
		<Seg options={[['all', 'все'], ['done', 'готовые'], ['pass', 'pass'], ['fail', 'fail'], ['built', 'не сверено'], ['todo', 'todo']]} value={filter} onChange={(v) => (filter = v)} />
		{#if mode === 'gallery'}
			<Seg options={[['both', 'ours | ref'], ['ours', 'ours'], ['ref', 'reference'], ['diff', 'diff']]} value={view} onChange={(v) => (view = v)} />
			<div class="state"><Select size="s" items={stateItems} value={stateName} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k: string) => k && (stateName = k)} /></div>
			<Seg options={[[1, '1×'], [2, '2×'], [3, '3×'], [4, '4×']]} value={cols} onChange={(v) => (cols = v)} />
			<Seg options={[[1, 'zoom 1'], [2, 'zoom 2'], [3, 'zoom 3']]} value={zoom} onChange={(v) => (zoom = v)} />
		{/if}
		<Typography variant="description-s">{shown.length} сторис{updated ? ' · ' + new Date(updated).toLocaleTimeString('ru-RU', { hour12: false }) : ''}</Typography>
	</div>
	{#if error}<div class="err">API: {error}</div>{/if}
</div>

{#if mode === 'table'}
	<div class="tablepage"><StatusTable stories={shown} {theme} /></div>
{:else}
	<main>
		{#each groups as [title, items] (title)}
			<section>
				<div class="h2">
					<Typography variant="heading-h5" as="h2">{title}</Typography>
					<Typography variant="description-s">{items.filter((s) => kindOf(s) === 'pass').length}/{items.length} pass{items.some((s) => kindOf(s) === 'fail') ? ` · ${items.filter((s) => kindOf(s) === 'fail').length} fail` : ''}</Typography>
				</div>
				<div class="grid" style="grid-template-columns: repeat({cols}, minmax(0, 1fr))">
					{#each items as s (s.id)}<StoryCard story={s} {view} {stateName} {zoom} {theme} />{/each}
				</div>
			</section>
		{:else}
			<p class="empty"><Typography variant="body-m">ничего не найдено</Typography></p>
		{/each}
	</main>
{/if}

<style>
	:global(body.rt-gallery) { margin: 0; background: var(--atmr-bg-page-filled); color: var(--atmr-fg-default); font-family: var(--atmr-font-family-body); }
	.bar { position: sticky; top: 0; z-index: 20; background: var(--atmr-bg-page); border-bottom: var(--atmr-border-width-s) solid var(--atmr-border-soft); padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x) var(--atmr-spacing-2x); }
	.top { display: flex; align-items: center; gap: var(--atmr-spacing-3x); flex-wrap: wrap; }
	.sub { color: var(--atmr-fg-muted); font-weight: 400; font-size: 13px; margin-left: 8px; }
	.badges { display: flex; gap: var(--atmr-spacing-2x); align-items: center; }
	.spacer { flex: 1; }
	.theme { width: 210px; }
	.progress { display: flex; height: 4px; border-radius: 99px; background: var(--atmr-bg-surface4); overflow: hidden; margin: var(--atmr-spacing-2x) 0; }
	.progress i { display: block; height: 100%; }
	.progress i.p { background: var(--atmr-base-success); } .progress i.f { background: var(--atmr-base-error); } .progress i.b { background: var(--atmr-base-info); }
	.controls { display: flex; flex-wrap: wrap; gap: var(--atmr-spacing-2x); align-items: center; }
	.search { width: 220px; } .section { width: 190px; } .state { width: 170px; }
	.err { color: var(--atmr-base-error); margin-top: 6px; }
	main { padding: var(--atmr-spacing-2x) var(--atmr-spacing-4x) 40px; }
	.h2 { display: flex; align-items: baseline; gap: var(--atmr-spacing-3x); margin: var(--atmr-spacing-6x) 0 var(--atmr-spacing-2x); }
	.grid { display: grid; gap: var(--atmr-spacing-3x); }
	.empty { padding: 40px; text-align: center; color: var(--atmr-fg-muted); }
	.tablepage { padding: var(--atmr-spacing-3x) 0 var(--atmr-spacing-6x); }
</style>
