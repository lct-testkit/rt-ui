// Port of packages/ui-kit/src/components/Multiselect/constants.ts (TS enums become const objects + string unions).
// `Object.values(INPUT_SIZES)` keeps the React enum order: s, m, l.
import type { DropdownMenuItem } from '../DropdownMenu/types.js';
import { noop } from '../../utils/noop.js';

export const INPUT_SIZES = {
	s: 's',
	m: 'm',
	l: 'l'
} as const;
export type MultiselectSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];

export const ICON_CLOSE_SIZE_MAP: Record<MultiselectSize, number> = {
	l: 24,
	m: 24,
	s: 16
};

export const INPUT_VARIANTS = {
	primary: 'primary'
} as const;
export type MultiselectVariant = (typeof INPUT_VARIANTS)[keyof typeof INPUT_VARIANTS];

/** Настройки автодополнения (React `autocomplete` prop). */
export interface MultiselectAutocomplete {
	/** Фильтрация элементов по введённому тексту (по умолчанию: вхождение подстроки в `value`, без учёта регистра) */
	filterOptions?: (inputValue: string | undefined, options: DropdownMenuItem[]) => DropdownMenuItem[];
	/** Включает ввод текста (иначе поле только для чтения) */
	enabled?: boolean;
	/** Вызывается при вводе текста */
	onChange?: (value: string) => void;
	/** Очищать поле поиска после выбора (NOTE React: без явного значения = false; true только у значения по умолчанию) */
	clearSearchOnSelect?: boolean;
}

export const defaultFilterOptions = (inputValue: string | undefined = '', options: DropdownMenuItem[]): DropdownMenuItem[] => {
	if (inputValue) {
		return options.filter((option) => String(option.value).toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
	}
	return options;
};

export const DEFAULT_AUTOCOMPLETE: MultiselectAutocomplete = {
	filterOptions: defaultFilterOptions,
	enabled: false,
	onChange: noop,
	clearSearchOnSelect: true
};
