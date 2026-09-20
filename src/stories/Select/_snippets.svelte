<script module lang="ts">
	// Snippets of the item lists of stories/Multiselect/constants.tsx and stories/Select/constants.tsx (React kept `prefix: () => <Heart />` ...
	// functions; Svelte item `prefix` / `suffix` are Snippets taking the item). Used by ./_options.ts.
	import Heart from '$lib/icons/24/rating/Heart.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';

	export { heartPrefix, kebabSuffix, slotPrefix1, slotPrefix2, slotPrefix3, slotPrefix4, slotPrefix5, unionSuffix, kodSuffix, atomaroSuffix };
</script>

{#snippet kebab()}<MenuKebab />{/snippet}

{#snippet heartPrefix()}<Heart size={16} />{/snippet}

{#snippet kebabSuffix(item: DropdownMenuItem)}
	<IconButton
		icon={kebab}
		variant="ghost"
		size="s"
		onclick={(event: MouseEvent) => {
			event.stopPropagation();
			// eslint-disable-next-line no-console
			console.log(item.value);
		}}
	/>
{/snippet}

{#snippet unionSuffix()}<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>Union</Typography>{/snippet}
{#snippet kodSuffix()}<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>KOD</Typography>{/snippet}
{#snippet atomaroSuffix()}<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>Atomaro</Typography>{/snippet}

{#snippet slotPrefix1()}<img src="./static/selectSlotsStoryImages/Image_1@2x.png" alt="dropdown-option1" height="36" width="36" />{/snippet}
{#snippet slotPrefix2()}<img src="./static/selectSlotsStoryImages/Image_2@2x.png" alt="dropdown-option1" height="36" width="36" />{/snippet}
{#snippet slotPrefix3()}<img src="./static/selectSlotsStoryImages/Image_3@2x.png" alt="dropdown-option1" height="36" width="36" />{/snippet}
{#snippet slotPrefix4()}<img src="./static/selectSlotsStoryImages/Image_4@2x.png" alt="dropdown-option1" height="36" width="36" />{/snippet}
{#snippet slotPrefix5()}<img src="./static/selectSlotsStoryImages/Image_5@2x.png" alt="dropdown-option1" height="36" width="36" />{/snippet}
