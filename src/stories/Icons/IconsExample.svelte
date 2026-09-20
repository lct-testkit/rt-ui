<script lang="ts">
	// Port of the `IconsExample(iconsPack, category, args)` render helper of stories/Icons/Icons24.stories.tsx and Icons16.stories.tsx
	// (the two files only differ in the import path `@atomaro/icons/<set>/...` and in the `title` of the `span.icon` (16 only)).
	//
	//   <IconsExample iconsPack={pack} category="action" set="24" args={{ size: 24 }} />
	//
	// Every icon sits in a hover Tooltip (`placement="right"`, `enterDelay={600}`); the tooltip text (shared by all icons of the
	// story) is "Скопировать импорт" and becomes "Скопировано!" after a click (which also copies the import string).
	import { onMount, type Component } from 'svelte';
	import './_icons.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import handleClick from '$stories/_utils/iconsClickCopy.js';

	interface Props {
		/** `{ [iconName]: IconComponent }`, the webpack namespace object of `@atomaro/icons/<set>/<category>` */
		iconsPack: Record<string, Component<any>>;
		category: string;
		set: '24' | '16';
		/** story args (`{ size: 24 }` / `{ size: 16 }`), spread onto every icon */
		args: Record<string, unknown>;
	}

	let { iconsPack, category, set, args }: Props = $props();

	let text = $state('Скопировать импорт');

	// React creates the Popper instances of the (closed) tooltips one commit AFTER the first paint (`trigger` / `popper` are state set from
	// refs), by which time the webfont has arrived and the 120px labels have re-wrapped ("RostelecomSmartHomeFill" -> 2 lines). The stale
	// `translate()` of every closed tooltip below such a row therefore already includes the wrapped height. Svelte creates the instances
	// in the mount microtask, before the font is there, so mount the grid only once the label font is loaded (same DOM, same final layout).
	//
	// React's closed tooltips also keep Popper's default scroll/resize listeners (usePopper's `hide()` runs before the instance exists and is
	// only re-run when `open` changes), so a viewport resize (the harness' full-page screenshot of a page taller than the viewport, e.g.
	// Icons/24 Document) re-positions every closed tooltip. Svelte's usePopper applies `hide()` right at creation: `usePopperProps` keeps them on.
	let fontReady = $state(false);
	onMount(() => {
		const done = () => (fontReady = true);
		document.fonts.load('12px "Rostelecom Basis"').then(done, done);
	});
	const entries = $derived(Object.entries(iconsPack).filter(([, Icon]) => typeof Icon === 'function'));
</script>

{#if fontReady}
<div class="icons__container">
	{#each entries as [iconName, Icon] (iconName)}
		{@const copyString = `import ${iconName} from '@atomaro/icons/${set}/${category}/${iconName}';`}
		<span class="icon" title={set === '16' ? 'Скопировать строку импорта' : undefined}>
			<Tooltip
				placement="right"
				trigger="hover"
				enterDelay={600}
				onOpen={() => {
					text = 'Скопировать импорт';
				}}
				style={{ width: 'min-content' }}
				usePopperProps={{ enabled: true, eventListeners: true }}
			>
				{#snippet title()}<Typography variant="description-s">{text}</Typography>{/snippet}
				<Icon
					{...args}
					onclick={() => {
						handleClick(copyString);
						text = 'Скопировано!';
					}}
				/>
			</Tooltip>
			<Typography class="icon__name" variant="description-s">{iconName}</Typography>
		</span>
	{/each}
</div>
{/if}
