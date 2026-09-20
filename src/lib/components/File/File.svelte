<script lang="ts">
	// Port of packages/ui-kit/src/components/File/File.tsx (+ File/useFileIcon.tsx -> ./useFileIcon.ts)
	//
	//   <File name="report.xlsx" fileSize={1232442424} size="xl" onAction={() => remove()} />
	//
	// DOM (identical to React):
	//   <div class="atmr-file atmr-file--horizontal|vertical atmr-file--primary atmr-file--size-m|xl atmr-file--color-* ..." [style] {...rest}>
	//     [<img class="atmr-file__preview">]                       <- only `preview && compact`
	//     <div class="atmr-file__icon" [style="--icon-background-color: ..."]>  file icon | preview <img> | error icon | Loader (spinner)
	//     <div class="atmr-file__content">
	//       <div class="atmr-file__title"><div>{name without its last 1 char before the dot}</div><div>{the rest}</div></div>   (React quirk kept)
	//       <div class="atmr-file__description">{error ? 'Ошибка' : description || formatBytes(fileSize)}</div>
	//     <div class="atmr-file__actions" data-testid="dropzone-actions">
	//       FunctionButton (`onFunctionButton`, not in compact) | CloseButton (`onAction`) | DropdownMenu + "more" CloseButton (`moreActions`)
	//
	// NODE PROPS: `icon`, `actionIcon`, `functionButtonIcon`, `description` are `Content` (string | Snippet). React's `moreActions[].icon` is
	// a function `() => ReactNode` (it becomes the DropdownMenu item `prefix`), here a Snippet with the item as its parameter:
	//   {#snippet download16()}<Download16 />{/snippet}
	//   moreActions = [{ title: 'Загрузить', icon: download16, onAction: () => ... }]
	//
	// Differences from React (all invisible in the DOM):
	//   * `moreActions[].onAction` IS called when its menu item is clicked. React looks the action up with `Array.filter` and then reads
	//     `.onAction` on the resulting ARRAY, so the callback never fires there (a bug); the intent is obvious, so it is implemented.
	//   * a `class` prop is merged into the root class list (React would replace the whole list with the `className`).
	//   * `ref` (bindable) is the root element (React `forwardRef`).
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import DocumentErrorMonochrome from '../../icons/24/document/DocumentErrorMonochrome.svelte';
	import More from '../../icons/24/navigation/More.svelte';
	import Loader from '../Loader/Loader.svelte';
	import CloseButton from '../Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '../Button/FunctionButton/FunctionButton.svelte';
	import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuItem } from '../DropdownMenu/types.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { useFileIcon } from './useFileIcon.js';

	/** One entry of the "more actions" menu */
	export interface FileMoreAction {
		/** Текст пункта меню (он же ключ) */
		title: string;
		/** Иконка пункта меню: React `icon: () => ReactNode` -> Snippet<[item]> */
		icon?: Snippet<[DropdownMenuItem]>;
		/** Вызывается при выборе пункта */
		onAction?: () => unknown;
	}

	export interface FileProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Задаёт вариант для компонента */
		variant?: 'primary';
		/** Задает размер */
		size?: 'm' | 'xl';
		/** Задаёт превью картинку для компактного варианта */
		preview?: string | null;
		/** Название файла */
		name?: string;
		/** Размер файла в байтах */
		fileSize?: number;
		/** Ошибка (true / текст ошибки) */
		error?: boolean | string;
		/** Вызывается при нажатии на кнопку экшена */
		onAction?: () => void;
		/** Включает компактный режим */
		compact?: boolean;
		/** Состояние загрузки */
		loading?: boolean;
		/** Описание файла */
		description?: Content;
		/** Стили корневого элемента */
		style?: StyleValue;
		/** иконка для Action button */
		actionIcon?: Content;
		/** иконка для функциональной кнопки */
		functionButtonIcon?: Content;
		/** Вызывается при нажатии на кнопку функциональной кнопки */
		onFunctionButton?: (e: MouseEvent) => void;
		/** Кнопка с выпадающим списком действий */
		moreActions?: FileMoreAction[];
		/** Скрыть бэкграунд у иконок в xl размере */
		hideIconBackground?: boolean;
		/** Цвет бэкграунда у иконок в xl размере */
		colorIconBackground?: string;
		/** Кастомная иконка файла */
		icon?: Content;
		/** Корневой элемент (React `forwardRef`) */
		ref?: HTMLDivElement | null;
	}

	let {
		variant = 'primary',
		size = 'm',
		preview = null,
		name,
		fileSize = 0,
		error,
		onAction,
		compact = false,
		loading = false,
		description,
		style,
		actionIcon,
		functionButtonIcon,
		onFunctionButton,
		moreActions = [],
		hideIconBackground,
		colorIconBackground,
		icon,
		class: className,
		ref = $bindable(null),
		...rest
	}: FileProps = $props();

	let isOpened = $state(false);

	const isHaveActionHandler = $derived(!!onAction);
	const isHaveFunctionHandler = $derived(!!onFunctionButton);
	const isShowMoreActions = $derived(moreActions.length > 0);

	const fileIcon = $derived(useFileIcon(name));
	const Icon = $derived(fileIcon.Icon);
	const iconType = $derived(fileIcon.iconType);

	const rootClass = $derived(
		clsx(
			'atmr-file',
			{
				'atmr-file--vertical': compact,
				'atmr-file--horizontal': !compact,
				'atmr-file--compact': compact,
				'atmr-file--preview': preview,
				'atmr-file--error': error,
				'atmr-file--loading': loading
			},
			`atmr-file--${variant}`,
			`atmr-file--size-${compact ? 'm' : size}`,
			{
				'atmr-file--color-accent': iconType === 'video',
				'atmr-file--color-info': iconType === 'doc',
				'atmr-file--color-warning': iconType === 'archive',
				'atmr-file--color-read': iconType === 'read',
				'atmr-file--color-neutral': iconType === 'other',
				'atmr-file--color-success': iconType === 'table',
				'atmr-file--color-status-01': iconType === 'code',
				'atmr-file--color-status-03': iconType === 'image',
				'atmr-file--color-status-06': iconType === 'audio',
				'atmr-file--custom-icon-color': colorIconBackground,
				'atmr-file--hide-background-icon': hideIconBackground && size === 'xl'
			},
			className
		)
	);
	const rootStyle = $derived(styleToString(style));
	const iconStyle = $derived(colorIconBackground ? `--icon-background-color: ${colorIconBackground}` : undefined);

	function formatBytes(bytes: number, decimals = 2) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
	}

	// the title is split one character BEFORE the last dot (`filenam` + `e.jpg`), exactly like React's `renderFileName`
	const splitIndex = $derived((name ?? '').lastIndexOf('.') - 1);
	const firstBlock = $derived((name ?? '').substring(0, splitIndex));
	const secondBlock = $derived((name ?? '').substring(splitIndex));

	const errorText = $derived(size === 'xl' && !compact ? 'Ошибка загрузки' : 'Ошибка');
	const closeButtonSize = $derived(size === 'xl' && !compact ? 's' : 'xs');

	const menuItems = $derived<DropdownMenuItem[]>(moreActions.map((a) => ({ key: a.title, value: a.title, prefix: a.icon })));

	function handleClickItem({ key }: DropdownMenuItem) {
		moreActions.find((a) => a.title === key)?.onAction?.();
	}
