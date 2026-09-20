<script lang="ts">
	// `inputControl` of the story `components-input--input-amount`.
	//
	// The React story builds its amount input from react-number-format@4.9.4:
	//   <NumberFormat customInput={BaseInput} getInputRef={saveRef} thousandSeparator=" " decimalSeparator="," decimalScale={2}
	//                 allowedDecimalSeparators={[',', '.']} maxLength={18} {...props} />
	// where `props` are the props <Input> gives to its `inputControl` (type, value, className, placeholder, disabled, readOnly,
	// data-testid, required, rest attrs and the `onChange` of Input). `NumberFormatCore` (./numberFormat.ts) is the port of the
	// NumberFormat class; this component wires it to a real <input> exactly like the class component did:
	//  * its own state (`value`, `mounted`) renders `value` / `inputmode="numeric"` (set after mount)
	//  * `componentDidUpdate` = `updateValueIfRequired()` after the `value` prop changed and after every blur (in React the
	//    blur re-renders <Input>, which re-renders NumberFormat)
	// The Svelte <Input> passes its `handleChange` as `oninput` and expects the control to bind the <input> to `ref`.
	import { onMount, tick, untrack } from 'svelte';
	import { NumberFormatCore, addInputMode, type NumberFormatState } from './numberFormat.js';

	let { ref = $bindable(null), value, oninput, onfocus, onblur, onkeydown, onmouseup, ...rest }: Record<string, any> = $props();

	let nf = $state.raw<NumberFormatState>({ value: '', numAsString: '', mounted: false });
	const core: NumberFormatCore = new NumberFormatCore(
		() => ({
			thousandSeparator: ' ',
			decimalSeparator: ',',
			decimalScale: 2,
			allowedDecimalSeparators: [',', '.'],
			value,
			onChange: oninput,
			onFocus: onfocus,
			onBlur: onblur,
			onKeyDown: onkeydown,
			onMouseUp: onmouseup
		}),
		() => {
			nf = core.state;
		}
	);
	nf = core.state;

	onMount(() => {
		core.componentDidMount();
		return () => core.componentWillUnmount();
	});

	// componentDidUpdate: not called for the first render nor for changes of the own state
	let checkTick = $state(0);
	let first = true;
	$effect(() => {
		void value;
		void checkTick;
		if (first) {
			first = false;
			return;
		}
		untrack(() => core.updateValueIfRequired());
	});

	function handleBlur(e: FocusEvent) {
		core.onBlur(e);
		void tick().then(() => checkTick++);
	}

	const attrs = $derived({
		inputmode: nf.mounted && addInputMode() ? ('numeric' as const) : undefined,
		maxlength: 18,
		...rest,
		value: nf.value,
		oninput: core.onChange,
		onkeydown: core.onKeyDown,
		onmouseup: core.onMouseUp,
		onfocus: core.onFocus,
		onblur: handleBlur
	});
</script>

<input bind:this={ref} {...attrs} />
