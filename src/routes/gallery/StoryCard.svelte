<script lang="ts" module>
	export interface GalleryStory {
		id: string;
		title: string;
		name: string;
		implemented: boolean;
		mtime: number;
		status: { ok: boolean; time: number; states: Record<string, boolean>; failing: string[] } | null;
		states: string[];
	}

	export const kindOf = (s: GalleryStory) => (!s.implemented ? 'todo' : !s.status ? 'built' : s.status.ok ? 'pass' : 'fail');
	export const BADGES = {
		todo: { scheme: 'neutral', text: 'todo' },
		built: { scheme: 'info', text: 'not compared' },
		pass: { scheme: 'success', text: 'PASS' },
		fail: { scheme: 'error', text: 'FAIL' }
	} as const;
</script>

<script lang="ts">
	// One story: our live Svelte render (iframe -> /story/<id>, hot-reloads while agents edit), the reference screenshot and the last diff.
	// The card itself is built from rt-ui components (Typography, Badge, Button).
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';

	let {
		story,
		view,
		stateName,
		zoom = 1,
		theme
	}: { story: GalleryStory; view: 'both' | 'ours' | 'ref' | 'diff'; stateName: string; zoom?: number; theme: string } = $props();

	const W = 1280;
	const H = 800;
	let visible = $state(false);
	let widths = $state<Record<string, number>>({});

	function inview(node: HTMLElement) {
		const io = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) {
					visible = true;
					io.disconnect();
				}
			},
			{ rootMargin: '400px' }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	const panels = $derived(view === 'both' ? ['ours', 'ref'] : [view]);
	const state = $derived(story.states.includes(stateName) ? stateName : 'default');
	const kind = $derived(kindOf(story));
	const badge = $derived(BADGES[kind]);
	const ago = $derived(story.status ? Math.max(0, Math.round((Date.now() - story.status.time * 1000) / 60000)) : null);
	const lightRef = $derived(theme === 'rtk_default_light');
</script>

<article class="card {kind}" use:inview>
	<header>
		<div class="ttl">
			<Typography variant="body-s" strong elipsis>{story.name}</Typography>
			<Typography variant="description-s" elipsis>{story.id}</Typography>
		</div>
		<span title={ago !== null ? `compared ${ago} min ago${story.status && !story.status.ok ? ' · failing: ' + story.status.failing.join(', ') : ''}` : ''}>
			<Badge size="s" variant="secondary" colorScheme={badge.scheme} label={badge.text} />
		</span>
		<Button size="s" variant="ghost" colorScheme="neutral" label="↗" title="open story alone" onclick={() => window.open(`/story/${story.id}?theme=${theme}&base=1`, '_blank')} />
	</header>

	<div class="panels" style="grid-template-columns: repeat({panels.length}, minmax(0, 1fr))">
		{#each panels as p (p)}
			<div class="panel">
				<span class="tag">
					{p === 'ours' ? 'Svelte (rt-ui)' : p === 'ref' ? (lightRef ? 'React reference' : 'React reference · light only') : 'diff vs reference'}
				</span>
				<div class="frame" bind:clientWidth={widths[p]} style="aspect-ratio: {W} / {H}">
					<div class="zoom" style="transform: {p === 'ours' ? 'none' : `scale(${zoom})`}">
						{#if !visible}
							<div class="ph">…</div>
						{:else if p === 'ours'}
							{#if story.implemented}
								{#key story.implemented + theme}
									<div class="scaler">
										<iframe title={story.id} src="/story/{story.id}?theme={theme}&base=1" loading="lazy" style="transform: translateX({((widths[p] || 400) - W * ((widths[p] || 400) / W) * zoom) / 2}px) scale({((widths[p] || 400) / W) * zoom})"></iframe>
									</div>
								{/key}
							{:else}
								<div class="ph">not implemented yet</div>
							{/if}
						{:else if p === 'ref'}
							<img src="/api/img/ref/{story.id}/{state}" alt="reference {story.id}" loading="lazy" />
						{:else if story.status && !story.status.ok}
							<img src="/api/img/diff/{story.id}/{story.status.failing.includes(state) ? state : story.status.failing[0]}?t={Math.floor(story.status.time)}" alt="diff" loading="lazy" />
						{:else}
							<div class="ph">{story.status ? 'identical ✓' : 'no compare run yet'}</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</article>

<style>
	.card { background: var(--atmr-bg-surface1); border: var(--atmr-border-width-s) solid var(--atmr-border-soft); border-radius: var(--atmr-border-radius-l); overflow: hidden; display: flex; flex-direction: column; }
	.card.pass { border-color: var(--atmr-base-success); }
	.card.fail { border-color: var(--atmr-base-error); }
	header { display: flex; align-items: center; gap: var(--atmr-spacing-2x); padding: var(--atmr-spacing-2x) var(--atmr-spacing-3x); border-bottom: var(--atmr-border-width-s) solid var(--atmr-border-muted); }
	.ttl { flex: 1; min-width: 0; display: flex; flex-direction: column; }
	.panels { display: grid; gap: 1px; background: var(--atmr-border-muted); }
	.panel { background: var(--atmr-bg-surface2); position: relative; min-width: 0; }
	.tag { position: absolute; z-index: 2; top: 4px; left: 4px; font-size: 10px; background: rgba(20, 24, 40, 0.72); color: #fff; padding: 1px 6px; border-radius: var(--atmr-border-radius-xs); pointer-events: none; }
	.frame { position: relative; width: 100%; overflow: hidden; }
	.frame img { width: 100%; height: 100%; object-fit: contain; object-position: top left; display: block; }
	.ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--atmr-fg-muted); font-size: 12px; }
	/* the iframe is a real 1280x800 page scaled down to the panel width */
	.zoom { position: absolute; inset: 0; transform-origin: 50% 0; }
	.scaler { position: absolute; inset: 0; }
	iframe { border: 0; width: 1280px; height: 800px; transform-origin: 0 0; background: var(--atmr-bg-surface2); }
</style>
