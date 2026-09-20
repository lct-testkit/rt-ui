<script lang="ts">
	// Port of stories/DropdownMenu Empty: no items -> `emptyText` (a Typography) is shown
	import './_styles.css';
	import './_placements.css';
	import { onMount } from 'svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';

	let isOpened = $state(false);

	// React: useEffect(() => setIsOpened(true), [])
	onMount(() => {
		isOpened = true;
	});
</script>

{#snippet kebab()}<MenuKebab />{/snippet}

{#snippet emptyText()}
	<Typography variant="body-m" style={{ padding: '12px' }}>Options not found :*(</Typography>
{/snippet}

<div style="height: 100px;">
	<DropdownMenu
		size="m"
		variant="primary"
		items={[]}
		useInPortal={false}
		class="--stories-placement"
		{isOpened}
		placement="bottom"
		widthFitContent
		onClose={() => (isOpened = false)}
		{emptyText}
	>
		<IconButton icon={kebab} class="dd-root" onclick={() => (isOpened = !isOpened)} />
	</DropdownMenu>
</div>
