<script lang="ts">
	import './loader-type.css';
	import Loader from '$lib/components/Loader/Loader.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	// storybook args of the story (meta.args)
	const args = { size: 'm', variant: 'primary' } as const;
</script>

<div class="loader-type-layout">
	<div class="loader-type-card">
		<div class="loader-type-card__head">
			<Typography variant="heading-h4">Рекомендуемые варианты</Typography>
			<Typography variant="body-m" class="loader-type-card__description">Использовать в новых сценариях</Typography>
		</div>
		<div class="loader-type-card__items">
			<div class="loader-type-item">
				<Loader {...args} type="default" />
				<Typography variant="body-s" class="loader-type-item__label">default</Typography>
			</div>
			<div class="loader-type-item">
				<Loader {...args} type="spinnerBg" />
				<Typography variant="body-s" class="loader-type-item__label">spinnerBg</Typography>
			</div>
		</div>
	</div>

	<div class="loader-type-card loader-type-card--deprecated">
		<div class="loader-type-card__head">
			<Typography variant="heading-h4">Устаревшие варианты</Typography>
			<Typography variant="body-m" class="loader-type-card__description">Deprecated, оставлены только для обратной совместимости</Typography>
		</div>
		<div class="loader-type-card__items">
			<div class="loader-type-item">
				<Loader {...args} type="spinner" />
				<Typography variant="body-s" class="loader-type-item__label">spinner</Typography>
			</div>
			<div class="loader-type-item">
				<Loader {...args} type="dots" />
				<Typography variant="body-s" class="loader-type-item__label">dots</Typography>
			</div>
		</div>
	</div>
</div>
