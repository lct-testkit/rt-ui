<script lang="ts">
	// One popup component that is opened / closed from outside many times (leak test).
	import Popover from '@rt-ui/components/Popover/Popover.svelte';
	import Select from '@rt-ui/components/Select/Select.svelte';
	import Modal from '@rt-ui/components/Modal/Modal.svelte';
	import Typography from '@rt-ui/components/Typography/Typography.svelte';

	let { kind }: { kind: 'control' | 'popover' | 'select' | 'modal' } = $props();
	let open = $state(false);
	export function setOpen(v: boolean) {
		open = v;
	}
	const items = [
		{ key: 'a', value: 'Первый пункт' },
		{ key: 'b', value: 'Второй пункт' },
		{ key: 'c', value: 'Третий пункт' }
	];
</script>

<div style="padding:24px" id="leak-root">
	{#if kind === 'control'}
		<!-- control: a plain Svelte block toggled the same way, to see the noise floor of the harness itself -->
		{#if open}<div class="leak-control">control</div>{/if}
	{:else if kind === 'popover'}
		<Popover trigger="click" title="Заголовок" subtitle="Подзаголовок">
			{#snippet body()}<Typography variant="body-m">Текст внутри поповера</Typography>{/snippet}
			<button type="button" id="leak-trigger">Открыть</button>
		</Popover>
	{:else if kind === 'select'}
		<div id="leak-select"><Select {items} label="Пункт" /></div>
	{:else}
		<Modal isOpened={open} maxWidth="420px" isCentered transitionProps={{ timeout: 30 }}>
			<div style="padding:24px"><Typography variant="body-m">Окно</Typography></div>
		</Modal>
	{/if}
</div>
