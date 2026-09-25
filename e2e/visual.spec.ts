import { expect, test, type Page } from '@playwright/test';

// Страницы playground без обращения к dev-only API: витрина графиков, расширения и пример CRM.
// Для каждой — светлая и тёмная тема (где страница принимает ?theme=). Анимации выключены (reducedMotion + animations: 'disabled').
const PAGES: { name: string; path: string; ready: string; themes: string[] }[] = [
	{ name: 'charts', path: '/charts', ready: 'body.rt-charts-demo', themes: ['rtk_default_light', 'rtk_default_dark'] },
	{ name: 'crm', path: '/examples/crm', ready: '.crm', themes: ['rtk_default_light', 'rtk_default_dark'] },
	{ name: 'ext', path: '/ext', ready: 'body', themes: [''] }
];

async function stabilise(page: Page) {
	await page.evaluate(() => document.fonts.ready);
	// дать отрисоваться ленивым блокам и графикам
	await page.waitForTimeout(800);
}

for (const p of PAGES) {
	for (const theme of p.themes) {
		test(`${p.name}${theme ? ` · ${theme}` : ''}`, async ({ page }) => {
			const errors: string[] = [];
			page.on('pageerror', (e) => errors.push(e.message));
			await page.goto(theme ? `${p.path}?theme=${theme}` : p.path, { waitUntil: 'load' });
			await page.waitForSelector(p.ready, { timeout: 20_000 });
			await stabilise(page);
			await expect(page).toHaveScreenshot(`${p.name}${theme ? `-${theme}` : ''}.png`, { fullPage: true });
			expect(errors, 'ошибки JS на странице').toEqual([]);
		});
	}
}
