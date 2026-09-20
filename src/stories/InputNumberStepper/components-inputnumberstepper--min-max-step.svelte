<script lang="ts">
	import InputNumberStepper from '$lib/components/InputNumberStepper/InputNumberStepper.svelte';
	import { noop } from '$lib/utils/function.js';
	// args.iconPrefix / args.iconSuffix are not set -> `icons[undefined]` is undefined -> default icons
</script>

<InputNumberStepper size="m" defaultValue={0} step={10} min={100} max={200} onfocus={noop} onblur={noop} onChange={noop} />
