<script lang="ts">
	// Port of stories/FileUpload: FileUploadTooltip
	import FileUpload from '$lib/components/FileUpload/FileUpload.svelte';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
</script>

{#snippet subtitle()}
	<div>
		<div>Текстовые файлы: TXT, DOC, MD, RTF</div>
		<div>Таблицы: XLS, XLSX, CSV</div>
		<div>Презентации: KEY, PDF, PPTX, PPT</div>
	</div>
{/snippet}

<DecorateStory>
	<div style="width: 380px">
		<Tooltip {subtitle}>
			<FileUpload />
		</Tooltip>
	</div>
</DecorateStory>
