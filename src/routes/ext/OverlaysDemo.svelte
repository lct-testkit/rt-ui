<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the OVERLAY family with the author's Svelte motion (src/lib/ext/showMotion.svelte.ts): Popover, Tooltip, DropdownMenu
	// (+ Select / Multiselect, which are built on it), Modal and Drawer. Every component here is the ORIGINAL one; the mode switch below sets the
	// `mode` of a nested <ExtMotionProvider> ('Как на странице' = no nested provider: the page's own mode, off by default). With 'off' they open and
	// close exactly like the original (Popover / Tooltip / DropdownMenu instantly, Modal / Drawer with their CSS class transitions); with 'svelte' (a Tween) or 'spring' (a Spring) they
	// scale / fade from the popper placement, the modal fades + scales, the drawer slides from its edge and the overlay fades.
	// The last row overrides the mode with the `motion` prop of the component.
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';

	type Local = 'page' | 'off' | 'svelte' | 'spring';
	const LOCAL: [Local, string][] = [
		['page', 'Как на странице'],
		['off', 'Выкл (оригинал)'],
		['svelte', 'Svelte'],
		['spring', 'Svelte · Spring']
	];
	const PLACEMENTS = ['bottomLeft', 'bottomRight', 'topLeft', 'right'] as const;
	const POSITIONS = ['right', 'left', 'top', 'bottom'] as const;
	const ITEMS = [
		{ key: 'a', value: 'Первый пункт' },
		{ key: 'b', value: 'Второй пункт' },
		{ key: 'c', value: 'Третий пункт' },
		{ key: 'd', value: 'Четвёртый пункт' }
	];

	let local = $state<Local>('page');
	let placement = $state<(typeof PLACEMENTS)[number]>('bottomLeft');
	let position = $state<(typeof POSITIONS)[number]>('right');
	let tipOpen = $state(false);
	let ddOpen = $state(false);
	let modalOpen = $state(false);
	let drawerOpen = $state(false);
	let fullDrawer = $state(false);
	let fullModal = $state(false);
	const mode = $derived(local === 'svelte' || local === 'spring' ? 'svelte' : 'off');
	// 'spring': the window pops with a Svelte Spring (a small overshoot of scale / translate), the drawer slides in with a critically damped one
	const type = $derived(local === 'spring' ? 'spring' : 'tween');

	onMount(() => {
		const v = new URLSearchParams(location.search).get('ov');
		if (v === 'off' || v === 'svelte' || v === 'page' || v === 'spring') local = v;
	});
</script>

