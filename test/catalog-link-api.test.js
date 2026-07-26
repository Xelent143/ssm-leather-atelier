const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-catalog-link-api-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'catalog-link-legacy-test-password';
process.env.NODE_ENV = 'test';
fs.copyFileSync(
  path.join(__dirname, '..', 'data', 'admin-store.json'),
  path.join(tempDir, 'admin-store.json'),
);

const { adminIdentity, server } = require('../server');

let baseUrl;
let namedCookie;
let namedCsrf;
const ownerPassword = 'Cedar lantern river workshop 2026!';

function cookieValue(setCookie) {
  return String(setCookie || '').split(';')[0];
}

async function request(route, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.origin !== false) headers.Origin = baseUrl;
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

test.before(async () => {
  await adminIdentity.bootstrapOwner({
    email: 'catalog.owner@example.com',
    displayName: 'Catalog Owner',
    password: ownerPassword,
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const login = await request('/api/admin/auth/named-login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'catalog.owner@example.com',
      password: ownerPassword,
    }),
  });
  assert.equal(login.response.status, 200);
  namedCookie = cookieValue(login.response.headers.get('set-cookie'));
  namedCsrf = login.data.csrfToken;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('Catalog linking APIs require authentication, CSRF, and an active Named Owner', async () => {
  const catalog = await request('/api/admin/catalog', {
    headers: { Cookie: namedCookie },
    origin: false,
  });
  assert.equal(catalog.response.status, 200);
  const catalogProductId = catalog.data.products[0].catalogProductId;

  const unauthorized = await request(`/api/admin/catalog/products/${catalogProductId}/ignore`, {
    method: 'POST',
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(unauthorized.response.status, 401);

  const missingCsrf = await request(`/api/admin/catalog/products/${catalogProductId}/ignore`, {
    method: 'POST',
    headers: { Cookie: namedCookie },
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(missingCsrf.response.status, 403);

  const ignored = await request(`/api/admin/catalog/products/${catalogProductId}/ignore`, {
    method: 'POST',
    headers: { Cookie: namedCookie, 'X-CSRF-Token': namedCsrf },
    body: JSON.stringify({ expectedRevision: 0, reason: 'Staging test record' }),
  });
  assert.equal(ignored.response.status, 200);
  assert.equal(ignored.data.product.linkStatus, 'Ignored');
});

test('Product DNA search and audit history are authenticated and payload-safe', async () => {
  const unauthorized = await request('/api/admin/catalog/product-dna?q=dean', { origin: false });
  assert.equal(unauthorized.response.status, 401);

  const search = await request('/api/admin/catalog/product-dna?q=dean', {
    headers: { Cookie: namedCookie },
    origin: false,
  });
  assert.equal(search.response.status, 200);
  assert.ok(Array.isArray(search.data.products));

  const audit = await request('/api/admin/catalog/audit', {
    headers: { Cookie: namedCookie },
    origin: false,
  });
  assert.equal(audit.response.status, 200);
  assert.equal(audit.data.events[0].action, 'catalog_product_ignored');
  assert.equal('password' in audit.data.events[0], false);
  assert.equal('passwordHash' in audit.data.events[0], false);
});
