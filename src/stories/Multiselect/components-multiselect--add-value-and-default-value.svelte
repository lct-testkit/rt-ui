<script lang="ts">
	// Port of stories/Multiselect AddValueAndDefaultValue, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_SELECTIONS } from '../Select/_options.js';
	import './styles.css';

	let value = $state.raw<DropdownMenuItem[]>([]);
	let btnName = $state('Add value');

	function clickHandler() {
		if (value.length === OPTIONS_SELECTIONS.length) {
			value = [];
			btnName = 'Add value';
			return;
		}
		if (value.length === OPTIONS_SELECTIONS.length - 1) {
			btnName = 'Remove value';
		}
		value = [...value, OPTIONS_SELECTIONS[value.length]];
	}
</script>

<DecorateStory>
	<div class="stories-ms-value">
		<Button onclick={clickHandler} label={btnName} />
		<Typography variant="heading-h4">Добавление в пропс value</Typography>
		<Multiselect size="m" useInPortal autocomplete={{ enabled: true }} items={OPTIONS_SELECTIONS} {value} />
		<Typography variant="heading-h4">Добавление в пропс defaultValue</Typography>
		<Multiselect
			size="m"
			useInPortal
			autocomplete={{ enabled: true }}
			items={OPTIONS_SELECTIONS}
			value={[
				{ value: 'Selection  5', key: 'selection5' },
				{ value: 'Selection 7', key: 'selection7' }
			]}
			defaultValue={[
				{ value: 'Selection 1', key: 'selection1' },
				{ value: 'Selection 2', key: 'selection2' }
			]}
		/>
	</div>
</DecorateStory>
