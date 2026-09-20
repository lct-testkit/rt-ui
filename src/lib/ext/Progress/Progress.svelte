<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Progress indicator (linear bar / circular ring). The original design system has no such component: this is the author's
	// own, built only from theme tokens (colours, spacing, radius, typography), so it follows all four themes.
	//
	//   <Progress value={40} label="Загрузка" showValue />                     linear, accent, no animation (default)
	//   <Progress variant="circular" value={72} showValue motion="spring" />   the ring follows `value` with a Svelte Spring
	//   <Progress indeterminate />                                             endless bar (CSS animation; static under reduced motion)
	//
	// `motion` (see ../motion.svelte.ts): undefined = inherit ExtMotionProvider (no provider = off), false = off,
	// true / 'tween' / 'spring' / { duration, stiffness, damping ... } = on. Value changes then glide with a Tween / Spring;
	// prefers-reduced-motion: reduce switches the animation off.
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import Typography from '../../components/Typography/Typography.svelte';
	import { useMotion, useMotionValue, type MotionProp } from '../motion.svelte.js';

	export type ProgressVariant = 'linear' | 'circular';
	export type ProgressSize = 's' | 'm' | 'l';
	export type ProgressColorScheme = 'accent' | 'neutral' | 'success' | 'error';

	export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** [ext, not in original] Текущее значение (от 0 до max) */
		value?: number;
		/** [ext, not in original] Максимальное значение */
		max?: number;
		/** [ext, not in original] Вид: линейный или круговой */
		variant?: ProgressVariant;
		/** [ext, not in original] Размер */
		size?: ProgressSize;
		/** [ext, not in original] Подпись (строка или snippet) */
		label?: Content;
		/** [ext, not in original] Показывать значение в процентах */
		showValue?: boolean;
		/** [ext, not in original] Неопределённый прогресс (бесконечная анимация; без анимации при prefers-reduced-motion) */
		indeterminate?: boolean;
		/** [ext, not in original] Цветовая схема (токены темы) */
		colorScheme?: ProgressColorScheme;
		/** [ext, not in original] Анимация изменения значения: undefined = как у ExtMotionProvider (без него выключено), false, true, 'tween', 'spring' или объект опций */
		motion?: MotionProp;
	}

	let {
		value = 0,
		max = 100,
		variant = 'linear',
		size = 'm',
		label,
		showValue = false,
		indeterminate = false,
		colorScheme = 'accent',
		motion,
		class: className,
		...rest
	}: ProgressProps = $props();

	const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

	/** target in percent (0..100) */
	const pct = $derived(max > 0 ? clamp((Number(value) / max) * 100, 0, 100) : 0);

	const m = useMotion(() => motion, 'progress');
	// percent units: the Spring's default precision (0.01) is 0.01 % of the bar
	const anim = useMotionValue(
		() => pct,
		() => m.config
	);
	/** what is drawn (equals `pct` while motion is off) */
	const shown = $derived(clamp(anim.current, 0, 100));
	const text = $derived(`${Math.round(shown)}%`);

	// circular geometry (viewBox 0 0 100 100): the stroke fits inside the box
	const stroke = $derived({ s: 14, m: 12, l: 10 }[size] ?? 12);
	const radius = $derived(50 - stroke / 2);
	/** the number inside the ring must fit into it */
	const ringText = $derived(({ s: 'description-s', m: 'body-s', l: 'body-m' } as const)[size] ?? 'body-s');

	const rootClass = $derived(
		clsx('rt-ext-progress', `rt-ext-progress--${variant}`, `rt-ext-progress--size-${size}`, `rt-ext-progress--${colorScheme}`, indeterminate && 'rt-ext-progress--indeterminate', className)
	);
	const hasHeader = $derived(!!label || (showValue && !indeterminate));
</script>

<div
	class={rootClass}
	role="progressbar"
	aria-valuemin={0}
	aria-valuemax={max}
	aria-valuenow={indeterminate ? undefined : clamp(Number(value), 0, max)}
	aria-valuetext={indeterminate ? undefined : `${Math.round(pct)}%`}
	aria-busy={indeterminate ? 'true' : undefined}
	aria-label={typeof label === 'string' ? label : undefined}
	data-motion={m.enabled ? m.config?.type : 'off'}
	{...rest}
