<script lang="ts">
	// Port of stories/Popover/CustomPopover
	import './_decorator.css';
	import './_custom-popover.css';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<Popover>
	{#snippet innerChildren()}
		<form class="stories-popover-container" action="https://atomaro.design/">
			<div class="stories-popover-form">
				<img class="image" src="/story-assets/popover_union.png" alt="logo" />
				<div class="stories-popover-form-header">
					<Typography variant="heading-h3">Atomaro</Typography>
					<Typography variant="description-m">Дизайн-система</Typography>
				</div>
			</div>
			<Typography variant="body-m" style={{ width: '198px' }}>
				Цель Дизайн-системы — сделать так, чтобы команды быстрее выпускали релизы, эффективнее разрабатывали фичи, но при этом не теряли в качестве и не жили в
				режиме аврала.
			</Typography>
			<span class="stories-popover-divider"></span>
			<Button size="m" label="Попробовать Atomaro" type="submit" />
		</form>
	{/snippet}
	<Typography variant="body-l" as="span" class="trigger">Текст с всплывающим окном</Typography>
</Popover>
