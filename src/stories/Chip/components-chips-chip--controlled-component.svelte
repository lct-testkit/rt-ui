<script lang="ts">
	import Chip from '$lib/components/Chip/Chip/Chip.svelte';
	import './styles.css';

	let isSelected = $state(true);
</script>

<Chip selected={isSelected} onclick={() => (isSelected = !isSelected)} label="Chip" />
