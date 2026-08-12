const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-admin-workflow-'));
process.env.ADMIN_DATA_DIR = dataDir;
delete process.env.DATABASE_URL;
delete process.env.NODE_ENV;

const { server } = require('../server');

let baseUrl;
let cookie = '';

async function request(urlPath, options = {}) {
  const response = await fetch(`${baseUrl}${urlPath}`, {
    ...options,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('admin can create a category, save a draft, publish it, and expose it publicly', async () => {
  const session = await request('/api/admin/session');
  assert.equal(session.response.status, 200);
  assert.equal(session.body.databaseConfigured, false);

  const login = await request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password: 'motogrip-admin' }),
  });
  assert.equal(login.response.status, 200);

  const category = await request('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test Jackets' }),
  });
  assert.equal(category.response.status, 201);
  assert.ok(category.body.categories.some((item) => item.name === 'Test Jackets'));

  const draft = {
    id: 'admin-workflow-product',
    slug: 'admin-workflow-product',
    title: 'Admin Workflow Product',
    description: 'A complete product created through the manual admin workflow.',
    category: 'Test Jackets',
    gender: 'Unisex',
    price: 250,
    status: 'draft',
    inventory: 19,
    madeToMeasureEnabled: true,
    madeToMeasureSurcharge: 50,
    image: 'assets/motogrip-logo-transparent.png',
    primaryImage: 'assets/motogrip-logo-transparent.png',
    stock: { M: 19 },
  };
  const saved = await request('/api/admin/store', {
    method: 'PUT',
    body: JSON.stringify({ ...category.body, products: [draft] }),
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.body.products[0].status, 'draft');

  const published = await request('/api/admin/products/admin-workflow-product/publish', { method: 'POST' });
  assert.equal(published.response.status, 200);
  assert.equal(published.body.products[0].status, 'active');

  const catalog = await request('/api/catalog');
  assert.equal(catalog.response.status, 200);
  assert.ok(catalog.body.products.some((item) => item.slug === draft.slug));

  const productPage = await fetch(`${baseUrl}/products/${draft.slug}`);
  assert.equal(productPage.status, 200);
  assert.match(await productPage.text(), /Admin Workflow Product/);
});

test('publishing rejects an incomplete draft', async () => {
  const store = await request('/api/admin/store');
  const incomplete = {
    id: 'incomplete-product',
    slug: 'incomplete-product',
    title: 'Incomplete Product',
    description: '',
    category: 'Test Jackets',
    price: 0,
    status: 'draft',
    image: 'assets/generated/leather-detail.png',
    primaryImage: 'assets/generated/leather-detail.png',
  };
  const saved = await request('/api/admin/store', {
    method: 'PUT',
    body: JSON.stringify({ ...store.body, products: [incomplete, ...store.body.products] }),
  });
  assert.equal(saved.response.status, 200);

  const published = await request('/api/admin/products/incomplete-product/publish', { method: 'POST' });
  assert.equal(published.response.status, 400);
  assert.match(published.body.error, /description, price, product image/);
});

test('database module defines PostgreSQL product, category, image, and state persistence', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'db.js'), 'utf8');
  assert.match(source, /CREATE TABLE IF NOT EXISTS admin_categories/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS admin_products/);
  assert.match(source, /image_bytes BYTEA/);
  assert.match(source, /CREATE TABLE IF NOT EXISTS admin_store_state/);
});

test('production admin login fails closed and marks cookies secure', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(source, /isProduction \? '' : 'motogrip-admin'/);
  assert.match(source, /Admin access is not configured/);
  assert.match(source, /isProduction \? '; Secure' : ''/);
  assert.match(source, /timingSafeEqual/);
});
