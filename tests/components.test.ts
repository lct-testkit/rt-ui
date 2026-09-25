import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Badge, Button, Checkbox, Loader, Switch } from '../src/lib/index.js';

const html = (component: any, props: Record<string, unknown> = {}) => render(component, { props }).body;

describe('Button', () => {
	it('рендерит текст, тип и классы варианта/схемы/размера', () => {
		const out = html(Button, { label: 'Сохранить', variant: 'secondary', colorScheme: 'accent', size: 'l' });
		expect(out).toContain('Сохранить');
		expect(out).toContain('type="button"');
		expect(out).toContain('atmr-button--secondary');
		expect(out).toContain('atmr-button--size-l');
	});

	it('по умолчанию primary/accent/m и не disabled', () => {
		const out = html(Button, { label: 'ОК' });
		expect(out).toContain('atmr-button--primary');
		expect(out).toContain('atmr-button--accent');
		expect(out).toContain('atmr-button--size-m');
		expect(out).not.toMatch(/\bdisabled\b/);
	});

	it('disabled попадает в атрибут', () => {
		expect(html(Button, { label: 'ОК', disabled: true })).toMatch(/\bdisabled\b/);
	});

	it('пробрасывает произвольные атрибуты и свой класс', () => {
		const out = html(Button, { label: 'ОК', class: 'my-btn', 'aria-label': 'подтвердить' });
		expect(out).toContain('my-btn');
		expect(out).toContain('aria-label="подтвердить"');
	});
});

describe('простые компоненты рендерятся без ошибок', () => {
	it.each([
		['Badge', Badge, {}],
		['Loader', Loader, {}],
		['Checkbox', Checkbox, { label: 'Согласен' }],
		['Switch', Switch, {}]
	])('%s', (_name, component, props) => {
		expect(html(component, props).length).toBeGreaterThan(0);
	});
});
