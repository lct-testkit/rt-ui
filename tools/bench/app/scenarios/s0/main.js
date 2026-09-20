import { mount, tick } from 'svelte';
import App from './App.svelte';

performance.mark('bench-start');
mount(App, { target: document.getElementById('app') });
tick().then(() => performance.mark('bench-ready'));
