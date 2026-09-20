<script lang="ts">
	// Port of packages/tree/src/components/Tree/modules/selection/components/SelectionButton.tsx
	//
	// The checkbox of a node (size `s` for a `m` tree, `xs` otherwise); a disabled node shows an unchecked, disabled checkbox.
	import Checkbox from '../../../Checkbox/Checkbox/Checkbox.svelte';
	import { useTreeCallbacks } from '../callbacks/callbacks.svelte.js';
	import { useTreeStyled } from '../styled/styled.svelte.js';
	import { useSelectionController } from './selection.svelte.js';

	let { id, disabled }: { id: string; disabled?: boolean } = $props();

	const controller = useSelectionController(() => id);
	const callbacks = useTreeCallbacks();
	const styled = useTreeStyled();

	const onChangeHandler = () => {
		controller.toggleSelectGroup();
		const [selected, indeterminated] = controller.getSelected();
		callbacks.onCheck(selected, indeterminated);
	};
</script>

<div class="atmr-tree__button-select">
	<Checkbox checked={disabled ? false : controller.isSelected} onChange={onChangeHandler} indeterminate={controller.isIndeterminated} size={styled.size === 'm' ? 's' : 'xs'} {disabled} />
</div>
