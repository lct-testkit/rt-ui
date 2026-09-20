<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import ChevronLeft from '$lib/icons/24/navigation/ChevronLeft.svelte';
	import ChevronRight from '$lib/icons/24/navigation/ChevronRight.svelte';
	import CheckSmall from '$lib/icons/24/navigation/CheckSmall.svelte';
	import CloseSmall from '$lib/icons/24/navigation/CloseSmall.svelte';
</script>

<div>
	<Stepper size="m" variant="primary">
		{#snippet iconPrefix()}<ChevronLeft />{/snippet}
		{#snippet iconSuffix()}<ChevronRight />{/snippet}
	</Stepper>
</div>
<br />
<div>
	<Stepper size="m" variant="primary">
		{#snippet iconPrefix()}<CheckSmall />{/snippet}
		{#snippet iconSuffix()}<CloseSmall />{/snippet}
	</Stepper>
</div>
