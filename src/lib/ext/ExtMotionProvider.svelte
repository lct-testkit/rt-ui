<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Global switch of the author's motion layer. Renders no DOM of its own (just its children); the settings are shared
	// with every extension-aware component below it through Svelte context (`useMotion()` / `getMotionMode()`).
	//
	//   <ExtMotionProvider mode="svelte" type="spring">          all extension-aware components animate
	//     <Slider value={[30]} />                                 inherits: animates with a Spring
	//     <Slider value={[30]} motion={false} />                  the component's own `motion` prop wins: original behaviour
	//     <Progress value={40} motion="tween" />                  ... and here a Tween
	//   </ExtMotionProvider>
	//
	// 'off' (default) = ORIGINAL behaviour everywhere. 'svelte' = Svelte transitions / Spring / Tween. In both modes
	// prefers-reduced-motion: reduce switches every animation off.
	//
	// It also loads the MOTION-ONLY styles of the extension (`ext.css`: the connector fill of the Wizard, the toast stack, the tabs indicator, the side menu labels ...).
	// Nothing else does (except the extension entry, `ext/index.ts`): a consumer that never imports the extension never gets that CSS.
	import './ext.css';
	import type { Snippet } from 'svelte';
	import { setMotionContext, type MotionKind, type MotionMode, type MotionOptions, type MotionOverride, type MotionType } from './motion.svelte.js';

	interface Props {
		/** [ext, not in original] Global mode: 'off' = original behaviour (default), 'svelte' = the author's Svelte motion. */
		mode?: MotionMode;
		/** [ext, not in original] Default engine for value motion when `mode` is 'svelte' and a component does not choose one. */
		type?: MotionType;
		/** [ext, not in original] Default options (duration / easing / stiffness / damping ...) merged into every component's motion. */
		options?: MotionOptions;
		/** [ext, not in original] Per-kind settings, e.g. `{ slider: 'spring', modal: false }`; they win over `mode`, a component's own `motion` prop wins over them. */
		overrides?: Partial<Record<MotionKind, MotionOverride>>;
		children?: Snippet;
	}

	let { mode = 'off', type = 'tween', options = {}, overrides = {}, children }: Props = $props();

	setMotionContext({
		get mode() {
			return mode;
		},
		get type() {
			return type;
		},
		get options() {
			return options;
		},
		get overrides() {
			return overrides;
		}
	});
</script>

{@render children?.()}
