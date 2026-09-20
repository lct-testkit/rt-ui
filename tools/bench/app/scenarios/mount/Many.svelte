<script lang="ts">
	// N instances of one component (mount-cost tests).
	import Button from '@rt-ui/components/Button/Button/Button.svelte';
	import Input from '@rt-ui/components/Input/Input.svelte';
	import Select from '@rt-ui/components/Select/Select.svelte';

	let { kind, n }: { kind: 'button' | 'input' | 'select'; n: number } = $props();
	const items = [
		{ key: 'a', value: 'Первый пункт' },
		{ key: 'b', value: 'Второй пункт' },
		{ key: 'c', value: 'Третий пункт' },
		{ key: 'd', value: 'Четвёртый пункт' }
	];
</script>

<div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px">
	{#each { length: n } as _, i}
		{#if kind === 'button'}
			<Button label="Кнопка {i}" />
		{:else if kind === 'input'}
			<Input placeholder="Поле {i}" size="m" />
		{:else}
			<Select {items} size="m" />
		{/if}
	{/each}
</div>
