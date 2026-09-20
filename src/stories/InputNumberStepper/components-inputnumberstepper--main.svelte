<script lang="ts">
	import InputNumberStepper from '$lib/components/InputNumberStepper/InputNumberStepper.svelte';
	import { noop } from '$lib/utils/function.js';
	// Storybook passes `onFocus` / `onBlur` / `onChange` actions as args. The component does not exclude onFocus / onBlur from its
	// rest props, so in React they REPLACE the internal focus handlers (the `--focused` class is never set): mimic that.
</script>

<InputNumberStepper size="m" defaultValue={0} step={1} onfocus={noop} onblur={noop} onChange={noop} />
