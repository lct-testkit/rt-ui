<script lang="ts">
	// EXAMPLE APP — CRM "Организации" (universities), built ONLY from rt-ui components: SideMenu, TopMenu, Breadcrumbs, Tabs, Input, Select,
	// Multiselect, InputDate, TableGrid (+ ActionBar, Pagination), Drawer, Modal, toasts. Open: /examples/crm
	//
	//   theme  = one class on <body> (`Theme_root_<theme>`) + `rt-base` (font + text colour of the app, opt-in layer of rt-ui)
	//   motion = the author's motion extension (ExtMotionProvider): OFF by default, outside the original design system
	//
	// Deep links (used by tools/screenshots.py): /examples/crm?theme=rtk_purple_dark&motion=1
	import { onMount } from 'svelte';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
	import CrmApp from './CrmApp.svelte';

	const THEMES = [
		{ key: 'rtk_default_light', value: 'Rostelecom · светлая' },
		{ key: 'rtk_default_dark', value: 'Rostelecom · тёмная' },
		{ key: 'rtk_purple_light', value: 'Purple · светлая' },
		{ key: 'rtk_purple_dark', value: 'Purple · тёмная' }
	];

	let theme = $state('rtk_default_light');
	let motion = $state(false);

	let prevBody = '';
	onMount(() => {
		prevBody = document.body.className;
		document.documentElement.classList.add('rt-crm-root');
		const u = new URLSearchParams(location.search);
		if (u.has('theme')) theme = u.get('theme')!;
		if (u.has('motion')) motion = u.get('motion') === '1';
		return () => {
			document.body.className = prevBody;
			document.documentElement.classList.remove('rt-crm-root');
		};
	});
	$effect(() => {
		document.body.className = `Theme_root_${theme} rt-base rt-crm`;
	});
</script>

<svelte:head><title>rt-ui · пример: CRM «Организации»</title></svelte:head>

<ExtMotionProvider mode={motion ? 'svelte' : 'off'}>
	<ToastNotificationsProvider position="topRight" maxCount={3}>
		<CrmApp bind:theme bind:motion themes={THEMES} />
	</ToastNotificationsProvider>
</ExtMotionProvider>
