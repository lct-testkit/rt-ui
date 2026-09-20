// Types of the DropdownMenu items (React: the `items` prop of DropdownMenu, `MenuItemProps` in DropdownMenu.tsx / hooks.tsx).
//
// React node props become `Content` (string | number | Snippet ...). React's `prefix` / `suffix` are FUNCTIONS `(item) => ReactNode`;
// their Svelte counterpart is a Snippet with one parameter (the item):
//
//   {#snippet heart()}<Heart size={16} />{/snippet}
//   const items = [{ key: 'polymer', value: 'Polymer', prefix: heart }];
import type { Snippet } from 'svelte';
import type { Content } from '../../internal/types.js';

export interface DropdownMenuItem {
	/** Уникальный ключ элемента (`data-key` обёртки) */
	key: string | number;
	/** Текст (узел) элемента */
	value?: Content;
	/** Подсказка под текстом */
	hint?: Content;
	/** Иконка в начале: React `prefix(item)` -> Snippet<[item]> */
	prefix?: Snippet<[DropdownMenuItem]>;
	/** Контент в конце: React `suffix(item)` -> Snippet<[item]> */
	suffix?: Snippet<[DropdownMenuItem]>;
	/** Иконка выбранного элемента */
	checkIcon?: Content | boolean;
	/** Отключённый элемент */
	disabled?: boolean;
	/** Элемент-заголовок (не кликабелен) */
	isTitle?: boolean;
	/** Элемент-разделитель */
	isDivider?: boolean;
	/** Выбранный элемент */
	isSelected?: boolean;
	/** Ошибка (не влияет на отрисовку DropdownMenu) */
	error?: unknown;
	/** Any other data of the consumer (`textColor`, ...) */
	[key: string]: unknown;
}
