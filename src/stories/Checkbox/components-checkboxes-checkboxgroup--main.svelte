<script lang="ts">
	import CheckboxGroup from '$lib/components/Checkbox/CheckboxGroup/CheckboxGroup.svelte';

	const items = [
		{ key: 'developers', value: 'Разработчики' },
		{ key: 'designers', value: 'Дизайнеры' },
		{ key: 'owners', value: 'Оунеры' },
		{ key: 'analytics', value: 'Аналитики' },
		{ key: 'qa', value: 'Тестировщики' },
		{ key: 'clever', value: 'Умнички' }
	];
</script>

<CheckboxGroup
	variant="primary"
	size="s"
	title="Команда"
	parentBox
	{items}
	disabledItems={['analytics']}
	defaultCheckedItems={['developers', 'qa']}
/>
