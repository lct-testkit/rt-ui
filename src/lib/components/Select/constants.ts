// Port of packages/ui-kit/src/components/Select/constants.ts (TS enums become const objects + string unions).
// `Object.values(INPUT_SIZES)` keeps the React enum order: s, m, l.
import type { DropdownMenuItem } from '../DropdownMenu/types.js';
import { noop } from '../../utils/noop.js';

export const INPUT_SIZES = {
	s: 's',
	m: 'm',
	l: 'l'
} as const;
export type SelectSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];

export const INPUT_VARIANTS = {
	primary: 'primary'
} as const;
export type SelectVariant = (typeof INPUT_VARIANTS)[keyof typeof INPUT_VARIANTS];

/** Настройки автодополнения (React `autocomplete` prop). */
export interface SelectAutocomplete {
	/** Фильтрация элементов по введённому тексту (по умолчанию: вхождение подстроки в `value`, без учёта регистра) */
	filterOptions?: (inputValue: string | undefined, options: DropdownMenuItem[]) => DropdownMenuItem[];
	/** Включает ввод текста (иначе поле только для чтения) */
	enabled?: boolean;
	/** Вызывается при вводе текста */
	onChange?: (value: string) => void;
}

export const defaultFilterOptions = (inputValue: string | undefined = '', options: DropdownMenuItem[]): DropdownMenuItem[] => {
	if (!Array.isArray(options)) {
		return [];
	}
	return options.filter((option) => (option.value?.toString() ?? '').toLowerCase().indexOf(inputValue.toLowerCase()) !== -1);
};

export const DEFAULT_AUTOCOMPLETE: SelectAutocomplete = {
	filterOptions: defaultFilterOptions,
	enabled: true,
	onChange: noop
};
