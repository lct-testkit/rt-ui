<script lang="ts">
	// Port of stories/InputDate/ClickableIconPrefixStyle
	import './_styles.css';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import SettingsAdjust from '$lib/icons/24/action/SettingsAdjust.svelte';
</script>

{#snippet iconPrefix()}
	<SettingsAdjust
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
		}}
	/>
{/snippet}

<InputDate style={{ width: '280px' }} class="clickable-icon-prefix" {iconPrefix} />
