<script lang="ts">
	// Port of stories/File: FileMoreActions
	import File, { type FileMoreAction } from '$lib/components/File/File.svelte';
	import Download16 from '$lib/icons/16/action/Download16.svelte';
	import Trash16 from '$lib/icons/16/action/Trash16.svelte';
	import Edit16 from '$lib/icons/16/editor/Edit16.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	const actions: FileMoreAction[] = [
		{ title: 'Загрузить', icon: download16, onAction: () => ({}) },
		{ title: 'Редактировать', icon: edit16, onAction: () => ({}) },
		{ title: 'Удалить', icon: trash16, onAction: () => ({}) }
	];
</script>

{#snippet download16()}<Download16 />{/snippet}
{#snippet edit16()}<Edit16 />{/snippet}
{#snippet trash16()}<Trash16 />{/snippet}

<DecorateStory>
	<div style="display: flex; flex-direction: column; gap: 20px">
		<File size="xl" name="filename.jpg" fileSize={124124124} moreActions={actions} />
		<File compact name="filename.jpg" fileSize={124124124} moreActions={actions} />
	</div>
</DecorateStory>
