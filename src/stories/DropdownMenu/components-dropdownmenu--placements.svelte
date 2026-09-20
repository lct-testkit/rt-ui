<script lang="ts">
	// Port of stories/DropdownMenu Placements: one closed DropdownMenu per placement, opened by its button; the `emptyText` node is the content.
	//
	// React: every menu has its own useState inside the story's render function, so ANY state change re-renders the whole story, i.e. all
	// twelve menus; only from that re-render on `usePopper` gets its refs and creates a Popper instance (also for the closed menus, which then
	// carry `data-popper-placement` + inline style). Svelte does not re-render siblings, so the first state change flips `rerendered`, which
	// makes every menu create its instance (usePopper `lazy: false`).
	import './_styles.css';
	import './_placements.css';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import type { PlacementsType } from '$lib/hooks/usePopper/constants.js';
	import { PLACEMENTS_MAP } from './_options.js';

	let opened = $state<Record<string, boolean>>({});
	let rerendered = $state(false);

	function setOpened(placement: string, value: boolean) {
		if (!!opened[placement] !== value) rerendered = true;
		opened[placement] = value;
	}
</script>

{#snippet emptyText()}<div style="padding: 12px;">Content</div>{/snippet}

{#snippet renderRootButtons(placements: readonly PlacementsType[])}
	{#each placements as placement (placement)}
		<div style="width: min-content;">
			<DropdownMenu
				size="m"
				variant="primary"
				items={[]}
				{emptyText}
				useInPortal={false}
				style={{ alignItems: 'center', justifyContent: 'center' }}
				class="--stories-placement"
				isOpened={!!opened[placement]}
				{placement}
				onClose={() => setOpened(placement, false)}
				usePopperProps={rerendered ? { lazy: false } : undefined}
			>
				<Button style="margin: 15px;" label={placement} onclick={() => setOpened(placement, !opened[placement])} />
			</DropdownMenu>
		</div>
	{/each}
{/snippet}

<div class="placements_container">
	<div class="siderow">{@render renderRootButtons(PLACEMENTS_MAP[0])}</div>
	<div class="centralrow">
		<div class="leftcolumn">{@render renderRootButtons(PLACEMENTS_MAP[1])}</div>
		<div class="rightcolumn">{@render renderRootButtons(PLACEMENTS_MAP[2])}</div>
	</div>
	<div class="siderow">{@render renderRootButtons(PLACEMENTS_MAP[3])}</div>
</div>
