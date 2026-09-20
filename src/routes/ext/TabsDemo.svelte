<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the Tabs motion (src/lib/ext/indicatorMotion.svelte.ts). Every component is the ORIGINAL TabsGroup / TabsItem / TabsPanel. 'Выкл' = the
	// original (each tab draws its own underline with a CSS transition of its width, a panel appears at once); 'Svelte' = one indicator glides from the
	// previous tab to the new one (Tween, or Spring that may overshoot a little) and the panel fades and slides in. The last rows override the mode with
	// the `motion` prop.
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TabsPanel from '$lib/components/Tabs/TabsPanel/TabsPanel.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import type { MotionProp } from '$lib/ext/motion.svelte.js';
	import LocalMode from './LocalMode.svelte';

	const TABS = [
		{ index: '0', label: 'Интернет', text: 'Домашний интернет до 1 Гбит/с: подключение за один день, роутер в подарок.' },
		{ index: '1', label: 'Телевидение', text: 'Более 300 каналов, архив передач и онлайн-кинотеатр в одной подписке.' },
		{ index: '2', label: 'Мобильная связь', text: 'Безлимитные соцсети и мессенджеры, минуты и гигабайты без переплат.' },
		{ index: '3', label: 'Безопасность', text: 'Видеонаблюдение, умный домофон и охрана квартиры под управлением одного приложения.' }
	];
	let a = $state('0');
	let b = $state('1');
	let off = $state('0');
	let spring = $state('0');
	let sizeS = $state('0');
</script>

{#snippet block(id: string, value: string, set: (v: string) => void, motion: MotionProp, size: 's' | 'm' = 'm')}
	<div data-testid="{id}">
		<TabsGroup {value} onChange={(i) => set(i)} {size} {motion} data-testid="{id}-group">
			{#each TABS as t (t.index)}
				<TabsItem index={t.index} label={t.label} data-testid="{id}-tab-{t.index}" />
			{/each}
		</TabsGroup>
		<div class="panel">
			{#each TABS as t (t.index)}
				<TabsPanel {value} index={t.index} {motion} data-testid="{id}-panel-{t.index}">
					<Typography variant="body-m" as="p">{t.text}</Typography>
				</TabsPanel>
			{/each}
		</div>
	</div>
{/snippet}

<LocalMode param="tabs" id="tabs">
	<div class="grid">
		<div class="cell" data-testid="tabs-cell-a">
			<Typography variant="body-s" strong as="span">TabsGroup · size m</Typography>
			<Typography variant="body-s" as="span" class="muted">Подчёркивание «переезжает» с вкладки на вкладку; панель проявляется и сдвигается.</Typography>
			{@render block('tabs-a', a, (v) => (a = v), undefined)}
		</div>

		<div class="cell" data-testid="tabs-cell-s">
			<Typography variant="body-s" strong as="span">TabsGroup · size s</Typography>
			<Typography variant="body-s" as="span" class="muted">Тот же индикатор у маленького размера (высота линии из токенов).</Typography>
			{@render block('tabs-s', sizeS, (v) => (sizeS = v), undefined, 's')}
		</div>

		<div class="cell" data-testid="tabs-cell-off">
			<Typography variant="body-s" strong as="span">{'motion={false}'}</Typography>
			<Typography variant="body-s" as="span" class="muted">Проп сильнее режима: всегда оригинал (у каждой вкладки своя линия).</Typography>
			{@render block('tabs-off', off, (v) => (off = v), false)}
		</div>

		<div class="cell" data-testid="tabs-cell-spring">
			<Typography variant="body-s" strong as="span">{'motion="spring"'}</Typography>
			<Typography variant="body-s" as="span" class="muted">Всегда Svelte: индикатор на пружине (Spring), немного «перелетает» и успокаивается.</Typography>
			{@render block('tabs-spring', spring, (v) => (spring = v), 'spring')}
		</div>

		<div class="cell" data-testid="tabs-cell-b">
			<Typography variant="body-s" strong as="span">Две группы независимы</Typography>
			<Typography variant="body-s" as="span" class="muted">Каждая группа ведёт свой индикатор.</Typography>
			{@render block('tabs-b', b, (v) => (b = v), undefined)}
		</div>
	</div>
</LocalMode>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: var(--atmr-spacing-3x);
		align-items: start;
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
	.panel {
		min-height: 64px;
		padding: var(--atmr-spacing-3x) 0;
	}
</style>
