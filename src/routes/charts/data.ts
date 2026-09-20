/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Demo data of the /charts page: a FICTIONAL sales picture of a CRM that sells to universities (same domain as /examples/crm). Everything is
// deterministic (fixed numbers + a seeded generator), so the screenshots of the docs are reproducible.

/** seeded generator (LCG): the same sequence every time */
export function rng(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

// ─── revenue by month ───────────────────────────────────────────────────────────────────────────────────────────

export interface MonthRow {
	/** the 1st of the month (a `Date`: the line chart builds a calendar axis from it) */
	month: Date;
	/** fact of 2026 (`null` after the current month) */
	fact: number | null;
	/** plan of 2026 */
	plan: number;
	/** fact of 2025 */
	prev: number;
}

const M = (i: number) => new Date(2026, i, 1);
const REVENUE_PREV = [0.82, 0.91, 1.05, 1.12, 1.03, 1.18, 1.09, 0.97, 1.21, 1.34, 1.42, 1.65];
const REVENUE_PLAN = [0.95, 1.05, 1.2, 1.3, 1.25, 1.4, 1.35, 1.3, 1.5, 1.6, 1.7, 1.95];
const REVENUE_FACT = [0.98, 1.12, 1.17, 1.41, 1.28, 1.52, 1.44, 1.31, 1.63, null, null, null];
const DEALS_PREV = [21, 24, 27, 29, 26, 31, 28, 25, 32, 35, 37, 42];
const DEALS_PLAN = [24, 27, 30, 33, 31, 35, 34, 33, 37, 40, 42, 48];
const DEALS_FACT = [25, 29, 31, 36, 32, 38, 36, 33, 40, null, null, null];

/** revenue, RUB */
export const REVENUE: MonthRow[] = REVENUE_PREV.map((prev, i) => ({
	month: M(i),
	prev: Math.round(prev * 1e6),
	plan: Math.round(REVENUE_PLAN[i] * 1e6),
	fact: REVENUE_FACT[i] === null ? null : Math.round((REVENUE_FACT[i] as number) * 1e6)
}));
/** number of signed contracts */
export const DEALS: MonthRow[] = DEALS_PREV.map((prev, i) => ({ month: M(i), prev, plan: DEALS_PLAN[i], fact: DEALS_FACT[i] }));

/** a fresh revenue set for the "update data" button: the fact wobbles around its old values */
export function shuffled(rows: MonthRow[], seed: number): MonthRow[] {
	const r = rng(seed);
	return rows.map((row) => ({
		...row,
		fact: row.fact === null ? null : Math.round(row.fact * (0.82 + r() * 0.4)),
		prev: Math.round(row.prev * (0.9 + r() * 0.2))
	}));
}

// ─── deals by stage ─────────────────────────────────────────────────────────────────────────────────────────────

export interface StageRow {
	stage: string;
	small: number;
	mid: number;
	large: number;
}
export const STAGES: StageRow[] = [
	{ stage: 'Новый', small: 46, mid: 28, large: 12 },
	{ stage: 'Квалификация', small: 38, mid: 26, large: 11 },
	{ stage: 'Предложение', small: 24, mid: 21, large: 9 },
	{ stage: 'Переговоры', small: 15, mid: 17, large: 8 },
	{ stage: 'Договор', small: 9, mid: 12, large: 6 }
];

export const FUNNEL = [
	{ stage: 'Лиды', count: 1240 },
	{ stage: 'Квалифицированные', count: 812 },
	{ stage: 'Предложения', count: 447 },
	{ stage: 'Переговоры', count: 268 },
	{ stage: 'Договоры', count: 152 }
];

export const SOURCES = [
	{ source: 'Сайт', leads: 456 },
	{ source: 'Рекомендации', leads: 288 },
	{ source: 'Мероприятия', leads: 204 },
	{ source: 'Холодные звонки', leads: 144 },
	{ source: 'Партнёры', leads: 108 }
];

export const REGIONS = [
	{ region: 'Приволжский', deals: 34 },
	{ region: 'Центральный', deals: 26 },
	{ region: 'Уральский', deals: 18 },
	{ region: 'Сибирский', deals: 14 },
	{ region: 'Прочие', deals: 8 }
];

// ─── managers (TableGrid with sparklines) ───────────────────────────────────────────────────────────────────────

export interface ManagerRow {
	id: number;
	name: string;
	deals: number;
	revenue: number;
	conversion: number;
	/** revenue by week, thousand RUB */
	weeks: number[];
}

const NAMES = ['Мария Соколова', 'Игорь Лебедев', 'Анна Воронцова', 'Павел Никитин', 'Елена Орлова', 'Денис Захаров', 'Ольга Крылова', 'Артём Беляев'];
export const MANAGERS: ManagerRow[] = NAMES.map((name, i) => {
	const r = rng(1000 + i * 77);
	// a trend per manager: some grow, some fall, some are flat, so the sparklines differ
	const slope = [3.2, 1.4, -1.6, 2.4, -3.1, 0.2, 4.0, -0.6][i];
	const base = 180 + r() * 120;
	const weeks = Array.from({ length: 12 }, (_, w) => Math.max(20, Math.round(base + slope * w * 8 + (r() - 0.5) * 90)));
	return {
		id: i + 1,
		name,
		deals: 12 + Math.round(r() * 26),
		revenue: weeks.reduce((a, b) => a + b, 0) * 1000,
		conversion: Math.round((14 + r() * 16) * 10) / 10,
		weeks
	};
});

// ─── KPI tiles ──────────────────────────────────────────────────────────────────────────────────────────────────

export const SPARK = {
	revenue: [3.1, 3.4, 3.2, 3.9, 4.1, 3.8, 4.6, 4.9, 4.7, 5.4, 5.6, 6.1],
	deals: [96, 101, 99, 108, 112, 109, 117, 121, 119, 124, 126, 128],
	conversion: [19.8, 19.2, 20.1, 19.6, 19.0, 18.8, 19.1, 18.6, 18.9, 18.5, 18.6, 18.4],
	check: [88, 90, 89, 92, 91, 93, 95, 94, 96, 95, 97, 96.8],
	/** deals signed per week */
	weekly: [4, 7, 5, 9, 6, 8, 10, 7, 11, 9, 12, 10]
};
