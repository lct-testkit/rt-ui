<script lang="ts">
	// Story: Tree/Tree/HighlightedTree (HighlightedTree.stories.tsx; story decorator: a div with align-items: flex-start)
	import { onMount } from 'svelte';
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ChevronLeft from '$lib/icons/24/navigation/ChevronLeft.svelte';
	import ChevronRight from '$lib/icons/24/navigation/ChevronRight.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';

	// `dataLargeNew` of HighlightedTree.stories.tsx is a module constant (the same array on every render)
	const dataLargeNew = createRows(50);
	const accent = { color: 'var(--atmr-accent-500)' };

	let highlightedKeys = $state<string[]>([]);
	let scrollToIndex = $state(0);

	// useEffect(() => { setTimeout(() => setHighlightedKeys(['0-3-1', '0-9-0']), 0); }, [])
	onMount(() => {
		setTimeout(() => {
			highlightedKeys = ['0-3-1', '0-9-0'];
		}, 0);
	});

	const stepperDisabled = $derived(scrollToIndex === 1 ? 'left' : scrollToIndex === 2 ? 'right' : undefined);
	const activeKeys = $derived(scrollToIndex !== 0 ? [highlightedKeys[scrollToIndex - 1]] : ['0-0']);
	const activeKey = $derived(scrollToIndex !== 0 ? highlightedKeys[scrollToIndex - 1] : '0-0');

	// React re-renders the whole story on every state change and `createRows(20)` builds new arrays each time (the Tree resets its checkboxes
	// when `data` is a new array), so the data of these trees depends on the state as well
	const dataDefault = $derived.by(() => {
		void scrollToIndex;
		void highlightedKeys;
		return createRows(20);
	});
	const dataColor = $derived.by(() => {
		void scrollToIndex;
		void highlightedKeys;
		return createRows(20);
	});
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Подсвечивание узлов</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={accent}>highlightedKeys</Typography><Sp />можно указать подсвеченные (найденные) элементы, <br />с помощью параметра<Sp /><Typography
			as="span"
			variant="body-m"
			style={accent}>scrollToKey</Typography
		><Sp />можно осуществить переход к конкретному элементу.
	</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Кнопки снизу имитируют работу scrollToKey при нажатии</Typography>
	<Typography variant="body-m" color="description" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Дефолтный скролл</Typography>
	<div style="margin-bottom: 12px">
		<Stepper
			onClickIconPrefix={() => (scrollToIndex = scrollToIndex - 1)}
			onClickIconSuffix={() => (scrollToIndex = scrollToIndex + 1)}
			size="m"
			disabled={stepperDisabled}
		>
			{#snippet iconPrefix()}<ChevronLeft />{/snippet}
			{#snippet iconSuffix()}<ChevronRight />{/snippet}
		</Stepper>
	</div>
	<div style="width: 100%; height: 300px">
		<Tree data={dataDefault} checkable highlightedKeys={activeKeys} highlightedColor="var(--atmr-neutral-100)" scrollToKey={activeKey} />
	</div>
	<Typography variant="body-m" color="description" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Скролл с виртуализацией</Typography>
	<div style="width: 100%; height: 300px">
		<Tree data={dataLargeNew} checkable highlightedKeys={activeKeys} scrollToKey={activeKey} virtualScroll={{ isEnable: true, listSize: 'fixed', overscanCount: 10 }} />
	</div>

	<Typography variant="body-m" color="description" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={accent}>highlightedColor</Typography><Sp />можно изменить фон подсвеченных элементов
	</Typography>
	<div style="width: 100%; height: 150px">
		<Tree data={dataColor} checkable highlightedKeys={['0-0']} highlightedColor="rgba(119, 0, 255, 0.1)" />
	</div>
</div>
