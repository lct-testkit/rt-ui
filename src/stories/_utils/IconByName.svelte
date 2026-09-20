<script lang="ts">
	// Renders an icon of the story icon maps by name (see ./icons.ts):
	//   <IconByName name="search" />                       24px set (ICONS)
	//   <IconByName name="passwordShow16" set="small" />   ICONS_SMALL
	//   <IconByName name="search16" set="dropdownMenu" />  ICONS_DROPDOWN_MENU  (name "true" / unknown name renders nothing)
	//   <IconByName name="folderOpen" set="tree" />        ICONS_TREE
	// Extra props (size, class, fill ...) are passed to the icon component.
	// Typical use as a Snippet for a node prop:  {#snippet iconPrefix()}<IconByName name={args.iconPrefix} />{/snippet}
	import { getIcon, type IconSet } from './icons.js';

	let { name, set = 'icons', ...rest }: { name?: string | null; set?: IconSet; [key: string]: unknown } = $props();

	const Icon = $derived(getIcon(name, set));
</script>

{#if Icon && Icon !== true}<Icon {...rest} />{/if}