{#snippet body()}
	<div class="grid">
		<!-- Popover -->
		<div class="cell" data-testid="ov-cell-popover">
			<Typography variant="body-s" strong as="span">Popover</Typography>
			<div class="row">
				<Popover title="Заголовок" subtitle="Подзаголовок" body="Всплывающее окно вырастает из угла, обращённого к триггеру." {placement} popoverClassName="ov-pop-main">
					<Button size="s" variant="outline" colorScheme="neutral" label="Открыть Popover" data-testid="ov-popover-anchor" />
				</Popover>
			</div>
			<Typography variant="body-s" as="span" class="muted">Закрыть: клик мимо или «×».</Typography>
		</div>

		<!-- Tooltip -->
		<div class="cell" data-testid="ov-cell-tooltip">
			<Typography variant="body-s" strong as="span">Tooltip</Typography>
			<div class="row">
				<Tooltip title="Подсказка" subtitle="Задержки enterDelay / leaveDelay сохраняются" {placement} isOpened={tipOpen} enterDelay={0} leaveDelay={0} tooltipClassName="ov-tip">
					<span class="anchor" data-testid="ov-tooltip-anchor">Цель</span>
				</Tooltip>
				<Button size="s" variant="outline" colorScheme="neutral" label="Показать" onclick={() => (tipOpen = true)} data-testid="ov-tooltip-show" />
				<Button size="s" variant="ghost" colorScheme="neutral" label="Скрыть" onclick={() => (tipOpen = false)} data-testid="ov-tooltip-hide" />
			</div>
		</div>

		<!-- DropdownMenu -->
		<div class="cell" data-testid="ov-cell-dropdown">
			<Typography variant="body-s" strong as="span">DropdownMenu</Typography>
			<div class="row">
				<DropdownMenu items={ITEMS} isOpened={ddOpen} {placement} dropdownMenuClassName="ov-dd" onClose={() => (ddOpen = false)}>
					<Button size="s" variant="outline" colorScheme="neutral" label={ddOpen ? 'Закрыть меню' : 'Открыть меню'} onclick={() => (ddOpen = !ddOpen)} data-testid="ov-dropdown-anchor" />
				</DropdownMenu>
			</div>
		</div>

		<!-- Select / Multiselect: built on DropdownMenu, they get the motion of the provider for free -->
		<div class="cell" data-testid="ov-cell-select">
			<Typography variant="body-s" strong as="span">Select · Multiselect</Typography>
			<div class="row">
				<div class="field"><Select label="Select" size="s" items={ITEMS} autocomplete={{ enabled: false }} dropdownMenuClassName="ov-select-menu" data-testid="ov-select" /></div>
				<div class="field"><Multiselect label="Multiselect" size="s" items={ITEMS} dropdownMenuClassName="ov-multiselect-menu" data-testid="ov-multiselect" /></div>
			</div>
		</div>

		<!-- Modal -->
		<div class="cell" data-testid="ov-cell-modal">
			<Typography variant="body-s" strong as="span">Modal</Typography>
			<div class="row">
				<Button size="s" label="Открыть Modal" onclick={() => (modalOpen = true)} data-testid="ov-modal-open" />
				<Switch size="s" label="fullHeight" checked={fullModal} onChange={(v: boolean) => (fullModal = v)} data-testid="ov-modal-full" />
			</div>
			<Modal isOpened={modalOpen} maxWidth="420px" isCentered fullHeight={fullModal} onClose={() => (modalOpen = false)} modalClassName="ov-modal-box" overlayClassName="ov-modal-overlay" data-testid="ov-modal">
				<div class="dialog" data-testid="ov-modal-content">
					<Typography variant="heading-h5" as="h3">Модальное окно</Typography>
					<Typography variant="body-m" as="p">Окно и оверлей появляются Svelte-анимацией (fade + scale), закрытие — клик по оверлею, Esc или кнопка.</Typography>
					<div class="row"><Button size="m" label="Закрыть" onclick={() => (modalOpen = false)} data-testid="ov-modal-close" /></div>
				</div>
			</Modal>
		</div>

		<!-- Drawer -->
		<div class="cell" data-testid="ov-cell-drawer">
			<Typography variant="body-s" strong as="span">Drawer</Typography>
			<SegmentedControl size="s" value={position} onChange={(i: string) => (position = i as typeof position)}>
				{#each POSITIONS as p (p)}
					<Segment index={p} label={p} data-testid="ov-drawer-pos-{p}" />
				{/each}
			</SegmentedControl>
			<div class="row">
				<Button size="s" label="Открыть Drawer" onclick={() => (drawerOpen = true)} data-testid="ov-drawer-open" />
				<Switch size="s" label="fullHeight" checked={fullDrawer} onChange={(v: boolean) => (fullDrawer = v)} data-testid="ov-drawer-full" />
			</div>
			<Drawer isOpened={drawerOpen} {position} fullHeight={fullDrawer} dimension={position === 'left' || position === 'right' ? 360 : 220} onClose={() => (drawerOpen = false)} drawerClassName="ov-drawer-content" overlayClassName="ov-drawer-overlay" data-testid="ov-drawer">
				<div class="dialog" data-testid="ov-drawer-content">
					<Typography variant="heading-h5" as="h3">Drawer · {position}</Typography>
					<Typography variant="body-m" as="p">Панель выезжает от края <code>position</code>, оверлей плавно появляется.</Typography>
					<div class="row"><Button size="m" label="Закрыть" onclick={() => (drawerOpen = false)} data-testid="ov-drawer-close" /></div>
				</div>
			</Drawer>
		</div>
	</div>

	<Typography variant="body-s" strong as="p">Переопределение пропом <code>motion</code> (сильнее провайдера и переключателя выше)</Typography>
	<div class="grid">
		<div class="cell">
			<Typography variant="body-s" as="span" class="muted">{'motion={false} — всегда оригинал'}</Typography>
			<div class="row">
				<Popover title="motion=false" body="Появляется мгновенно, даже при включённом режиме." {placement} popoverClassName="ov-pop-off" motion={false}>
					<Button size="s" variant="outline" colorScheme="neutral" label="Popover" data-testid="ov-popover-off-anchor" />
				</Popover>
			</div>
		</div>
		<div class="cell">
			<Typography variant="body-s" as="span" class="muted">{'motion={{ duration: 700 }} — всегда Svelte, медленно'}</Typography>
			<div class="row">
				<Popover title="motion={'{{ duration: 700 }}'}" body="Анимируется даже при выключенном режиме." {placement} popoverClassName="ov-pop-on" motion={{ duration: 700 }}>
					<Button size="s" variant="outline" colorScheme="neutral" label="Popover" data-testid="ov-popover-on-anchor" />
				</Popover>
			</div>
		</div>
	</div>
{/snippet}

<div class="bar">
	<Typography variant="body-s" strong as="span">Режим оверлеев</Typography>
	<SegmentedControl size="s" value={local} onChange={(i: string) => (local = i as Local)}>
		{#each LOCAL as [k, label] (k)}
			<Segment index={k} {label} data-testid="ov-mode-{k}" />
		{/each}
	</SegmentedControl>
	<Typography variant="body-s" strong as="span">Placement</Typography>
	<SegmentedControl size="s" value={placement} onChange={(i: string) => (placement = i as typeof placement)}>
		{#each PLACEMENTS as p (p)}
			<Segment index={p} label={p} data-testid="ov-placement-{p}" />
		{/each}
	</SegmentedControl>
</div>

{#if local === 'page'}
	{@render body()}
{:else}
	<ExtMotionProvider {mode} {type}>
		{@render body()}
	</ExtMotionProvider>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		margin-bottom: var(--atmr-spacing-3x);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--atmr-spacing-3x);
		margin-bottom: var(--atmr-spacing-3x);
	}
	.cell {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
		min-height: 120px;
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
	.row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-2x) var(--atmr-spacing-3x);
	}
	.field {
		flex: 1 1 200px;
		min-width: 0;
	}
	.anchor {
		display: inline-block;
		padding: var(--atmr-spacing-1x) var(--atmr-spacing-3x);
		border-radius: var(--atmr-border-radius-m);
		border: var(--atmr-border-width-s) dashed var(--atmr-border-default);
		color: var(--atmr-fg-default);
	}
	.dialog {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-3x);
		padding: var(--atmr-spacing-6x);
		color: var(--atmr-fg-default);
	}
	:global(.muted) {
		color: var(--atmr-fg-muted);
	}
</style>
