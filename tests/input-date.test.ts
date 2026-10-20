import IMask from 'imask';
import { describe, expect, it } from 'vitest';
import { DATE_RANGE_TEXT_ERRORS, DATE_TEXT_ERRORS, getDateRangeTextStatus, getDateTextStatus, getInputDateMaskOptions, splitDateRangeText } from '../src/lib/components/InputDate/utils.js';

const FMT = 'DD.MM.YYYY';

/** набор текста по одному символу, как в поле: браузер дописывает символ, маска разбирает всё поле */
const type = (text: string, dateFormat = FMT, from = '') => {
	const mask = IMask.createMask(getInputDateMaskOptions(dateFormat) as any) as any;
	let value = from;
	for (const ch of text) {
		mask.resolve(value + ch);
		value = mask.value;
	}
	return { value, isComplete: mask.isComplete as boolean };
};

describe('getDateTextStatus', () => {
	it.each([
		['', 'empty'],
		['12.03.2026', 'valid'],
		['29.02.2028', 'valid'],
		['31.02.2026', 'nonexistent'],
		['29.02.2026', 'nonexistent'],
		['31.04.2026', 'nonexistent'],
		['15.13.2026', 'nonexistent'],
		['00.01.2026', 'nonexistent'],
		['01.00.2026', 'nonexistent'],
		['01.01.0026', 'nonexistent'],
		['01.01.26', 'shortYear'],
		['01.01.2', 'shortYear'],
		['01.01.202', 'shortYear'],
		['01.01.', 'partial'],
		['01.0', 'partial'],
		['3', 'partial']
	])('%s → %s', (text, status) => {
		expect(getDateTextStatus(text, FMT)).toBe(status);
	});

	it('с временем: год обрывается раньше времени', () => {
		const fmt = 'DD.MM.YYYY HH:mm';
		expect(getDateTextStatus('01.01.2026 10:30', fmt)).toBe('valid');
		expect(getDateTextStatus('01.01.26', fmt)).toBe('shortYear');
		expect(getDateTextStatus('01.01.2026 1', fmt)).toBe('partial');
		expect(getDateTextStatus('31.02.2026 10:30', fmt)).toBe('nonexistent');
		expect(getDateTextStatus('01.01.2026 25:00', fmt)).toBe('nonexistent');
	});

	it('у каждой ошибки есть текст, у «в порядке» — нет', () => {
		expect(DATE_TEXT_ERRORS.nonexistent).toBe('Такой даты нет');
		expect(DATE_TEXT_ERRORS.shortYear).toBe('Введите год полностью');
		expect(DATE_TEXT_ERRORS.partial).toBe('Введите дату полностью');
		expect(DATE_TEXT_ERRORS.valid).toBeNull();
		expect(DATE_TEXT_ERRORS.empty).toBeNull();
	});
});

describe('маска одиночной даты не подменяет введённое', () => {
	it('обычная дата набирается с точками', () => {
		expect(type('12.03.2026')).toEqual({ value: '12.03.2026', isComplete: true });
		expect(type('12032026').value).toBe('12.03.2026');
	});
	it('31.02.2026 остаётся 31.02.2026 (было 03.03.2026)', () => {
		expect(type('31.02.2026').value).toBe('31.02.2026');
		expect(type('31022026').value).toBe('31.02.2026');
	});
	it('месяц 13 остаётся 13 (было 12)', () => {
		expect(type('15.13.2026').value).toBe('15.13.2026');
	});
	it('год из двух цифр остаётся как набран', () => {
		expect(type('01.01.26').value).toBe('01.01.26');
	});
	it('вставка целиком тоже не меняется', () => {
		for (const text of ['31.02.2026', '15.13.2026', '00.01.2026', '29.02.2026']) {
			const mask = IMask.createMask(getInputDateMaskOptions(FMT) as any) as any;
			mask.resolve(text);
			expect(mask.value).toBe(text);
		}
	});
	it('буквы не набираются', () => {
		expect(type('1a2b.0c3').value).toBe('12.03');
	});
	it('с временем', () => {
		expect(type('01.01.2026 10:30', 'DD.MM.YYYY HH:mm').value).toBe('01.01.2026 10:30');
	});
});

