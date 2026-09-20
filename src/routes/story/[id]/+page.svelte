<script lang="ts">
	// Playground for one story. Mirrors the Storybook iframe: same body classes (theme + sb-main-*),
	// same #storybook-root wrapper, so DOM and pixels can be compared 1:1 with the React reference.
	//   /story/<story-id>[?theme=rtk_purple_dark]
	// A story lives in src/stories/**/<story-id>.svelte
	import { page } from '$app/state';
	import { onMount, tick, type Component } from 'svelte';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';

	const stories = import.meta.glob('/src/stories/**/*.svelte') as Record<string, () => Promise<{ default: Component }>>;
	const layouts = import.meta.glob('/design/reference/*/layout.json', { import: 'default' }) as Record<string, () => Promise<{ bodyClass?: string }>>;

	const id = $derived(page.params.id ?? '');
	let Story = $state<Component | null>(null);
	let missing = $state(false);

	onMount(async () => {
		const storyKey = Object.keys(stories).find((k) => k.endsWith(`/${id}.svelte`));
		const layoutKey = `/design/reference/${id}/layout.json`;
		const layout = layouts[layoutKey] ? await layouts[layoutKey]() : null;

		// body classes exactly as in the reference (sb-main-padded | sb-main-centered | sb-main-fullscreen ...)
		const theme = page.url.searchParams.get('theme');
		let cls = layout?.bodyClass ?? 'Theme_root_rtk_default_light sb-main-padded sb-show-main';
		if (theme) cls = cls.replace(/Theme_root_\w+/, `Theme_root_${theme}`);
		// ?base=1 -> showcase for humans (gallery, sharing): rt-ui base layer instead of the original storybook's forced Times New Roman.
		// Never used by tools/compare.py, so pixel parity with the reference is unaffected.
		if (page.url.searchParams.get('base')) cls += ' rt-base rt-showcase';
		document.body.className = cls;

		if (storyKey) Story = (await stories[storyKey]()).default;
		else missing = true;

		await tick();
		await document.fonts.ready;
		window.__rtReady = true;
	});
</script>

<svelte:head><title>{id}</title></svelte:head>

<div id="storybook-root">
	<!-- Global decorator of the reference (.storybook/preview.js): every story is wrapped in <ToastNotificationsProvider position="topRight">.
	     It is mounted together with the story (`{#if}` below), so - like React's useEffect - its effect, which appends the shared portal div
	     (holding the toast container) to <body>, runs AFTER the effects of the story's own portals (e.g. a Select menu mounted closed with
	     `useInPortal`), and the story can read the stack with `useNotificationsStack()`. -->
	{#if Story || missing}
		<ToastNotificationsProvider position="topRight">
			{#if Story}
				<Story />
			{:else}
				<pre data-rt-missing style="color:#c00">MISSING STORY: src/stories/**/{id}.svelte</pre>
			{/if}
		</ToastNotificationsProvider>
	{/if}
</div>
