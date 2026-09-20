// Shared prop types of the side menu rows (each of them renders a ListItem)
import type { Content } from '../../internal/types.js';

/** ListItem props a side menu row understands (everything else is spread on the ListItem / Box) */
export interface SideMenuListItemBase {
	class?: string;
	/** Корневой элемент (аналог forwardRef) */
	ref?: HTMLElement | null;
	/** Иконка / контент в «начале» */
	prefix?: Content;
	/** Иконка / контент в «конце» */
	suffix?: Content;
	disabled?: boolean;
	selected?: boolean;
	/** Обработчик клика (React `onClick`) */
	onclick?: (event: MouseEvent) => void;
}
