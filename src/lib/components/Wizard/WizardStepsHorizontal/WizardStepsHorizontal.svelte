<script lang="ts">
	// Port of packages/ui-kit/src/components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.tsx (+ renderStepsBySlots)
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	import StepItemHorizontal from '../StepItemHorizontal/StepItemHorizontal.svelte';
	import type { StepItemHorizontalProps } from '../StepItemHorizontal/types.js';
	import { DEFAULT_ACTIVE_STEP_NUMBER, WIZARD_SIZES, WIZARD_VARIANT } from '../constants.js';
	import type { WizardSize, WizardVariant } from '../constants.js';
	import { setStepsGroupContext } from './context.js';
	import { STEP_TEXT_ALIGNMENT } from './types.js';
	import type { StepTextAlignment } from './types.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useMotion, type MotionProp } from '../../../ext/motion.svelte.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Стили корневого элемента (строка или объект в стиле React) */
		style?: StyleValue;
		/** Индекс текущего этапа (0-based) */
		currentStep?: number;
		/** Список этапов (props StepItemHorizontal); альтернатива children */
		steps?: StepItemHorizontalProps[];
		/** Расположение текста относительно индикатора */
		textPlacement?: StepTextAlignment;
		/** Вариант */
		variant?: WizardVariant;
		/** Размер */
		size?: WizardSize;
		/** Этапы: набор StepItemHorizontal */
		children?: Snippet;
		/**
		 * [ext, not in original] Плавная «заливка» соединительной линии при смене этапа (Svelte Tween / Spring).
		 * undefined = как у ExtMotionProvider (без него выключено), false = выключено, true / 'tween' / 'spring' /
		 * объект опций = включено. Не работает при prefers-reduced-motion: reduce.
		 */
		motion?: MotionProp;
	}

	let {
		currentStep = DEFAULT_ACTIVE_STEP_NUMBER,
		steps,
		textPlacement = STEP_TEXT_ALIGNMENT.right,
		variant = WIZARD_VARIANT.primary,
		size = WIZARD_SIZES.m,
		children,
		class: classes = '',
		style,
		motion,
		...rest
	}: Props = $props();

	// [ext, not in original] shared with the steps through the context; while it is not enabled the steps render as in the original
	const motionH = useMotion(() => motion, 'wizard');

	let el = $state<HTMLElement>();
	let containerWidth = $state(0);
	// React reads `stepsGroupRef.current` during render: it is null in the very first render only.
	let ready = $state(false);
	// slot steps (StepItemHorizontal used as children), kept in DOM order
	let items = $state.raw<HTMLElement[]>([]);

	$effect(() => {
		if (!el) return;
		const observer = new ResizeObserver((entries) => {
			entries.forEach((entry) => {
				containerWidth = entry.contentRect.width;
			});
			ready = true;
		});
		observer.observe(el);
		return () => observer.disconnect();
	});

	const maxWidthLastStep = $derived.by(() => {
		if (ready && steps && steps.length !== 1) return `${containerWidth / steps.length}px`;
		if (ready && children) {
			const count = items.length;
			return count > 1 ? `${containerWidth / count}px` : 'unset';
		}
		return 'unset';
	});

	const textPosition = $derived.by<StepTextAlignment>(() => {
		if (textPlacement === STEP_TEXT_ALIGNMENT.right) return textPlacement;
		if (steps?.length && steps.every((item) => !item.title)) return STEP_TEXT_ALIGNMENT.right;
		return STEP_TEXT_ALIGNMENT.bottom;
	});

	const itemClasses = (index: number) => ((currentStep || 0) > index ? 'atmr-wizard-horizontal-item--confirm' : '');

	const sortByDom = (nodes: HTMLElement[]) =>
		nodes.sort((a, b) => (a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

	setStepsGroupContext({
		get textPlacement() {
			return textPosition;
		},
		get variant() {
			return variant;
		},
		get size() {
			return size;
		},
		get currentStep() {
			return currentStep;
		},
		get maxWidthLastStep() {
			return maxWidthLastStep;
		},
		get count() {
			return items.length;
		},
		// called from a step's `$effect`: read `items` untracked, otherwise the effect would depend on the state it writes
		register(node) {
			untrack(() => {
				items = sortByDom([...items, node]);
			});
			return () => {
				untrack(() => {
					items = items.filter((n) => n !== node);
				});
			};
		},
		indexOf(node) {
			return node ? items.indexOf(node) : -1;
		},
		get motion() {
			return motionH;
		}
	});

	const rootClassName = $derived(
		clsx(
			'atmr-wizard-horizontal',
			textPosition === 'bottom' && 'atmr-wizard-horizontal--bottom',
			variant && `atmr-wizard-horizontal--${variant}`,
			size && `atmr-wizard-horizontal--size-${size}`,
			`${classes}`
		)
	);
</script>

<div bind:this={el} class={rootClassName} style={styleToString(style) || undefined} {...rest}>
	{#if children}
		{@render children()}
	{:else if steps}
		{#each steps as step, index}
			<StepItemHorizontal
				{...step}
				style={index === steps.length - 1 ? { maxWidth: maxWidthLastStep } : undefined}
				data-step={index + 1}
				class={itemClasses(index)}
			/>
		{/each}
	{/if}
</div>
