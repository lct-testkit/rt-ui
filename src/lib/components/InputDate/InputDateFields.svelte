<script lang="ts">
	// Body of `RenderInputControl` (InputDate.tsx): the element Input renders instead of its <input>.
	//   single date: <div class="atmr-input__field"><input name="df"/></div>
	//   range:       <div class="atmr-input__field" style="display:flex..."><input name="df"/> <span> - </span> <input name="dt"/></div>
	// Every typed value goes through an imask date mask; the resulting string is reported to Input like a native `input` event.
	import { getContext, untrack } from 'svelte';
	import { scheduleContinuous } from '../PickerDate/scheduler.js';
	import { INPUT_DATE_CONTEXT, type InputDateContext } from './context.js';

	let {
		value = '',
		class: className,
		disabled,
		placeholder,
		oninput: onChange,
		ref = $bindable(null),
		...otherIProps
	}: Record<string, any> = $props();

	// React keeps the `value` ATTRIBUTE of a controlled <input> in sync with its value (`defaultValue`); the attribute mutation makes Chrome
	// repaint the field, which changes the anti-aliasing of a few pixels of the field, so it is mirrored here as well.
	const mirrorValue = (node: HTMLInputElement, v: string | undefined) => {
		node.defaultValue = v ?? '';
		return {
			update(next: string | undefined) {
				node.defaultValue = next ?? '';
			}
		};
	};

	const ctx = getContext<InputDateContext>(INPUT_DATE_CONTEXT);
	// constant for the lifetime of this component (InputDateControl re-creates it when `isRange` changes)
	const isRange: boolean = untrack(() => ctx.isRange);

	const SEPARATOR = ' - ';
	let activeValue = $state<string | undefined>(untrack(() => (isRange ? value.split(SEPARATOR)[0] : value)));
	let secondValue = $state<string | undefined>(untrack(() => (isRange ? value.split(SEPARATOR)[1] : value)));

	// React attributes of boolean type render as `attr=""` / no attribute (Svelte would print `attr="true"` on a <div>)
	const BOOLEAN_ATTRS = new Set(['readonly', 'required', 'disabled', 'multiple', 'autofocus', 'hidden', 'checked', 'selected']);
	const wrapperAttrs = $derived.by(() => {
		const out: Record<string, any> = {};
		for (const key of Object.keys(otherIProps)) {
			const v = otherIProps[key];
			if (BOOLEAN_ATTRS.has(key.toLowerCase())) {
				if (v) out[key] = '';
			} else {
				out[key] = v;
			}
		}
		return out;
	});

	// keep the two fields in sync with the value that Input holds.
	// React runs this in `useEffect` and the `setActiveValue` / `setSecondValue` inside re-render the control in a LATER task (the input text
	// is updated after the calendar / popper were already updated); the state updates are scheduled the same way, the masks are resolved
	// right away (that is what the effect itself does).
	$effect(() => {
		const v: string = value ?? '';
		const a = activeValue;
		const s = secondValue;
		untrack(() => {
			if (!`${a} - ${s}`.includes(v)) {
				if (isRange) {
					const [from, to] = v.split(SEPARATOR);
					scheduleContinuous(() => {
						activeValue = from;
					});
					ctx.masks.active.resolve(from);
					scheduleContinuous(() => {
						secondValue = to;
					});
					ctx.masks.second.resolve(to ?? '');
				} else {
					scheduleContinuous(() => {
						activeValue = v;
					});
					ctx.masks.active.resolve(v);
				}
			}
			if (!v) {
				scheduleContinuous(() => {
					activeValue = '';
					secondValue = '';
				});
				ctx.masks.active.resolve('');
				ctx.masks.second.resolve('');
			}
		});
	});

	// put the caret at the end of the field (after the click / key-up has been processed by the browser)
	const handleFocus = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const length = target.value.length;
		setTimeout(() => {
			target.setSelectionRange(length, length);
		});
	};

	// report `activeValue [- secondValue]` to Input as a (fake) input event
	const handleChange = (activeValueP: string, secondValueP?: string) => {
		if (!secondValueP || !isRange) {
			onChange?.({ target: { value: activeValueP } });
			return;
		}
		onChange?.({ target: { value: `${activeValueP}${SEPARATOR}${secondValueP}` } });
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		handleFocus(e);
		if (e.code.toLowerCase() === 'backspace' && ctx.masks.active.isComplete) {
			if (ctx.fields.active && ctx.fields.second === document.activeElement && ctx.fields.second!.value.length === 0) {
				ctx.masks.active.resolve(activeValue ?? '');
				activeValue = ctx.masks.active.value;
				handleChange(ctx.masks.active.value);
				ctx.fields.active.focus();
			}
		}
	};

	const handleActiveInput = (e: Event) => {
		const el = e.target as HTMLInputElement;
		const typed = el.value;
		ctx.masks.active.resolve(typed);
		activeValue = ctx.masks.active.value;
		el.value = activeValue; // controlled input
		handleChange(ctx.masks.active.value, isRange ? ctx.masks.second.value : undefined);
		if (isRange && ctx.masks.active.isComplete && ctx.fields.second) {
			const lastSymbol = typed.replace(ctx.masks.active.value, '');
			ctx.fields.second.focus();
			setTimeout(() => {
				secondValue = ctx.masks.second.value;
			});
			if (lastSymbol.length > 0) {
				ctx.masks.second.resolve(lastSymbol);
				secondValue = ctx.masks.second.value;
			}
		}
	};

	const handleSecondInput = (e: Event) => {
		const el = e.target as HTMLInputElement;
		ctx.masks.second.resolve(el.value);
		secondValue = ctx.masks.second.value;
		el.value = secondValue;
		handleChange(ctx.masks.active.value, ctx.masks.second.value);
	};
</script>

{#if isRange}
	<div class={className} bind:this={ref} {...wrapperAttrs} style:display="flex" style:justify-content="flex-start" style:width="100%" style:min-width="0">
		<input
			style:border="none"
			style:outline="unset"
			style:background="inherit"
			style:color="inherit"
			style:min-width="0"
			style:width="auto"
			style:field-sizing="content"
			value={activeValue}
			use:mirrorValue={activeValue}
			name="df"
			{disabled}
			{placeholder}
			bind:this={() => ctx.fields.active, (el) => (ctx.fields.active = el)}
			onclick={handleFocus}
			onkeyup={handleKeyUp}
			oninput={handleActiveInput}
		/>
		{#if secondValue}<span>{' - '}</span>{/if}
		<input
			style:border="none"
			style:outline="unset"
			style:background="inherit"
			style:color="inherit"
			style:min-width="0"
			style:width="auto"
			style:field-sizing="content"
			value={secondValue}
			use:mirrorValue={secondValue}
			name="dt"
			{disabled}
			bind:this={() => ctx.fields.second, (el) => (ctx.fields.second = el)}
			onclick={handleFocus}
			onkeyup={handleKeyUp}
			oninput={handleSecondInput}
		/>
	</div>
{:else}
	<div class={className} {...wrapperAttrs} style:width="100%" style:min-width="0" bind:this={ref}>
		<input
			name="df"
			style:border="none"
			style:outline="unset"
			style:background="inherit"
			style:color="inherit"
			style:min-width="0"
			style:width="100%"
			value={activeValue}
			use:mirrorValue={activeValue}
			{disabled}
			{placeholder}
			bind:this={() => ctx.fields.active, (el) => (ctx.fields.active = el)}
			onclick={handleFocus}
			onkeyup={handleFocus}
			oninput={handleActiveInput}
		/>
	</div>
{/if}
