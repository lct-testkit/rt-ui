// Port of packages/tree/src/components/Tree/modules/selection/utils.ts (the checkbox logic of the Tree).
//
// The functions are ported 1:1, INCLUDING the in-place mutation of the node objects (React re-rendered because `setNodes` received a new
// map object although the nodes inside it were the same, mutated objects) - the SelectionProvider relies on that.
//
//   nodes = getNodes(data, checkedKeys, '', disabledKeys)      // key -> node with `childs` / `checkedChilds` / `uncheckedChilds` / `parent`
//   selectHandle(nodes, key, setNodes, disabledKeys)            // the click on the checkbox of `key`
//   [checked, indeterminate] = getSelectedNodes(nodes, key, checkedRows, indeterminateRows)   // the keys to report after a change
import type { TreeNodeData } from '../../types.js';

export interface SelectionNode {
	id: string;
	childs: string[];
	checkedChilds: string[];
	uncheckedChilds: string[];
	/** key of the parent node, '' for the top level */
	parent: string;
	checked: boolean;
	indeterminated?: boolean;
}

export type SelectionNodes = Record<string, SelectionNode>;

// create nodes

const getChild = (arr: TreeNodeData[], res: string[] = []): string[] => {
	arr.forEach((elem) => {
		res.push(elem.id);
		if (elem.children && elem.children.length > 0) {
			getChild(elem.children, res);
		}
	});
	return res;
};

const filterEnabledKeys = (keys: string[], disabledKeys: string[] = []): string[] => {
	if (!disabledKeys.length) {
		return keys;
	}
	return keys.filter((key) => !disabledKeys.includes(key));
};

export const getNodes = (arr: TreeNodeData[], selectedRows: string[], parent = '', disabledKeys: string[] = []): SelectionNodes => {
	const list = arr.reduce<SelectionNodes>((acc, curr) => {
		if (curr.children && curr.children.length > 0) {
			const allChilds = getChild(curr.children, []);
			const childs = filterEnabledKeys(allChilds, disabledKeys);
			acc = {
				...acc,
				[curr.id]: {
					id: curr.id,
					childs: [],
					checkedChilds: [],
					uncheckedChilds: [],
					parent,
					checked: selectedRows.includes(curr.id),
					indeterminated: false
				}
			};
			acc[curr.id].childs = childs;
			acc[curr.id].uncheckedChilds = childs.filter((elem) => !selectedRows.includes(elem));
			acc[curr.id].checkedChilds = childs.filter((elem) => selectedRows.includes(elem));
			if (acc[curr.id].checkedChilds.length > 0 && acc[curr.id].uncheckedChilds.length > 0) {
				acc[curr.id].indeterminated = true;
			}
			if (!acc[curr.id].checked && childs.length > 0 && acc[curr.id].checkedChilds.length === childs.length) {
				acc[curr.id].checked = true;
				acc[curr.id].indeterminated = false;
			}
			if (acc[curr.id].checked) {
				acc[curr.id].checkedChilds = [...childs];
				acc[curr.id].uncheckedChilds = [];
				acc = { ...acc, ...getNodes(curr.children, [...selectedRows, ...childs], curr.id, disabledKeys) };
			} else {
				acc = { ...acc, ...getNodes(curr.children, selectedRows, curr.id, disabledKeys) };
			}
		} else {
			acc = {
				...acc,
				[curr.id]: {
					id: curr.id,
					childs: [],
					checkedChilds: [],
					uncheckedChilds: [],
					parent,
					checked: selectedRows.includes(curr.id)
				}
			};
		}
		return acc;
	}, {});
	return list;
};

// click on the checkbox

const determineState = (node: SelectionNode, childs: string[], checkedChilds: string[], uncheckedChilds: string[]): void => {
	if (childs.length === 0) {
		node.indeterminated = false;
		return;
	}
	if (checkedChilds.length === childs.length) {
		node.checked = true;
		node.indeterminated = false;
	}
	if (uncheckedChilds.length === childs.length) {
		node.checked = false;
		node.indeterminated = false;
	}
	if (uncheckedChilds.length > 0 && checkedChilds.length > 0) {
		node.checked = false;
		node.indeterminated = true;
	}
};

