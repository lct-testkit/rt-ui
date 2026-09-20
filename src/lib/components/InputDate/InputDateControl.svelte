<script lang="ts">
	// The `RenderInputControl` component of InputDate.tsx (passed to <Input inputControl={...}>).
	// React re-creates it when `isRange` changes (`useMemo`), which resets its state: `{#key}` does the same here.
	import { getContext } from 'svelte';
	import InputDateFields from './InputDateFields.svelte';
	import { INPUT_DATE_CONTEXT, type InputDateContext } from './context.js';

	let { ref = $bindable(null), ...props }: Record<string, any> = $props();
	const ctx = getContext<InputDateContext>(INPUT_DATE_CONTEXT);
</script>

{#key ctx.isRange}
	<InputDateFields bind:ref {...props} />
{/key}
