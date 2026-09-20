// Deterministic CRM-like rows for the table scenario (seeded, so every run renders identical data).
const FIRST = ['Иван', 'Пётр', 'Анна', 'Мария', 'Сергей', 'Ольга', 'Дмитрий', 'Елена', 'Алексей', 'Наталья'];
const LAST = ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Смирнов', 'Попов', 'Васильев', 'Морозов', 'Волков', 'Соколов'];
const COMPANY = ['Ромашка', 'Вектор', 'Север', 'Технопарк', 'Альфа', 'Меридиан', 'Кристалл', 'Орион'];
const CITY = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Самара', 'Омск'];
const STATUS = ['Новый', 'В работе', 'Согласование', 'Оплачен', 'Закрыт'];

export function makeRows(n, seed = 42) {
	let s = seed >>> 0;
	const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
	const pick = (a) => a[Math.floor(rnd() * a.length)];
	const rows = new Array(n);
	for (let i = 0; i < n; i++) {
		const d = new Date(2024, 0, 1 + Math.floor(rnd() * 600));
		rows[i] = {
			id: i + 1,
			name: `${pick(LAST)} ${pick(FIRST)}`,
			company: `ООО «${pick(COMPANY)}»`,
			city: pick(CITY),
			status: pick(STATUS),
			amount: Math.round(rnd() * 1_000_000) / 100,
			date: d.toLocaleDateString('ru-RU'),
			phone: `+7 9${String(Math.floor(rnd() * 1e9)).padStart(9, '0').replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2-$3-$4')}`
		};
	}
	return rows;
}
