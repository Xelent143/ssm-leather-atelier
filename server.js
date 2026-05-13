const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
const assetCdnBase = (process.env.ASSET_CDN_BASE || '').replace(/\/+$/, '');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
  });
  res.end(body);
}

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requested = cleanPath ? path.join(root, cleanPath) : path.join(root, 'index.html');
  const normalized = path.normalize(requested);
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }

  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (assetCdnBase && requestPath.startsWith('/assets/generated/')) {
    res.writeHead(302, {
      Location: `${assetCdnBase}${requestPath}`,
      'Cache-Control': 'public, max-age=300',
    });
    res.end();
    return;
  }

  const filePath = resolvePath(req.url || '/');
  if (!filePath) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    const finalPath = !statErr && stat.isFile() ? filePath : path.join(root, 'index.html');
    fs.readFile(finalPath, (readErr, data) => {
      if (readErr) {
        send(res, 404, 'Not found');
        return;
      }
      const ext = path.extname(finalPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      if (req.method === 'HEAD') res.end();
      else res.end(data);
    });
  });
});

server.listen(port, host, () => {
  console.log(`MOTOGRIP GEAR site listening on http://${host}:${port}`);
});
