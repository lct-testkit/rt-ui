<script lang="ts">
	// Port of packages/ui-kit/src/components/Tag/TagGroup/TagGroup.tsx
	// The group keeps its own copy of `items` (re-synced whenever the `items` prop changes), removes closed tags and, when
	// `editable`, lets the user add a tag through an "Добавить" button that turns into an input (Enter / blur commits).
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Content } from '../../../internal/types.js';
	import { noop } from '../../../utils/noop.js';
	import TagAdd from '../TagAdd/TagAdd.svelte';
	import TagInput, { type TagInputProps } from '../TagInput/TagInput.svelte';
	import TagItem from '../TagItem/TagItem.svelte';
	import {
		DEFAULT_SIZE,
		DEFAULT_TAG_MORE_BUTTON_TEXT,
		DEFAULT_VARIANT,
		TAG_SIZES,
		TAG_VARIANTS,
		warnDeprecatedSecondaryVariant,
		type TagSize,
		type TagVariant
	} from '../constants.js';

	export interface TagType {
		key: string;
		value: string;
	}

	export interface TagGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Размер компонента */
		size?: TagSize;
		/**
		 * Задаёт вариант для компонента.
		 * ⚠️ **Deprecated**: Вариант "secondary" убран в соответствии с дизайном. Используйте variant="primary"
		 */
		variant?: TagVariant;
		/** Элементы группы */
		items?: TagType[];
		/** Заблокированные элементы */
		disabledItems?: TagType[];
		/** Элементы с ошибкой */
		errorItems?: TagType[];
		/** Показывать кнопки закрытия у тегов */
		closable?: boolean;
		/** Позволяет добавлять теги */
		editable?: boolean;
		/** Максимальное количество символов в теге */
		maxSymbols?: number;
		/** Текст кнопки добавления */
		editLabel?: Content;
		/** Иконка кнопки добавления */
		icon?: Content;
		/** Вызывается при добавлении тега */
		onAdd?: (tag: TagType) => void;
		/** Вызывается при удалении тега */
		onRemove?: (tag: TagType) => void;
		/** Вызывается при изменении значения поля ввода */
		onChangeInput?: (value: string) => void;
		/** Показывать поле ввода всегда */
		inputVisible?: boolean;
		/** Элемент поля ввода (bind:inputRef) */
		inputRef?: HTMLInputElement | null;
		/** Доп. пропсы поля ввода */
		inputProps?: Omit<TagInputProps, 'ref'>;
	}

	let {
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		items = [],
		disabledItems = [],
		errorItems = [],
		closable = false,
		editable = false,
		maxSymbols,
		editLabel = DEFAULT_TAG_MORE_BUTTON_TEXT,
		class: className,
		icon,
		onAdd = noop,
		onRemove = noop,
		onChangeInput = noop,
		inputVisible: inputVisibleProp,
		inputRef = $bindable(null),
		inputProps,
		...restProps
	}: TagGroupProps = $props();

	if (variant === TAG_VARIANTS.secondary) {
		warnDeprecatedSecondaryVariant('TagGroup');
	}

	// useState(items) + useEffect(() => setGroupValue(items), [items])
	let groupValue = $derived(items);
	let inputVisible = $state(false);
	let inputValue = $state('');

	function closeHandler(removedTag: TagType, event: Event) {
		event.stopPropagation();
		if (disabledItems.some((disabledTag) => removedTag.key === disabledTag.key)) return;
		groupValue = groupValue.filter((tag) => tag.key !== removedTag.key);
		onRemove(removedTag);
	}

	function showInputHandler() {
		inputVisible = true;
	}

	function inputChangeHandler(event: Event & { currentTarget: HTMLInputElement }) {
		const newInputValue = event.currentTarget.value;
		inputValue = newInputValue;
		onChangeInput(newInputValue);
	}

	function inputSubmitHandler() {
		const newTagValue = inputValue.trim();
		if (newTagValue.length && !groupValue.some((gv) => gv.key === newTagValue)) {
			const newTag = { key: newTagValue, value: newTagValue };
			groupValue = [...groupValue, newTag];
			onAdd(newTag);
		}
		inputValue = '';
		inputVisible = false;
	}

	function keyPressHandler(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			inputSubmitHandler();
		}
	}

	$effect(() => {
		if (inputVisible) {
			inputRef?.focus();
		}
	});

	const rootClass = $derived(clsx('atmr-taggroup', `atmr-taggroup--${TAG_VARIANTS[variant]}`, `atmr-taggroup--size-${TAG_SIZES[size]}`, className));
</script>

<div class={rootClass} {...restProps}>
	<div class="atmr-taggroup__inner">
		{#each groupValue as tag (tag.key)}
			<TagItem
				data-key={tag.key}
				{variant}
				{size}
				{closable}
				disabled={Array.isArray(disabledItems) && disabledItems.some((disabledTag) => disabledTag.key === tag.key)}
				error={errorItems.some((invalidTag) => invalidTag.key === tag.key)}
				{maxSymbols}
				onClose={(e) => closeHandler(tag, e)}
				children={tag.value}
			/>
		{/each}
		{#if inputVisible || inputVisibleProp}
			<TagInput
				bind:ref={inputRef}
				value={inputValue}
				{size}
				{variant}
				oninput={inputChangeHandler}
				onblur={inputSubmitHandler}
				onkeydown={keyPressHandler}
				{...inputProps}
			/>
		{/if}
		{#if !inputVisible && editable}
			<TagAdd {variant} {size} {icon} onclick={showInputHandler} children={editLabel} />
		{/if}
	</div>
</div>
