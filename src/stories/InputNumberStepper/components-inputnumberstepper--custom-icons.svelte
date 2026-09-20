<script lang="ts">
	import InputNumberStepper from '$lib/components/InputNumberStepper/InputNumberStepper.svelte';
	import ChevronRight from '$lib/icons/24/navigation/ChevronRight.svelte';
	import ChevronLeft from '$lib/icons/24/navigation/ChevronLeft.svelte';
	import { noop } from '$lib/utils/function.js';
	// args (size / defaultValue / step + the onFocus / onBlur / onChange actions) are spread first, exactly like the React story
</script>

<InputNumberStepper size="m" defaultValue={0} step={1} onfocus={noop} onblur={noop} onChange={noop}>
	{#snippet iconSuffix()}<ChevronRight />{/snippet}
	{#snippet iconPrefix()}<ChevronLeft />{/snippet}
</InputNumberStepper>
