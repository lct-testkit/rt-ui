// Local sink: browser POSTs binary bodies here, they land under _mirror/ (or any dir under root).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, process.env.SINK_DIR ?? '_mirror');
const port = Number(process.env.PORT ?? 8899);
let count = 0, bytes = 0;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Private-Network': 'true',
  'Access-Control-Max-Age': '600',
};

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/stats') { res.writeHead(200, cors); return res.end(JSON.stringify({ count, bytes })); }
  if (url.pathname !== '/put') { res.writeHead(200, cors); return res.end('ok'); }
  const rel = url.searchParams.get('path') ?? '';
  const target = path.resolve(base, rel.replace(/^[\/]+/, ''));
  if (!target.startsWith(base)) { res.writeHead(400, cors); return res.end('bad path'); }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const buf = Buffer.concat(chunks);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
    count++; bytes += buf.length;
    res.writeHead(200, cors); res.end(String(buf.length));
  });
}).listen(port, '127.0.0.1', () => console.log(`sink on :${port} -> ${base}`));
