const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-business-mvp-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'business-mvp-test-password';
process.env.NODE_ENV = 'test';

const adminStorePath = path.join(tempDir, 'admin-store.json');
fs.copyFileSync(path.join(__dirname, '..', 'data', 'admin-store.json'), adminStorePath);

const {
  productMvpReadModel,
  server,
} = require('../server');

let baseUrl;
let cookie;

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function request(route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const data = await response.json().catch(() => ({}));
  return { data, response };
}

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const login = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  cookie = String(login.response.headers.get('set-cookie') || '').split(';')[0];
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('read model keeps every existing admin product visible without migration', () => {
  const legacyProducts = JSON.parse(fs.readFileSync(adminStorePath, 'utf8')).products;
  const products = productMvpReadModel.products();
  assert.equal(products.length, legacyProducts.length);
  assert.ok(products.every((product) => product.governance.state === 'not_migrated'));
  assert.ok(products.every((product) => product.source === 'legacy_source'));
  assert.ok(products.every((product) => product.recordKey.startsWith('legacy-')));

  const dashboard = productMvpReadModel.dashboard();
  assert.equal(dashboard.productCount, legacyProducts.length);
  assert.equal(dashboard.notMigratedCount, legacyProducts.length);
  assert.equal(dashboard.actionRequiredCount, legacyProducts.length);
});

test('MVP APIs require authentication and expose read-only product projections', async () => {
  const unauthorized = await request('/api/admin/mvp/dashboard');
  assert.equal(unauthorized.response.status, 401);
  const unauthorizedCatalog = await request('/api/admin/catalog');
  assert.equal(unauthorizedCatalog.response.status, 401);

  const beforeHash = hashFile(adminStorePath);
  const dashboard = await request('/api/admin/mvp/dashboard', {
    headers: { Cookie: cookie },
  });
  assert.equal(dashboard.response.status, 200);
  assert.ok(dashboard.data.productCount > 0);

  const products = await request('/api/admin/mvp/products', {
    headers: { Cookie: cookie },
  });
  assert.equal(products.response.status, 200);
  assert.equal(products.data.products.length, dashboard.data.productCount);

  const detail = await request(
    `/api/admin/mvp/products/${encodeURIComponent(products.data.products[0].recordKey)}`,
    { headers: { Cookie: cookie } },
  );
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.recordKey, products.data.products[0].recordKey);

  const catalog = await request('/api/admin/catalog', {
    headers: { Cookie: cookie },
  });
  assert.equal(catalog.response.status, 200);
  assert.equal(catalog.data.productCount, 14);
  assert.equal(catalog.data.products.length, 14);
  assert.equal(new Set(catalog.data.products.map((product) =>
    product.catalogProductId)).size, 14);
  assert.ok(catalog.data.products.every((product) =>
    product.source.system === 'motogrip_website'));
  assert.equal(hashFile(adminStorePath), beforeHash);
  assert.equal(fs.existsSync(path.join(tempDir, 'product-plm.json')), false);
});

test('MVP routes do not accept mutations', async () => {
  const beforeHash = hashFile(adminStorePath);
  const rejected = await request('/api/admin/mvp/products', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ title: 'Must not be created' }),
  });
  assert.ok([403, 404].includes(rejected.response.status));
  assert.equal(hashFile(adminStorePath), beforeHash);
});

test('public PDP receives the published website title and description override', async () => {
  const store = JSON.parse(fs.readFileSync(adminStorePath, 'utf8'));
  store.products.push({
    id: 'mj01',
    slug: 'dean-brown-leather-biker-jacket',
    title: 'Dean Brown Leather Biker Jacket Revised',
    category: 'Jackets',
    gender: 'Men',
    price: 299,
    status: 'active',
    inventory: 900,
    description: 'Owner-approved public website description.',
    stock: { M: 100 },
  });
  fs.writeFileSync(adminStorePath, `${JSON.stringify(store, null, 2)}\n`);

  const response = await fetch(`${baseUrl}/products/dean-brown-leather-biker-jacket`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /window\.__SSM_PRODUCT_OVERRIDE__/);
  assert.match(html, /Dean Brown Leather Biker Jacket Revised/);
  assert.match(html, /Owner-approved public website description/);

  const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(source, /p\.publicDescription \|\| p\.story\?\.piece/);
});
