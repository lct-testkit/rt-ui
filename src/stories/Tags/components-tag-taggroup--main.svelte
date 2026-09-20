<script lang="ts">
	import TagGroup from '$lib/components/Tag/TagGroup/TagGroup.svelte';

	const items = [
		{ key: 'Меркурий', value: 'Меркурий' },
		{ key: 'Венера', value: 'Венера' },
		{ key: 'Земля', value: 'Земля' },
		{ key: 'Марс', value: 'Марс' },
		{ key: 'Юпитер', value: 'Юпитер' },
		{ key: 'Сатурн', value: 'Сатурн' },
		{ key: 'Уран', value: 'Уран' },
		{ key: 'Нептун', value: 'Нептун' },
		{ key: 'Плутон', value: 'Плутон' }
	];
	const errorItems = [{ key: 'Уран', value: 'Уран' }];
</script>

<TagGroup {items} {errorItems} closable editable size="m" variant="primary" />
