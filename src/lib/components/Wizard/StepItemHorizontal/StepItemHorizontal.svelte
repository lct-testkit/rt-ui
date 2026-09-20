<script lang="ts">
	// Port of packages/ui-kit/src/components/Wizard/StepItemHorizontal/StepItemHorizontal.tsx
	// React: WizardStepsHorizontal clones every StepItemHorizontal child with { 'data-step', style (max-width for the last one),
	// className (--confirm) }. Svelte cannot clone snippets, so a step used as a child registers itself in the wizard context
	// and computes the same data-step / style / class itself. Steps rendered from the `steps` prop get `data-step` from the wizard.
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import Slot from '../../../internal/Slot.svelte';
	import CheckLarge from '../../../icons/24/navigation/CheckLarge.svelte';
	import CloseLarge from '../../../icons/24/navigation/CloseLarge.svelte';
	import TimeStroke from '../../../icons/24/alert/TimeStroke.svelte';
	import Attention from '../../../icons/24/action/Attention.svelte';
	import Pause from '../../../icons/24/media/Pause.svelte';
	import { styleToString } from '../../../utils/style.js';
	import { DEFAULT_STEP_TYPE } from '../constants.js';
	import { getStepsGroupContext } from '../WizardStepsHorizontal/context.js';
	import type { StepsGroupContextValue } from '../WizardStepsHorizontal/context.js';
	import { STEP_STATES, STEP_TYPES } from './types.js';
	import type { StepIconRenderProps, StepItemHorizontalProps, StepState } from './types.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useMotionValue } from '../../../ext/motion.svelte.js';

	let {
		title = '',
		subtitle = '',
		type = DEFAULT_STEP_TYPE,
		state: stateProp,
		icon,
		class: className,
		style,
		'data-step': dataStepProp,
		...rest
	}: StepItemHorizontalProps = $props();

	// React would throw without the context; fall back to the wizard defaults instead.
	const fallback: StepsGroupContextValue = {
		textPlacement: 'right',
		variant: 'primary',
		size: 'm',
		currentStep: 0,
		maxWidthLastStep: 'unset',
		count: 0,
		register: () => () => {},
		indexOf: () => -1
	};
	const stepsGroup = getStepsGroupContext() ?? fallback;

	let el = $state<HTMLElement>();

	const isSlotStep = $derived(dataStepProp === undefined || dataStepProp === null);
	const index = $derived(isSlotStep ? stepsGroup.indexOf(el) : -1);
	const dataStep = $derived<string | undefined>(isSlotStep ? (index >= 0 ? String(index + 1) : undefined) : String(dataStepProp));

	$effect(() => {
		if (!isSlotStep || !el) return;
		return stepsGroup.register(el);
	});

	const isNumberIcon = $derived(type === STEP_TYPES.number);

	const stepState = $derived.by<StepState>(() => {
		if (stepsGroup.currentStep + 1 > Number(dataStep)) return STEP_STATES.done;
		if (stepsGroup.currentStep + 1 === Number(dataStep)) return STEP_STATES.current;
		return STEP_STATES.available;
	});
	const currentState = $derived(stateProp || stepState);

	const extraClass = $derived(
		isSlotStep ? clsx(className, index >= 0 && (stepsGroup.currentStep || 0) > index && 'atmr-wizard-horizontal-item--confirm') : className
	);
	// ─── [ext, not in original] motion: the connector after this step is "filled" with a sweep when the step gets confirmed ─
	// While the wizard's motion is not enabled `fillOn` is false: no extra class, no extra inline style = the original markup.
	const confirmed = $derived(/(^|\s)atmr-wizard-horizontal-item--confirm(\s|$)/.test(clsx(extraClass)));
	// no sweep on the very first render (slot steps only learn their index after mounting)
	let fillSettled = $state(false);
	$effect(() => {
		if (!isSlotStep || index >= 0) fillSettled = true;
	});
	const fill = useMotionValue<number>(
		() => (confirmed ? 100 : 0),
		() => stepsGroup.motion?.config ?? null,
		() => !fillSettled
	);
	const fillOn = $derived(!!stepsGroup.motion?.enabled);
	const fillStyle = $derived(fillOn ? { '--rt-ext-fill': `${Math.min(100, Math.max(0, fill.current))}%` } : undefined);

	const classes = $derived(
		clsx(
			'atmr-wizard-horizontal-item',
			`atmr-wizard-horizontal-item--${stepsGroup.textPlacement}`,
			!title && typeof title !== 'function' && 'atmr-wizard-horizontal-item--without-title',
			`atmr-wizard-horizontal-item--${stepsGroup.variant}`,
			`atmr-wizard-horizontal-item--size-${stepsGroup.size}`,
			`atmr-wizard-horizontal-item--${currentState}`,
			extraClass && extraClass,
			fillOn && 'rt-ext-wizard-step'
		)
	);
	const rootStyle = $derived(
		isSlotStep && index >= 0 && index === stepsGroup.count - 1
			? styleToString(style, { maxWidth: stepsGroup.maxWidthLastStep }, fillStyle)
			: styleToString(style, fillStyle)
	);

	const iconArgs = $derived<StepIconRenderProps>({ state: currentState, type, textPlacement: stepsGroup.textPlacement });
	const hasTitle = $derived(!!title);
	const hasSubtitle = $derived(!!subtitle);
</script>

<div bind:this={el} class={classes} style={rootStyle} data-step={dataStep} {...rest}>
	<div class="atmr-wizard-horizontal-item__indicator">
		{#if typeof icon === 'function'}
			{@render (icon as Snippet<[StepIconRenderProps]>)(iconArgs)}
		{:else if icon}
			<Slot content={icon} />
		{:else if isNumberIcon}
			<div class="atmr-wizard-horizontal-item__indicator--number">{dataStep}</div>
		{:else if currentState === STEP_STATES.done}
			<CheckLarge class="atmr-wizard-horizontal-item__indicator--icon" />
		{:else if currentState === STEP_STATES.current}
			<TimeStroke class="atmr-wizard-horizontal-item__indicator--icon" />
		{:else if currentState === STEP_STATES.error}
			<CloseLarge class="atmr-wizard-horizontal-item__indicator--icon" />
		{:else if currentState === STEP_STATES.pause}
			<Pause class="atmr-wizard-horizontal-item__indicator--icon" />
		{:else if currentState === STEP_STATES.warning}
			<Attention class="atmr-wizard-horizontal-item__indicator--icon" />
		{:else}
			<div class="atmr-wizard-horizontal-item__indicator--icon"></div>
		{/if}
	</div>
	<div class="atmr-wizard-horizontal-item__info">
		<div class="atmr-wizard-horizontal-item__row">
			{#if hasTitle}<div class="atmr-wizard-horizontal-item__title"><Slot content={title} /></div>{/if}
		</div>
		{#if hasTitle && hasSubtitle}<div class="atmr-wizard-horizontal-item__subtitle"><Slot content={subtitle} /></div>{/if}
	</div>
</div>
