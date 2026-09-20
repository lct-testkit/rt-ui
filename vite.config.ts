import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: '127.0.0.1',
		port: 5180,
		strictPort: true,
		// the playground reads reference metadata from design/
		fs: { allow: ['.', 'design'] },
		// tools write reference data / logs while the dev server runs
		watch: { ignored: ['**/_mirror/**', '**/design/**', '**/tools/**'] }
	}
});