</script>

{#snippet moreIcon()}<More />{/snippet}

<div bind:this={ref} class={rootClass} style={rootStyle} {...rest}>
	{#if preview && compact}<img alt="" src={preview} class="atmr-file__preview" />{/if}
	<div class="atmr-file__icon" style={iconStyle}>
		{#if !loading && !error && preview && !compact && size !== 'm'}
			<img alt="" src={preview} class="atmr-file__preview" />
		{:else if !error && !loading}
			{#if icon}<Slot content={icon} />{:else}<Icon />{/if}
		{/if}
		{#if error}<DocumentErrorMonochrome />{/if}
		{#if loading}<Loader size="s" type="spinner" variant="secondary" />{/if}
	</div>
	<div class="atmr-file__content">
		<div class="atmr-file__title"><div>{firstBlock}</div><div>{secondBlock}</div></div>
		<div class="atmr-file__description">
			{#if error}{errorText}{:else if description}<Slot content={description} />{:else}{formatBytes(fileSize)}{/if}
		</div>
	</div>
	<div class="atmr-file__actions" data-testid="dropzone-actions">
		{#if !isShowMoreActions && !compact && isHaveFunctionHandler}
			<FunctionButton variant="tertiary" icon={functionButtonIcon} onclick={onFunctionButton} />
		{/if}
		{#if !isShowMoreActions && isHaveActionHandler}
			<CloseButton size={closeButtonSize} class="atmr-file__action-delete" closeIcon={actionIcon} onclick={() => onAction?.()} />
		{/if}
		{#if isShowMoreActions}
			<DropdownMenu {isOpened} size="s" onClose={() => (isOpened = false)} items={menuItems} onClickItem={handleClickItem}>
				<CloseButton size={closeButtonSize} closeIcon={moreIcon} onclick={() => (isOpened = true)} style="transform: rotate(90deg)" />
			</DropdownMenu>
		{/if}
	</div>
</div>
