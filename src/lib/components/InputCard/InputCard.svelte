<script lang="ts">
	// Port of packages/ui-kit/src/components/InputCard/InputCard.tsx
	// (the module only exists inside the React stories bundle; utilities are in ./utils.ts, the logotypes in ./constants.ts)
	//
	// A bank card number input built on top of <Input>: only digits are accepted, the number is grouped according to the
	// detected payment system (card-validator), the prefix icon becomes the logotype of the payment system and the value is
	// validated (Luhn / length of the system). Everything else (label, size, defaultValue, disabled, ...) goes to <Input>.
	//
	// Differences to React that come from the platform (behaviour is the same):
	//  * `ref` (forwardRef) is a bindable prop that holds the <input> element
	//  * `className` is `class`; `iconPrefix` accepts a snippet, a string or a number
	//  * `onChange(event)` receives the native `input` event
	import clsx from 'clsx';
	import valid from 'card-validator';
	import { untrack } from 'svelte';
	import PaymentCard from '../../icons/24/business/PaymentCard.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { noop } from '../../utils/function.js';
	import type { ValidationRule } from '../Input/hooks.svelte.js';
	import Input, { type InputProps } from '../Input/Input.svelte';
	import { CARD_ICONS } from './constants.js';
	import { getNormalizedStringWithGaps, getOnlyNumbersValue } from './utils.js';

	export interface InputCardProps
		extends Omit<InputProps, 'error' | 'forceError' | 'clearable' | 'required' | 'iconPrefix' | 'onChange' | 'validationRules' | 'transformationRule'> {
		/** Текст ошибки неверного номера */
		error?: string;
		/** Показывать ошибку валидации до потери фокуса */
		forceError?: boolean;
		/** Показывает кнопку очистки */
		clearable?: boolean;
		/** Обязательное поле */
		required?: boolean;
		/** Текст ошибки обязательного поля */
		requiredError?: string;
		/** Иконка в начале (по умолчанию — банковская карта) */
		iconPrefix?: Content;
		/** Изменение значения; получает нативное событие input */
		onChange?: (event: any) => void;
	}

	let {
		error: errorProp,
		forceError = false,
		clearable = false,
		required = false,
		requiredError = 'Поле обязательно для заполнения',
		iconPrefix,
		class: className = '',
		onChange = noop,
		ref = $bindable(null),
		...restProps
	}: InputCardProps = $props();

	const error = $derived(errorProp === undefined ? (forceError ? '' : 'Неправильный номер карты') : errorProp);

	// what the prefix icon shows: the logotype of the detected payment system or the `iconPrefix` (default: bank card)
	type IconState = { card: string } | { prefix: Content };
	let icon = $state.raw<IconState>({ prefix: untrack(() => iconPrefix) });
	let forceErrorOnComplition = $state(false);

	function handleChange(e: Event) {
		const formattedValue = getOnlyNumbersValue((e.target as HTMLInputElement).value);
		const { isValid, isPotentiallyValid, card } = valid.number(formattedValue);
		if (!isValid && !isPotentiallyValid) {
			forceErrorOnComplition = true;
		}
		if (card && card.lengths[0] <= formattedValue.length) {
			forceErrorOnComplition = !isValid;
		}
		icon = card ? { card: card.type } : { prefix: iconPrefix };
		onChange?.(e);
	}

	const requiredRule = $derived<ValidationRule>({
		error: requiredError,
		validate: (value: string) => value.length
	});

	const transformationRule = {
		transform(inputValue: string = '') {
			const formattedValue = getOnlyNumbersValue(inputValue);
			const { card } = valid.number(formattedValue);
			if (card) {
				return getNormalizedStringWithGaps(formattedValue, card.gaps);
			}
			return formattedValue;
		}
	};

	const validationRules = $derived.by(() => {
		const rules: ValidationRule[] = [
			{
				error,
				validate: (inputValue: string) => {
					const { isValid, isPotentiallyValid } = valid.number(inputValue);
					return inputValue === '' || (isPotentiallyValid && isValid);
				}
			}
		];
		if (required) {
			rules.push(requiredRule);
		}
		return rules;
	});

	const rootClassName = $derived(clsx('atmr-input--card', { 'atmr-input--required': required }, className && className));

	const logo = $derived('card' in icon ? CARD_ICONS[icon.card] : undefined);
	// `undefined` = no prefix icon at all (card type without a logotype); the default prefix icon is the bank card
	const iconContent = $derived<Content>('card' in icon ? (logo ? cardLogo : undefined) : icon.prefix === undefined ? paymentCard : icon.prefix);
</script>

{#snippet paymentCard()}<PaymentCard />{/snippet}
{#snippet cardLogo()}{#if logo}{@const Logo = logo}<Logo />{/if}{/snippet}

<Input
	{...restProps}
	bind:ref
	{clearable}
	class={rootClassName}
	iconPrefix={iconContent}
	onChange={handleChange}
	{validationRules}
	{transformationRule}
	inputmode="numeric"
	type="tel"
	maxlength={22}
	forceError={forceErrorOnComplition || forceError}
/>
