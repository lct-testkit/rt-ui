// Port of design/react-src/stories-app/src/stories/Tree/utils.ts (`createRows`, the data of every Tree story)
import type { TreeNodeData } from '$lib/components/Tree/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createRows = (numberRows: number, attributes?: any, title?: string): TreeNodeData[] =>
	Array.from({ length: numberRows }, (_, i): TreeNodeData => ({
		id: `0-${i}`,
		key: `0-${i}`,
		name: `parent 0-${i}`,
		title: title || `parent 0-${i}`,
		attributes: attributes || undefined,
		state: { expanded: false },
		children: Array.from({ length: 4 }, (__, j): TreeNodeData => ({
			id: `0-${i}-${j}`,
			key: `0-${i}-${j}`,
			name: `child 0-${i}-${j}`,
			title: title || `child 0-${i}-${j}`,
			attributes: attributes || undefined,
			state: { expanded: false },
			children: Array.from({ length: 4 }, (___, l): TreeNodeData => ({
				id: `0-${i}-${j}-${l}`,
				key: `0-${i}-${j}-${l}`,
				name: `child 0-${i}-${j}-${l}`,
				title: title || `child 0-${i}-${j}-${l}`,
				attributes: attributes || undefined,
				state: { expanded: false },
				children: []
			}))
		}))
	}));
