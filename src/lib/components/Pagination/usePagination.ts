// Port of packages/ui-kit/src/components/Pagination/usePagination.tsx
//
// A plain function (React hook without state): it returns the list of items (`previous`, page numbers, ellipsis, `next`) for the given
// page. It receives the RAW props of `Pagination` (React passes `props` through), so the defaults are exactly the React ones:
// `pageSize = 1`, `siblingCount = 2`, and - a React quirk that is kept - `boundaryCount` is 1 only when `type` was passed explicitly as `buttons`.
import { PAGINATION_TYPES, type PaginationType } from './constants.js';

export type PaginationItemType = 'previous' | 'next' | 'page' | 'start-ellipsis' | 'end-ellipsis';

export interface PaginationItem {
	type: PaginationItemType;
	/** page the item leads to (`previous` / `next` = current page -/+ 1, `null` for an ellipsis) */
	page: number | null;
	selected: boolean;
	disabled: boolean | undefined;
	'aria-current'?: 'page';
}

export interface UsePaginationOptions {
	/** total number of elements (`Pagination` `count`) */
	count: number;
	/** current page (the state of `Pagination`) */
	page?: number;
	pageSize?: number;
	disabled?: boolean;
	type?: PaginationType;
	siblingCount?: number;
}

const range = (start: number, end: number): number[] => {
	const length = end - start + 1;
	return Array.from({ length }, (_, i) => start + i);
};

export function usePagination(props: UsePaginationOptions): { items: PaginationItem[] } {
	const { count: countProp, page = 1, pageSize = 1, disabled, type, siblingCount = 2 } = props;

	const boundaryCount = type === PAGINATION_TYPES.buttons ? 1 : -1;
	const count = Math.ceil(countProp / pageSize);

	const startPages = range(1, Math.min(boundaryCount, count));
	const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

	const siblingsStart = Math.max(Math.min(page - siblingCount, count - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2);
	const siblingsEnd = Math.min(Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2), count - boundaryCount - 1);

	const itemList: (number | PaginationItemType)[] = [
		'previous',
		...startPages,
		...(siblingsStart > boundaryCount + 2 ? (['start-ellipsis'] as const) : boundaryCount + 1 < count - boundaryCount ? [boundaryCount + 1] : []),
		...range(siblingsStart, siblingsEnd),
		...(siblingsEnd < count - boundaryCount - 1 ? (['end-ellipsis'] as const) : count - boundaryCount > boundaryCount ? [count - boundaryCount] : []),
		...endPages,
		'next'
	];

	const itemListMobile: (number | PaginationItemType)[] = [
		...(page === 1 || count <= 5 ? [] : (['previous'] as const)),
		...range(siblingsStart, siblingsEnd),
		...(page === count || count <= 5 ? [] : (['next'] as const))
	];

	const listToRender = type === PAGINATION_TYPES.buttonsMobile ? itemListMobile : itemList;

	const items = listToRender.map((item): PaginationItem => {
		if (typeof item === 'number') {
			return {
				type: 'page',
				page: item,
				selected: item === page,
				disabled,
				'aria-current': item === page ? 'page' : undefined
			};
		}
		return {
			type: item,
			page: item === 'previous' ? page - 1 : item === 'next' ? page + 1 : null,
			selected: false,
			disabled: disabled || (!item.includes('ellipsis') && (item === 'next' ? page >= count : page <= 1))
		};
	});

	return { items };
}