describe('период: те же правила, что у одиночной даты', () => {
	const RANGE = (from: string, to: string) => `${from} - ${to}`;

	it('маска каждого конца не исправляет набранное (раньше 15.13 → 15.12)', () => {
		expect(type('15.13.2026').value).toBe('15.13.2026');
		expect(type('31.02.2026').value).toBe('31.02.2026');
		expect(type('01.01.26').value).toBe('01.01.26');
	});

	it('разбор текста на два конца; заглушка «...» — пустой конец', () => {
		expect(splitDateRangeText('01.01.2026 - 05.01.2026')).toEqual(['01.01.2026', '05.01.2026']);
		expect(splitDateRangeText('01.01.2026 - ...')).toEqual(['01.01.2026', '']);
		expect(splitDateRangeText('01.01.2026')).toEqual(['01.01.2026', '']);
		expect(splitDateRangeText('')).toEqual(['', '']);
	});

	it.each([
		['', 'empty'],
		[RANGE('01.01.2026', '05.01.2026'), 'valid'],
		[RANGE('01.01.2026', '01.01.2026'), 'valid'],
		['01.01.2026', 'valid'],
		[RANGE('01.01.2026', ''), 'valid'],
		[RANGE('01.01.2026', '...'), 'valid'],
		[RANGE('31.02.2026', '05.03.2026'), 'nonexistent'],
		[RANGE('01.03.2026', '31.02.2026'), 'nonexistent'],
		[RANGE('15.13.2026', '05.03.2026'), 'nonexistent'],
		[RANGE('01.03.2026', '15.13.2026'), 'nonexistent'],
		[RANGE('01.01.26', '05.03.2026'), 'shortYear'],
		[RANGE('01.01.2026', '05.03.26'), 'shortYear'],
		[RANGE('01.01.2026', '05.03.2'), 'shortYear'],
		[RANGE('01.0', '05.03.2026'), 'partial'],
		[RANGE('01.01.2026', '05.0'), 'partial'],
		[RANGE('', '05.03.2026'), 'partial'],
		[RANGE('31.02.2026', '05.0'), 'nonexistent'],
		[RANGE('01.01.26', '31.02.2026'), 'nonexistent'],
		[RANGE('05.03.2026', '01.03.2026'), 'reversed']
	])('%s → %s', (text, status) => {
		expect(getDateRangeTextStatus(text, FMT)).toBe(status);
	});

	it('с временем: конец раньше начала считается и по времени', () => {
		const fmt = 'DD.MM.YYYY HH:mm';
		expect(getDateRangeTextStatus('01.01.2026 10:30 - 01.01.2026 11:00', fmt)).toBe('valid');
		expect(getDateRangeTextStatus('01.01.2026 10:30 - 01.01.2026 09:00', fmt)).toBe('reversed');
		expect(getDateRangeTextStatus('01.01.2026 10:30 - 31.02.2026 09:00', fmt)).toBe('nonexistent');
	});

	it('тексты ошибок', () => {
		expect(DATE_RANGE_TEXT_ERRORS.reversed).toBe('Конец периода раньше начала');
		expect(DATE_RANGE_TEXT_ERRORS.nonexistent).toBe(DATE_TEXT_ERRORS.nonexistent);
		expect(DATE_RANGE_TEXT_ERRORS.shortYear).toBe(DATE_TEXT_ERRORS.shortYear);
		expect(DATE_RANGE_TEXT_ERRORS.partial).toBe(DATE_TEXT_ERRORS.partial);
		expect(DATE_RANGE_TEXT_ERRORS.valid).toBeNull();
	});
});