const removeDuplicates = (arr: string[]): string[] =>
	arr.reduce<string[]>((acc, curr, idx) => {
		if (idx === 0) {
			acc.push(curr);
		} else if (!acc.includes(curr)) {
			acc.push(curr);
		}
		return acc;
	}, []);

const sanitizeChildLists = (node: SelectionNode): void => {
	node.checkedChilds = node.checkedChilds.filter((key) => node.childs.includes(key));
	node.uncheckedChilds = node.uncheckedChilds.filter((key) => node.childs.includes(key));
};

const climbTheTree = (nodes: SelectionNodes, parent: SelectionNode, checked: boolean, targetKey: string, children: string[]): void => {
	if (checked) {
		parent.checkedChilds = removeDuplicates([targetKey, ...children, ...parent.checkedChilds]);
		if (parent.uncheckedChilds.includes(targetKey) || children.some((key) => parent.uncheckedChilds.includes(key))) {
			parent.uncheckedChilds = parent.uncheckedChilds.filter((parentKey) => ![targetKey, ...children].includes(parentKey));
			parent.uncheckedChilds = removeDuplicates(parent.uncheckedChilds);
		}
	}
	if (!checked) {
		if (parent.checkedChilds.includes(targetKey)) {
			parent.checkedChilds = parent.checkedChilds.filter((parentKey) => ![...children, targetKey].includes(parentKey));
			parent.checkedChilds = removeDuplicates(parent.checkedChilds);
		}
		if (!parent.uncheckedChilds.includes(targetKey)) {
			parent.uncheckedChilds = removeDuplicates([...parent.uncheckedChilds, ...children, targetKey]);
		}
	}
	sanitizeChildLists(parent);
	determineState(parent, parent.childs, parent.checkedChilds, parent.uncheckedChilds);
	if (parent.parent !== '') {
		climbTheTree(nodes, nodes[parent.parent], checked, parent.id, parent.checked ? [...parent.childs] : [targetKey, ...children]);
	}
};

const syncNodeFromChildren = (nodes: SelectionNodes, nodeKey: string): void => {
	const node = nodes[nodeKey];
	if (!node || !node.childs.length) {
		return;
	}
	node.checkedChilds = node.childs.filter((key) => nodes[key]?.checked);
	node.uncheckedChilds = node.childs.filter((key) => !nodes[key]?.checked);
	sanitizeChildLists(node);
	determineState(node, node.childs, node.checkedChilds, node.uncheckedChilds);
};

const comeDownFromTree = (nodes: SelectionNodes, children: string[], checked: boolean): void => {
	const parentsToSync = new Set<string>();
	const visit = (keys: string[]): void => {
		keys.forEach((key) => {
			const child = nodes[key];
			if (!child) {
				return;
			}
			child.checked = checked;
			child.indeterminated = false;
			if (child.childs && child.childs.length) {
				if (checked) {
					child.checkedChilds = [...child.childs];
					child.uncheckedChilds = [];
				}
				if (!checked) {
					child.checkedChilds = [];
					child.uncheckedChilds = [...child.childs];
				}
				determineState(child, child.childs, child.checkedChilds, child.uncheckedChilds);
				visit([...child.childs]);
			}
			if (child.parent !== '' && nodes[child.parent]) {
				parentsToSync.add(child.parent);
			}
		});
	};
	visit(children);
	parentsToSync.forEach((parentKey) => {
		syncNodeFromChildren(nodes, parentKey);
	});
};

