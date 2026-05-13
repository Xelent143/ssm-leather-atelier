const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
const assetCdnBase = (process.env.ASSET_CDN_BASE || '').replace(/\/+$/, '');
const adminPassword = process.env.ADMIN_PASSWORD || 'motogrip-admin';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const dataDir = path.join(root, 'data');
const storePath = path.join(dataDir, 'admin-store.json');
const sessions = new Map();

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

function defaultStore() {
  return {
    settings: {
      storeName: 'MOTOGRIP GEAR',
      currency: 'USD',
      madeToMeasureSurcharge: 50,
      madeToMeasureLeadTime: '21-28 business days',
      supportEmail: 'support@motogripgear.com',
      brandVoice: 'Direct, road-tested, fit-aware, and precise.',
      imageryPrompt: 'Premium light-theme studio product photography for MOTOGRIP GEAR: warm ivory backdrop, road-ready leather jackets, crisp grain detail, natural daylight, soft shadow, editorial ecommerce crop, no dark background.',
    },
    products: [],
    orders: [],
    activity: [
      {
        id: 'act-1',
        at: new Date().toISOString(),
        type: 'system',
        message: 'Admin backend initialized',
      },
    ],
  };
}

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(storePath)) writeStore(defaultStore());
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function writeStore(store) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const next = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  const tmp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`);
  fs.renameSync(tmp, storePath);
}

function send(res, status, body, contentType = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store',
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), 'application/json; charset=utf-8', {
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((item) => {
    const [key, ...value] = item.trim().split('=');
    return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
  }));
}

function getSession(req) {
  const token = parseCookies(req).mg_admin;
  if (!token) return null;
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function setSession(res) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + sessionTtlMs });
  return `mg_admin=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(sessionTtlMs / 1000)}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function resolvePath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requested = cleanPath ? path.join(root, cleanPath) : path.join(root, 'index.html');
  const normalized = path.normalize(requested);
  if (!normalized.startsWith(root)) return null;
  return normalized;
}

function publicCatalog(store) {
  return {
    settings: store.settings,
    products: store.products.filter((product) => product.status !== 'archived'),
  };
}

function normalizeStore(input) {
  const current = readStore();
  const products = Array.isArray(input.products) ? input.products : current.products;
  const orders = Array.isArray(input.orders) ? input.orders : current.orders;
  const activity = Array.isArray(input.activity) ? input.activity : current.activity;
  return {
    settings: { ...current.settings, ...(input.settings || {}) },
    products: products.map((product) => ({
      id: String(product.id || crypto.randomUUID()),
      slug: String(product.slug || product.title || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      title: String(product.title || 'Untitled product'),
      category: String(product.category || 'Jackets'),
      gender: String(product.gender || 'Unisex'),
      price: Number(product.price || 0),
      compareAtPrice: product.compareAtPrice === null || product.compareAtPrice === '' ? null : Number(product.compareAtPrice || 0),
      status: ['active', 'draft', 'archived'].includes(product.status) ? product.status : 'draft',
      inventory: Number(product.inventory || 0),
      madeToMeasureEnabled: Boolean(product.madeToMeasureEnabled),
      madeToMeasureSurcharge: Number(product.madeToMeasureSurcharge || 0),
      tag: String(product.tag || ''),
      description: String(product.description || ''),
      image: String(product.image || ''),
      maker: String(product.maker || ''),
      stock: product.stock && typeof product.stock === 'object' ? product.stock : {},
    })),
    orders: orders.map((order) => ({
      ...order,
      id: String(order.id || crypto.randomUUID()),
      status: String(order.status || 'open'),
      total: Number(order.total || 0),
    })),
    activity,
  };
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/catalog' && req.method === 'GET') {
    sendJson(res, 200, publicCatalog(readStore()));
    return true;
  }

  if (pathname === '/api/admin/session' && req.method === 'GET') {
    sendJson(res, 200, {
      authenticated: Boolean(getSession(req)),
      defaultPasswordInUse: !process.env.ADMIN_PASSWORD,
    });
    return true;
  }

  if (pathname === '/api/admin/login' && req.method === 'POST') {
    const body = await readBody(req);
    if (body.password !== adminPassword) {
      sendJson(res, 401, { error: 'Invalid password' });
      return true;
    }
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': setSession(res) });
    return true;
  }

  if (pathname === '/api/admin/logout' && req.method === 'POST') {
    const token = parseCookies(req).mg_admin;
    if (token) sessions.delete(token);
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'mg_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
    return true;
  }

  if (!pathname.startsWith('/api/admin/')) return false;
  if (!getSession(req)) {
    sendJson(res, 401, { error: 'Authentication required' });
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'GET') {
    sendJson(res, 200, readStore());
    return true;
  }

  if (pathname === '/api/admin/store' && req.method === 'PUT') {
    const body = await readBody(req);
    const next = normalizeStore(body);
    next.activity = [
      {
        id: `act-${Date.now()}`,
        at: new Date().toISOString(),
        type: 'admin',
        message: 'Store data saved from admin panel',
      },
      ...next.activity.slice(0, 24),
    ];
    writeStore(next);
    sendJson(res, 200, readStore());
    return true;
  }

  sendJson(res, 404, { error: 'API route not found' });
  return true;
}

function serveFile(req, res, filePath) {
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
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const requestPath = decodeURIComponent(url.pathname);

    if (requestPath.startsWith('/api/')) {
      const handled = await handleApi(req, res, requestPath);
      if (handled) return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method not allowed');
      return;
    }

    if (assetCdnBase && requestPath.startsWith('/assets/generated/')) {
      res.writeHead(302, {
        Location: `${assetCdnBase}${requestPath}`,
        'Cache-Control': 'public, max-age=300',
      });
      res.end();
      return;
    }

    if (requestPath === '/admin' || requestPath.startsWith('/admin/')) {
      const hasExtension = Boolean(path.extname(requestPath));
      const assetPath = hasExtension ? requestPath.replace(/^\/admin/, '/admin') : '/admin.html';
      const adminFile = path.join(root, assetPath.replace(/^\/+/, ''));
      serveFile(req, res, adminFile);
      return;
    }

    const filePath = resolvePath(req.url || '/');
    if (!filePath) {
      send(res, 403, 'Forbidden');
      return;
    }

    serveFile(req, res, filePath);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: error.message || 'Server error' });
  }
});

ensureStore();

server.listen(port, host, () => {
  console.log(`MOTOGRIP GEAR site listening on http://${host}:${port}`);
});
