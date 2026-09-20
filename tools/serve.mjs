// Static server for the mirrored Storybook. Serves _mirror/ at /, logs 404s, strips F5 bot-detection script from html.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '_mirror');
const port = Number(process.env.PORT ?? 6006);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.eot':'application/vnd.ms-fontobject' };
const miss = new Set();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/__missing') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify([...miss])); }
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/gen2/react-storybook/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    miss.add(p); res.writeHead(404); return res.end('nf');
  }
  const ext = path.extname(file);
  let body = fs.readFileSync(file);
  if (ext === '.html') body = Buffer.from(body.toString('utf8').replace(/<script[^>]+\/TSPD\/[^>]*><\/script>/g, ''));
  res.writeHead(200, { 'content-type': types[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(body);
}).listen(port, '127.0.0.1', () => console.log(`mirror on http://127.0.0.1:${port}/gen2/react-storybook/`));
