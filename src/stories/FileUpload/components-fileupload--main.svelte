<script lang="ts">
	// Port of stories/FileUpload: Main (`File Upload`). Args are the defaults (`compact` unset -> the long subtitle, no `hint` arg -> the default hint).
	import Button from '$lib/components/Button/Button/Button.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import FileUpload, { type FileUploadStatus, type UploadFile } from '$lib/components/FileUpload/FileUpload.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	let isUploading = $state(false);
	let uploadItems = $state.raw<UploadFile[]>([]);
	let uploadStatuses = $state.raw<Record<string, FileUploadStatus>>({});

	const handleUploading = () => {
		uploadStatuses = uploadItems.reduce((acc, item) => ({ ...acc, [item.name]: { loading: true } }), {});
		if (!isUploading) isUploading = true;
	};
	const handleReset = () => {
		uploadStatuses = {};
		uploadItems = [];
		isUploading = false;
	};
	const handleResolve = (name: string) => () => {
		uploadStatuses = Object.keys(uploadStatuses)
			.filter((i) => i !== name)
			.reduce((acc, i) => ({ ...acc, [i]: uploadStatuses[i] }), {});
	};
	const handleReject = (name: string) => () => {
		uploadStatuses = Object.keys(uploadStatuses).reduce((acc, i) => ({ ...acc, [i]: i === name ? { error: 'Upload error' } : uploadStatuses[i] }), {});
	};
</script>

{#snippet hint()}
	<div>Текстовые файлы: TXT, DOC, MD, RTF</div>
	<div>Таблицы: XLS, XLSX, CSV</div>
	<div>Презентации: KEY, PDF, PPTX, PPT</div>
{/snippet}

<DecorateStory>
	<div style="width: 380px">
		<div style="margin-bottom: 20px">
			<div style="display: flex; flex-direction: row; gap: 20px">
				<Button label="Upload" disabled={uploadItems.length === 0} onclick={handleUploading} />
				<Button label="Reset" disabled={uploadItems.length === 0} onclick={handleReset} />
			</div>
			{#if isUploading}
				{#each Object.keys(uploadStatuses) as item}
					<div style="margin-bottom: 10px">
						{item}
						<div style="display: flex; justify-content: flex-start">
							<FunctionButton label="Resolve" onclick={handleResolve(item)} /> /{' '}
							<FunctionButton label="Reject" onclick={handleReject(item)} />
						</div>
					</div>
				{/each}
			{/if}
		</div>
		<FileUpload
			subtitle="Перенесите или выберите файлы для загрузки"
			value={uploadItems}
			onChange={(i) => (uploadItems = i)}
			statuses={uploadStatuses}
			{hint}
		/>
	</div>
</DecorateStory>
