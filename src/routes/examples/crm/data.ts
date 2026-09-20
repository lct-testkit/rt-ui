// Demo data of the CRM example: ~40 FICTIONAL universities. Names are generated from a city adjective + a type of institution,
// INN-like numbers and people are invented (any coincidence with a real organisation is accidental). The data is deterministic
// (seeded generator + a fixed "today"), so the screenshots of the docs are reproducible.

export type StatusKey = 'new' | 'talks' | 'active' | 'pause' | 'lost';

export interface Organization {
	id: number;
	name: string;
	city: string;
	inn: string;
	manager: string;
	status: StatusKey;
	/** last contact, ISO date */
	lastContact: string;
	/** deal amount, RUB */
	amount: number;
	email: string;
	rector: string;
}

/** the "current" date of the demo */
export const TODAY = new Date('2026-09-18T12:00:00');
export const CURRENT_USER = 'Мария Соколова';

/** status -> label + Badge colour scheme (design-system semantic colours) */
export const STATUSES: Record<StatusKey, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'status-02' }> = {
	new: { label: 'Новый', color: 'info' },
	talks: { label: 'Переговоры', color: 'status-02' },
	active: { label: 'Договор', color: 'success' },
	pause: { label: 'Пауза', color: 'warning' },
	lost: { label: 'Отказ', color: 'error' }
};
export const STATUS_ITEMS = (Object.keys(STATUSES) as StatusKey[]).map((key) => ({ key, value: STATUSES[key].label }));

const CITIES: [city: string, adjective: string][] = [
	['Казань', 'Казанский'], ['Самара', 'Самарский'], ['Екатеринбург', 'Уральский'], ['Новосибирск', 'Сибирский'],
	['Томск', 'Томский'], ['Пермь', 'Пермский'], ['Нижний Новгород', 'Волжский'], ['Уфа', 'Башкирский'],
	['Красноярск', 'Енисейский'], ['Воронеж', 'Черноземный'], ['Ростов-на-Дону', 'Донской'], ['Иркутск', 'Байкальский'],
	['Тюмень', 'Тюменский'], ['Омск', 'Омский'], ['Саратов', 'Саратовский'], ['Калининград', 'Балтийский'],
	['Владивосток', 'Дальневосточный'], ['Хабаровск', 'Амурский'], ['Челябинск', 'Южно-Уральский'], ['Краснодар', 'Кубанский']
];
const KINDS = [
	'государственный университет', 'технический университет', 'педагогический университет', 'университет телекоммуникаций',
	'медицинский университет', 'экономический университет', 'политехнический институт', 'аграрный университет'
];
const MANAGERS = ['Мария Соколова', 'Игорь Лебедев', 'Анна Воронцова', 'Павел Никитин', 'Елена Орлова', 'Денис Захаров'];
const RECTORS = ['Н. А. Громов', 'С. В. Белова', 'А. И. Тихонов', 'Е. П. Морозова', 'В. К. Пахомов', 'О. Л. Дьячкова', 'Д. С. Ершов'];
const STATUS_ORDER: StatusKey[] = ['active', 'talks', 'new', 'active', 'pause', 'talks', 'lost', 'new'];

/** tiny seeded PRNG (mulberry32) */
function rng(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function build(): Organization[] {
	const rnd = rng(2026);
	const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];
	return Array.from({ length: 40 }, (_, i) => {
		const [city, adjective] = CITIES[i % CITIES.length];
		const kind = KINDS[(i * 3 + Math.floor(i / CITIES.length) * 5) % KINDS.length];
		const contact = new Date(TODAY);
		contact.setDate(contact.getDate() - Math.floor(rnd() * 110));
		const domain = `${adjective.toLowerCase().slice(0, 5)}${i + 1}.example`;
		return {
			id: i + 1,
			name: `${adjective} ${kind}`,
			city,
			// INN-like number: 10 digits, NOT a valid checksum
			inn: String(1_000_000_000 + Math.floor(rnd() * 8_999_999_999)),
			manager: MANAGERS[i % MANAGERS.length],
			status: STATUS_ORDER[(i * 5 + Math.floor(rnd() * 3)) % STATUS_ORDER.length],
			lastContact: contact.toISOString().slice(0, 10),
			amount: Math.round((300 + rnd() * 9_700) / 10) * 10_000,
			email: `info@${domain}`,
			rector: pick(RECTORS)
		};
	});
}
export const ORGANIZATIONS: Organization[] = build();

const RU = new Intl.NumberFormat('ru-RU');
export const fmtMoney = (n: number) => `${RU.format(n)} ₽`;
export const fmtDate = (iso: string) => iso.split('-').reverse().join('.');
/** whole days between the demo "today" and an ISO date */
export const daysAgo = (iso: string) => Math.round((TODAY.getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000);
