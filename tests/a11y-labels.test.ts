import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Breadcrumbs, Button, Input, InputDate, Multiselect, TextArea } from '../src/lib/index.js';
import SideMenuHref from './fixtures/SideMenuHref.svelte';

const html = (component: any, props: Record<string, unknown> = {}) => render(component, { props }).body;
const text = (s: string) => createRawSnippet(() => ({ render: () => `<span>${s}</span>` }));

/** все английские aria-label / title, которые раньше торчали наружу */
const ENGLISH = /aria-label="(Clear|open|Input-right-icon|atmr-Input-right-icon|breadcrumbs dividermenu|Slider marks|grid)"/;

describe('подписи для скринридера — по-русски (A-2)', () => {
	it('Input: кнопка очистки', () => {
		const out = html(Input, { defaultValue: 'abc', clearable: true });
		expect(out).toContain('aria-label="Очистить"');
		expect(out).not.toMatch(ENGLISH);
	});

	it('Input: проп clearLabel перекрывает подпись', () => {
		expect(html(Input, { defaultValue: 'abc', clearable: true, clearLabel: 'Стереть поиск' })).toContain('aria-label="Стереть поиск"');
	});

	it('Input: кнопка-иконка в конце — «Действие», своя подпись перекрывает, без обработчика подписи нет', () => {
		const withClick = html(Input, { iconSuffix: text('i'), onClickIconSuffix: () => {} });
		expect(withClick).toContain('aria-label="Действие"');
		expect(withClick).not.toMatch(ENGLISH);
		expect(html(Input, { iconSuffix: text('i'), onClickIconSuffix: () => {}, iconSuffixLabel: 'Выбрать сделку' })).toContain('aria-label="Выбрать сделку"');
		const decorative = html(Input, { iconSuffix: text('i') });
		expect(decorative).not.toContain('aria-label');
		expect(decorative).not.toMatch(ENGLISH);
	});

	it('TextArea: кнопка очистки', () => {
		const out = html(TextArea, { defaultValue: 'abc', clearable: true });
		expect(out).toContain('aria-label="Очистить"');
		expect(html(TextArea, { defaultValue: 'abc', clearable: true, clearLabel: 'Стереть' })).toContain('aria-label="Стереть"');
	});

	it('Multiselect: «Открыть список», «Очистить», поле поиска с именем', () => {
		const items = [{ key: 'a', value: 'Альфа' }];
		const out = html(Multiselect, { items, label: 'Коллеги', defaultValue: [items[0]], clearable: true, clearAll: true });
		expect(out).toContain('aria-label="Открыть список"');
		expect(out).toContain('aria-label="Очистить"');
		expect(html(Multiselect, { items, label: 'Коллеги', autocomplete: { enabled: true } })).toContain('aria-label="Коллеги"');
		expect(out).not.toMatch(ENGLISH);
		// без текстовой подписи поле поиска всё равно названо
		expect(html(Multiselect, { items, autocomplete: { enabled: true } })).toContain('aria-label="Поиск"');
		const custom = html(Multiselect, { items, openLabel: 'Раскрыть', searchLabel: 'Найти коллегу', autocomplete: { enabled: true } });
		expect(custom).toContain('aria-label="Раскрыть"');
		expect(custom).toContain('aria-label="Найти коллегу"');
	});

	it('InputDate: поля периода названы, календарь — «Открыть календарь»', () => {
		const range = html(InputDate, { isRange: true });
		expect(range).toContain('aria-label="Начало периода"');
		expect(range).toContain('aria-label="Конец периода"');
		expect(range).toContain('aria-label="Открыть календарь"');
		expect(html(InputDate, {})).not.toContain('Начало периода');
	});

	it('Breadcrumbs: кнопка скрытых разделов', () => {
		const items = Array.from({ length: 8 }, (_, i) => ({ key: String(i), value: `Раздел ${i}`, href: `/${i}` }));
		const out = html(Breadcrumbs, { items, maxCrumbs: 3, maxVisibleCrumbs: 1 });
		expect(out).not.toMatch(ENGLISH);
		if (out.includes('atmr-breadcrumbs__dividermenu')) expect(out).toContain('aria-label="Скрытые разделы"');
	});
});

describe('Button без статического id (A-5)', () => {
	it('по умолчанию id нет, а заданный проходит как есть', () => {
		expect(html(Button, { label: 'ОК' })).not.toMatch(/\bid=/);
		expect(html(Button, { label: 'ОК', id: 'save' })).toContain('id="save"');
	});
});

describe('SideMenuItem с href — настоящая ссылка (A-3)', () => {
	const item = (isOpened: boolean, itemProps: Record<string, unknown>) => render(SideMenuHref, { props: { isOpened, itemProps } }).body;

	it('без href — как раньше: только <li>, ссылки нет', () => {
		const out = item(true, { onclick: () => {} });
		expect(out).toContain('atmr-side-menu__item');
		expect(out).not.toContain('<a');
		expect(out).not.toContain('atmr-side-menu__link');
	});

	it('с href — внутри <li> пустая ссылка на всю строку, имя берётся из title', () => {
		const out = item(true, { href: '/deals', title: 'Сделки', onclick: () => {} });
		expect(out).toMatch(/<li[^>]*atmr-side-menu__item/);
		expect(out).toMatch(/<a class="atmr-side-menu__link" href="\/deals" aria-label="Сделки"/);
		expect(out).toContain('data-icon="x"');
	});

	it('выбранный пункт помечен aria-current="page"', () => {
		expect(item(true, { href: '/deals', title: 'Сделки', selected: true })).toContain('aria-current="page"');
		expect(item(true, { href: '/deals', title: 'Сделки' })).not.toContain('aria-current');
	});

	it('свёрнутое меню: подписи нет, но ссылка есть и названа', () => {
		const out = item(false, { href: '/deals', title: 'Сделки' });
		expect(out).toContain('href="/deals"');
		expect(out).toContain('aria-label="Сделки"');
	});

	it('своё aria-label важнее title', () => {
		expect(item(true, { href: '/deals', title: 'Сделки', 'aria-label': 'Раздел «Сделки»' })).toContain('<a class="atmr-side-menu__link" href="/deals" aria-label="Раздел «Сделки»"');
	});
});
