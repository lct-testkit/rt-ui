<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the Svelte transition presets (src/lib/ext/transitions.ts). This component sits INSIDE the page's
	// <ExtMotionProvider>, so `useMotion()` reads the provider: with mode 'off' the panels appear / disappear instantly
	// (zero-length transitions), with 'svelte' they fade / scale / fly / slide with the theme's motion tokens.
	import Switch from '$lib/components/Switch/Switch.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { useMotion } from '$lib/ext/motion.svelte.js';
	import { rtFade, rtFly, rtScale, rtSlide } from '$lib/ext/transitions.js';

	let open = $state(false);
	const m = useMotion(undefined, 'panel');
</script>

<div class="bar">
	<Switch size="s" label="Показать панели" checked={open} onChange={(v: boolean) => (open = v)} data-testid="t-toggle" />
	<Typography variant="body-s" as="span" class="hint" data-testid="t-state">
		useMotion(): {m.enabled ? `включено (${m.config?.type})` : 'выключено — оригинальное поведение, мгновенно'}
	</Typography>
</div>

<div class="cards">
	{#if open}
		<div class="card" transition:rtFade={m.transition()} data-testid="ext-fade"><b>rtFade</b><span>opacity, 's' · productive-standard</span></div>
		<div class="card" transition:rtScale={m.transition()} data-testid="ext-scale"><b>rtScale</b><span>scale + fade, 's' · productive-entrance</span></div>
		<div class="card" transition:rtFly={m.transition({ y: 24 })} data-testid="ext-fly"><b>rtFly</b><span>translate + fade, 'm' · expressive-entrance</span></div>
	{/if}
</div>

<div class="panel-slot">
	{#if open}
		<div class="panel" transition:rtSlide={m.transition()} data-testid="ext-panel">
			<Typography variant="body-m" strong as="p">Панель с rtSlide</Typography>
			<Typography variant="body-s" as="p">
				Высота панели анимируется Svelte-переходом <code>transition:rtSlide</code> с длительностью и кривой из токенов темы
				(<code>--atmr-motion-duration-m</code>, <code>--atmr-motion-easing-productive-standard</code>). Без включённого режима
				или при <code>prefers-reduced-motion: reduce</code> переход нулевой длины.
			</Typography>
		</div>
	{/if}
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-4x);
		margin-bottom: var(--atmr-spacing-3x);
	}
	.bar :global(.hint) {
		color: var(--atmr-fg-muted);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--atmr-spacing-3x);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-1x);
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-accent-soft);
		background: var(--atmr-accent-container-default);
		color: var(--atmr-fg-default);
		font-family: var(--atmr-font-family-body);
	}
	.card span {
		color: var(--atmr-fg-muted);
		font-size: 0.85em;
	}
	.panel-slot {
		margin-top: var(--atmr-spacing-3x);
	}
	.panel {
		padding: var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
		color: var(--atmr-fg-default);
		font-family: var(--atmr-font-family-body);
	}
	.panel :global(p) + :global(p) {
		margin-top: var(--atmr-spacing-1x);
	}
	code {
		font-size: 0.9em;
	}
</style>
