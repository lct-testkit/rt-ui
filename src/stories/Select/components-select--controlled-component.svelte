<script lang="ts">
	// Port of stories/Select ControlledComponent, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { OPTIONS_SELECTIONS } from './_options.js';

	let selected = $state<string | number>('selection2');

	function handleChange(opt: string | number) {
		selected = opt;
	}

	function handleClick() {
		const randomNumber = [1, 2, 3, 4, 5, 7, 8, 9][Math.floor(Math.random() * 8)];
		selected = `selection${randomNumber}`;
	}
</script>

<DecorateStory>
	<Select placement="bottom" label="Label" useInPortal items={OPTIONS_SELECTIONS} value={selected} onChange={handleChange} />
	<Button onclick={handleClick} label="Выбрать другую опцию" style="margin-top: var(--atmr-spacing-4x)" />
</DecorateStory>
