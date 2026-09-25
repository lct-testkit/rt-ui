import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Юнит-/компонентные тесты библиотеки. Компоненты рендерятся на сервере (svelte/server) — без браузера:
// проверяется разметка, классы, атрибуты и то, что публичные экспорты не сломаны. Поведение в браузере
// и пиксельное соответствие — в Playwright (visual, см. ci.yml).
export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node',
		coverage: { provider: 'v8', include: ['src/lib/**/*.{ts,svelte}'], exclude: ['src/lib/**/*.d.ts'], reporter: ['text-summary', 'lcov'] }
	}
});
