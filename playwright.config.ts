import { defineConfig, devices } from '@playwright/test';

// Визуальные регрессии собственных эталонов (НЕ референса РТК: он лицензионный и не хранится в git).
// Эталоны лежат в e2e/*-snapshots/ и создаются на Linux в CI (workflow visual-baseline.yml): шрифт Rostelecom Basis
// отсутствует (лицензия), поэтому везде используется запасная гарнитура — рендер детерминирован.
//
//   npm run test:visual            сравнить с эталонами
//   npm run test:visual:update     (только на Linux/в CI) пересоздать эталоны
export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	expect: {
		toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide' }
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: 'http://127.0.0.1:5181',
		viewport: { width: 1280, height: 900 },
		locale: 'ru-RU',
		timezoneId: 'Europe/Moscow',
		colorScheme: 'light',
		reducedMotion: 'reduce'
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
	webServer: {
		command: 'npm run build && npx vite preview --port 5181 --host 127.0.0.1 --strictPort',
		url: 'http://127.0.0.1:5181',
		timeout: 240_000,
		reuseExistingServer: !process.env.CI
	}
});