>
	{#if variant === 'circular'}
		<div class="rt-ext-progress__ring">
			<svg class="rt-ext-progress__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
				<circle class="rt-ext-progress__ring-track" cx="50" cy="50" r={radius} stroke-width={stroke} fill="none" />
				<circle
					class="rt-ext-progress__ring-fill"
					cx="50"
					cy="50"
					r={radius}
					stroke-width={stroke}
					fill="none"
					pathLength="100"
					transform="rotate(-90 50 50)"
					stroke-dasharray="{indeterminate ? 28 : shown} 100"
					opacity={indeterminate || shown > 0 ? 1 : 0}
				/>
			</svg>
			{#if showValue && !indeterminate}
				<span class="rt-ext-progress__ring-value"><Typography variant={ringText} as="span" strong>{text}</Typography></span>
			{/if}
		</div>
		{#if label}
			<span class="rt-ext-progress__label"><Typography variant="body-s" as="span"><Slot content={label} /></Typography></span>
		{/if}
	{:else}
		{#if hasHeader}
			<div class="rt-ext-progress__header">
				{#if label}<span class="rt-ext-progress__label"><Typography variant="body-s" as="span"><Slot content={label} /></Typography></span>{/if}
				{#if showValue && !indeterminate}<span class="rt-ext-progress__value"><Typography variant="body-s" as="span" strong>{text}</Typography></span>{/if}
			</div>
		{/if}
		<div class="rt-ext-progress__track">
			<div class="rt-ext-progress__fill" style:width={indeterminate ? undefined : `${shown}%`}></div>
		</div>
	{/if}
</div>

<style>
	.rt-ext-progress {
		--rt-ext-progress-color: var(--atmr-accent-default);
		--rt-ext-progress-track: var(--atmr-neutral-container-default);
		--rt-ext-progress-height: var(--atmr-spacing-2x);
		--rt-ext-progress-ring: var(--atmr-spacing-12x);
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-1-5x);
		width: 100%;
		min-width: 0;
		/* own font + colour from tokens: looks right even without the app base layer (.rt-base) */
		font-family: var(--atmr-font-family-body);
		color: var(--atmr-fg-default);
	}
	.rt-ext-progress--neutral {
		--rt-ext-progress-color: var(--atmr-neutral-default);
	}
	.rt-ext-progress--success {
		--rt-ext-progress-color: var(--atmr-success-default);
	}
	.rt-ext-progress--error {
		--rt-ext-progress-color: var(--atmr-error-default);
	}
	.rt-ext-progress--size-s {
		--rt-ext-progress-height: var(--atmr-spacing-1x);
		--rt-ext-progress-ring: var(--atmr-spacing-8x);
	}
	.rt-ext-progress--size-l {
		--rt-ext-progress-height: var(--atmr-spacing-3x);
		--rt-ext-progress-ring: var(--atmr-spacing-16x);
	}

	.rt-ext-progress__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--atmr-spacing-3x);
	}
	.rt-ext-progress__label {
		color: var(--atmr-fg-default);
	}
	.rt-ext-progress__value {
		color: var(--atmr-fg-muted);
		font-variant-numeric: tabular-nums;
		margin-inline-start: auto;
	}

	/* linear */
	.rt-ext-progress__track {
		position: relative;
		width: 100%;
		height: var(--rt-ext-progress-height);
		overflow: hidden;
		border-radius: var(--atmr-border-radius-full);
		background: var(--rt-ext-progress-track);
	}
	.rt-ext-progress__fill {
		height: 100%;
		border-radius: inherit;
		background: var(--rt-ext-progress-color);
	}
	.rt-ext-progress--indeterminate .rt-ext-progress__fill {
		width: 40%;
		animation: rt-ext-progress-slide 1.4s var(--atmr-motion-easing-productive-standard, ease-in-out) infinite;
	}

	/* circular */
	.rt-ext-progress--circular {
		width: auto;
		align-items: center;
	}
	.rt-ext-progress__ring {
		position: relative;
		width: var(--rt-ext-progress-ring);
		height: var(--rt-ext-progress-ring);
	}
	.rt-ext-progress__svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.rt-ext-progress__ring-track {
		stroke: var(--rt-ext-progress-track);
	}
	.rt-ext-progress__ring-fill {
		stroke: var(--rt-ext-progress-color);
		stroke-linecap: round;
	}
	.rt-ext-progress__ring-value {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--atmr-fg-default);
		font-variant-numeric: tabular-nums;
	}
	.rt-ext-progress--indeterminate .rt-ext-progress__svg {
		animation: rt-ext-progress-spin 1.1s linear infinite;
	}

	@keyframes rt-ext-progress-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(250%);
		}
	}
	@keyframes rt-ext-progress-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* prefers-reduced-motion: no endless animation, a static "busy" state instead */
	@media (prefers-reduced-motion: reduce) {
		.rt-ext-progress--indeterminate .rt-ext-progress__fill,
		.rt-ext-progress--indeterminate .rt-ext-progress__svg {
			animation: none;
		}
	}
</style>
