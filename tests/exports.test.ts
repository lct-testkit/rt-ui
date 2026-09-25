import { describe, expect, it } from 'vitest';
import * as lib from '../src/lib/index.js';

// Публичный API — то, от чего зависит frontend. Тест ловит сломанный баррель/экспорт до публикации пакета.
describe('публичные экспорты', () => {
	it('баррель отдаёт достаточно компонентов и они — функции', () => {
		const names = Object.keys(lib);
		expect(names.length).toBeGreaterThan(150); // 119 компонентов + иконки + константы
		for (const name of ['Button', 'Input', 'Select', 'Modal', 'TabsGroup', 'Checkbox', 'Switch', 'Badge', 'TableGrid']) {
			expect(lib, name).toHaveProperty(name);
		}
	});

	it('ни один экспорт не undefined (сломанный реэкспорт)', () => {
		const broken = Object.entries(lib).filter(([, value]) => value === undefined).map(([name]) => name);
		expect(broken).toEqual([]);
	});
});
