// Port of packages/sidemenu/src/react/utils.ts

export interface SideMenuFilterItem {
	key: string;
	label?: string;
	topDivider?: boolean;
	children?: SideMenuFilterItem[];
}

/**
 * Filters the menu by a search query: all matching leaf items (no children) are returned in ONE group without dividers.
 * An empty (blank) query returns the items as is.
 */
export const filterMenuItems = <T extends SideMenuFilterItem>(items: T[], searchQuery: string): T[] => {
	if (!searchQuery.trim()) {
		return items;
	}
	const query = searchQuery.toLowerCase().trim();

	// collect all found items into a flat array
	const foundItems: SideMenuFilterItem[] = [];
	const collectMatchingItems = (value: SideMenuFilterItem[]) => {
		value.forEach((item) => {
			if (item.children) {
				collectMatchingItems(item.children);
			} else if ((item.label ?? '').toLowerCase().includes(query)) {
				foundItems.push(item);
			}
		});
	};
	items.forEach((group) => {
		collectMatchingItems(group.children ?? []);
	});
	if (foundItems.length === 0) {
		return [];
	}

	// all found items in a single group without dividers
	return [{ key: 'search-results', topDivider: false, children: foundItems } as T];
};
