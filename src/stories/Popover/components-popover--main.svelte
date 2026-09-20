<script lang="ts">
	// Port of stories/Popover/1_Popover (PopoverComponent + defaultPopoverArgs) with decorator `withPopoverRootOffset` and styles-common.css
	import './_decorator.css';
	import './_common.css';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<Popover trigger="click" variant="primary" size="m" title="Title" subtitle="Subtitle">
	{#snippet body()}<Typography variant="body-m">Текст внутри поповера</Typography>{/snippet}
	{#snippet footer()}
		<Button label="Button label" />
		<Button label="Button label" variant="secondary" />
	{/snippet}
	<Typography variant="body-l" as="span" class="trigger" data-testid="click" style={{ width: 'fit-content' }}>Текст с всплывающим окном</Typography>
</Popover>
