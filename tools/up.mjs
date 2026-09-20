// Idempotent: make sure the three helper servers are running (detached).
//   :6006  mirror of the reference Storybook   (tools/serve.mjs)
//   :5180  our playground (vite dev)            (npm run dev)
//   :8899  file sink used while scraping         (tools/receiver.mjs)  -> only with --sink
import net from 'node:net';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isUp = (port) => new Promise((res) => {
  const s = net.connect(port, '127.0.0.1');
  s.once('connect', () => { s.destroy(); res(true); });
  s.once('error', () => res(false));
});

async function ensure(name, port, cmd, args) {
  if (await isUp(port)) { console.log(`${name}: up (:${port})`); return; }
  const log = fs.openSync(path.join(root, 'tools', `${name}.log`), 'a');
  spawn(cmd, args, { cwd: root, detached: true, stdio: ['ignore', log, log], shell: process.platform === 'win32', windowsHide: true }).unref();
  for (let i = 0; i < 40; i++) { await new Promise((r) => setTimeout(r, 500)); if (await isUp(port)) { console.log(`${name}: started (:${port})`); return; } }
  console.log(`${name}: FAILED to start, see tools/${name}.log`);
}

await ensure('mirror', 6006, 'node', ['tools/serve.mjs']);
await ensure('dev', 5180, 'npm', ['run', 'dev']);
if (process.argv.includes('--sink')) await ensure('receiver', 8899, 'node', ['tools/receiver.mjs']);
