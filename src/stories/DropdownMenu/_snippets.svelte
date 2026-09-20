<script module lang="ts">
	// Snippets of the item lists of stories/DropdownMenu/constants.tsx (React kept `prefix: () => <Heart />` ... functions;
	// Svelte item `prefix` / `suffix` are Snippets). Used by ./_options.ts.
	import Heart from '$lib/icons/24/rating/Heart.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';

	export { heartPrefix, emberSuffix, shortcutSuffix, avatarPrefix1, avatarPrefix2, avatarPrefix3, avatarPrefix4 };
</script>

{#snippet kebab()}<MenuKebab />{/snippet}

{#snippet heartPrefix()}<Heart size={16} />{/snippet}

{#snippet emberSuffix()}
	<Popover trigger="hover" placement="top" offset={10}>
		<IconButton
			icon={kebab}
			variant="ghost"
			size="s"
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				e.preventDefault();
			}}
		/>
	</Popover>
{/snippet}

{#snippet shortcutSuffix()}⌥⌘\{/snippet}

{#snippet avatarPrefix1()}<img src="/story-assets/Image_storybook_1.png" alt="dropdown-option1" />{/snippet}
{#snippet avatarPrefix2()}<img src="/story-assets/Image_storybook_2.png" alt="dropdown-option2" />{/snippet}
{#snippet avatarPrefix3()}<img src="/story-assets/Image_storybook_3.png" alt="dropdown-option3" />{/snippet}
{#snippet avatarPrefix4()}<img src="/story-assets/Image_storybook_4.png" alt="dropdown-option4" />{/snippet}
