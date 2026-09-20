<script lang="ts">
	// Port of packages/ui-kit/src/components/Loader/Loader.tsx (+ components/{Default,SpinnerBg,Spinner,Dots}.tsx)
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { LoaderSize, LoaderType, LoaderVariant } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Тип лоадера */
		type?: LoaderType;
		/** Размер */
		size?: LoaderSize;
		/** Вариант цвета */
		variant?: LoaderVariant;
	}

	let { type = 'default', size = 's', variant = 'primary', class: className, ...rest }: Props = $props();

	// Loader passes clsx(["atmr-loader--<type>", className]) down as className
	const rootClass = $derived(clsx('atmr-loader', `atmr-loader--${variant}`, `atmr-loader--size-${size}`, clsx([`atmr-loader--${type}`, className])));
</script>

{#if type === 'spinnerBg'}
	<div class={rootClass} {...rest}>
		<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M26 14C26 15.5759 25.6896 17.1363 25.0866 18.5922C24.4835 20.0481 23.5996 21.371 22.4853 22.4853C21.371 23.5996 20.0481 24.4835 18.5922 25.0866C17.1363 25.6896 15.5759 26 14 26C12.4241 26 10.8637 25.6896 9.4078 25.0866C7.95189 24.4835 6.62902 23.5996 5.51472 22.4853C4.40042 21.371 3.5165 20.0481 2.91345 18.5922C2.31039 17.1363 2 15.5759 2 14C2 12.4241 2.31039 10.8637 2.91345 9.4078C3.5165 7.95189 4.40042 6.62902 5.51472 5.51472C6.62902 4.40041 7.95189 3.5165 9.4078 2.91345C10.8637 2.31039 12.4241 2 14 2C15.5759 2 17.1363 2.31039 18.5922 2.91345C20.0481 3.5165 21.371 4.40042 22.4853 5.51472C23.5996 6.62902 24.4835 7.95189 25.0866 9.4078C25.6896 10.8637 26 12.4241 26 14L26 14Z"
				stroke="var(--atmr-loader-{variant}-bg-second-color)"
			/>
			<path
				d="M26 14C26 15.5759 25.6896 17.1363 25.0866 18.5922C24.4835 20.0481 23.5996 21.371 22.4853 22.4853C21.371 23.5996 20.0481 24.4835 18.5922 25.0866C17.1363 25.6896 15.5759 26 14 26"
				stroke="var(--atmr-loader-{variant}-bg-first-color)"
				stroke-linecap="round"
			/>
		</svg>
	</div>
{:else if type === 'spinner'}
	<div class={rootClass} {...rest}><div class="atmr-loader__spinner"></div></div>
{:else}
	<!-- 'default' and 'dots' both render three items -->
	<div class={rootClass} {...rest}>
		<span class="atmr-loader__item"></span><span class="atmr-loader__item"></span><span class="atmr-loader__item"></span>
	</div>
{/if}