/** The click on the checkbox of `targetKey`: toggles it, spreads the new state down to its children and up to its parents. */
export const selectHandle = (nodes: SelectionNodes, targetKey: string, setNodes: (nodes: SelectionNodes) => void, disabledKeys: string[] = []): void => {
	if (disabledKeys.includes(targetKey)) {
		return;
	}
	const newNodes = { ...nodes };
	const node = newNodes[targetKey];
	if (!node) {
		return;
	}
	node.checked = !node.checked;
	node.indeterminated = false;
	if (node.childs && node.childs.length > 0) {
		if (node.checked) {
			node.checkedChilds = [...node.childs];
			node.uncheckedChilds = [];
		} else {
			node.uncheckedChilds = [...node.childs];
			node.checkedChilds = [];
		}
		comeDownFromTree(newNodes, [...node.childs], node.checked);
	}
	if (newNodes[targetKey].parent !== '') {
		climbTheTree(newNodes, newNodes[node.parent], node.checked, targetKey, [...node.childs]);
	}
	setNodes(newNodes);
};

// parsing checked end indeterminate rows

const climbTheTreeNodes = (nodes: SelectionNodes, parentKey: string, selectedKeys: string[], indeterminatedKeys: string[]): [string[], string[]] => {
	const parent = nodes[parentKey];
	if (parent.checked) {
		if (!selectedKeys.includes(parent.id)) {
			selectedKeys.push(parent.id);
		}
	} else {
		selectedKeys = selectedKeys.filter((key) => key !== parent.id);
	}
	if (parent.indeterminated) {
		if (!indeterminatedKeys.includes(parent.id)) {
			indeterminatedKeys.push(parent.id);
		}
	} else {
		indeterminatedKeys = indeterminatedKeys.filter((key) => key !== parent.id);
	}
	if (parent.parent !== '') {
		const [nextSelectedKeys, nextIndeterminatedKeys] = climbTheTreeNodes(nodes, parent.parent, selectedKeys, indeterminatedKeys);
		selectedKeys = [...nextSelectedKeys];
		indeterminatedKeys = [...nextIndeterminatedKeys];
	}
	return [selectedKeys, indeterminatedKeys];
};

const comeDownFromTreeNodes = (nodes: SelectionNodes, children: string[], indeterminatedKeys: string[]): string[] => {
	children.forEach((child) => {
		if (nodes[child].indeterminated) {
			if (!indeterminatedKeys.includes(child)) {
				indeterminatedKeys.push(child);
			}
		} else {
			indeterminatedKeys = indeterminatedKeys.filter((key) => key !== child);
		}
		if (nodes[child].childs.length) {
			comeDownFromTreeNodes(nodes, [...nodes[child].childs], indeterminatedKeys);
		}
	});
	return indeterminatedKeys;
};

/** The checked and the indeterminate keys of the whole tree after the state of `targetKey` changed (`selectedKeys` / `indeterminatedKeys` = the previous ones). */
export const getSelectedNodes = (nodes: SelectionNodes, targetKey: string, selectedKeys: string[], indeterminatedKeys: string[]): [string[], string[]] => {
	const node = nodes[targetKey];
	indeterminatedKeys = indeterminatedKeys.filter((key) => key !== targetKey);
	if (!node) {
		return [selectedKeys, indeterminatedKeys];
	}
	if (node.checked) {
		if (!selectedKeys.includes(node.id)) {
			selectedKeys.push(node.id);
		}
	} else {
		selectedKeys = selectedKeys.filter((key) => key !== node.id);
	}
	node.checkedChilds.forEach((key) => {
		if (!selectedKeys.includes(key)) {
			selectedKeys.push(key);
		}
	});
	selectedKeys = selectedKeys.filter((key) => !node.uncheckedChilds.includes(key));
	if (node.childs.length) {
		indeterminatedKeys = [...comeDownFromTreeNodes(nodes, [...node.childs], indeterminatedKeys)];
	}
	if (node.parent !== '') {
		const [selected, indeterminated] = climbTheTreeNodes(nodes, node.parent, [...selectedKeys], [...indeterminatedKeys]);
		selectedKeys = [...selected];
		indeterminatedKeys = [...indeterminated];
	}
	selectedKeys = removeDuplicates(selectedKeys);
	indeterminatedKeys = removeDuplicates(indeterminatedKeys);
	return [selectedKeys, indeterminatedKeys];
};
