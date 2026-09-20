<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';

	let isChecked = $state(true);
</script>

<Button onclick={() => (isChecked = !isChecked)} label="Press me" style="margin-bottom: var(--atmr-spacing-4x)" />
<Checkbox label="Checkbox" checked={isChecked} onChange={(v) => (isChecked = v)} />
