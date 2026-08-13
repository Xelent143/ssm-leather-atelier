const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-legacy-woo-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'legacy-woo-test-password';
process.env.NODE_ENV = 'test';

fs.copyFileSync(
  path.join(__dirname, '..', 'data', 'admin-store.json'),
  path.join(tempDir, 'admin-store.json'),
);

const { server } = require('../server');

let baseUrl;

async function request(route) {
  return fetch(`${baseUrl}${route}`, { redirect: 'manual' });
}

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('legacy WooCommerce filters redirect to the clean canonical route', async () => {
  const response = await request('/shop/?stock_status=instock&filter_size=xl&filter_color=black');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/shop');
  assert.match(response.headers.get('cache-control') || '', /max-age=86400/);
});

test('legacy WooCommerce category archives map to the closest live collection', async () => {
  const cases = [
    ['/product-category/mens/mens-leather-vests/?filter_size=xl', '/men'],
    ['/product-category/womens/womens-leather-jackets/', '/women'],
    ['/product-category/leather-vests/', '/vests'],
    ['/product-category/leather-jackets/', '/jackets'],
    ['/product-category/leather-chaps/', '/pants'],
  ];

  for (const [route, destination] of cases) {
    const response = await request(route);
    assert.equal(response.status, 301, route);
    assert.equal(response.headers.get('location'), destination, route);
  }
});

test('legacy attribute and index.php routes are retired or redirected cleanly', async () => {
  const response = await request('/product/?attribute_pa_color=Black&attribute_pa_size=XL');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/shop');

  const legacyIndex = await request('/index.php?route=product/product&product_id=323');
  assert.equal(legacyIndex.status, 410);
  assert.match(legacyIndex.headers.get('x-robots-tag') || '', /noindex/);
});

test('known legacy product URLs redirect to the current PDP and retired products return 410', async () => {
  const live = await request('/product/black-white-hooded-leather-moto-vest/');
  assert.equal(live.status, 301);
  assert.equal(live.headers.get('location'), '/products/black-white-hooded-leather-moto-vest');

  const retired = await request('/product/retired-woo-product/');
  assert.equal(retired.status, 410);
  assert.match(retired.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(retired.headers.get('cache-control') || '', /max-age=86400/);
});

test('dead WooCommerce tag and API URLs return permanent 410 responses', async () => {
  const routes = [
    '/product-tag/obsolete-tag/?filter_color=black',
    '/wp-json/wc/v3/products',
    '/woocommerce-api/orders',
    '/wp-content/plugins/woocommerce/readme.txt',
  ];

  for (const route of routes) {
    const response = await request(route);
    assert.equal(response.status, 410, route);
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/, route);
  }
});

test('malformed encoded paths return 400 rather than a Search Console 5xx', async () => {
  const status = await new Promise((resolve, reject) => {
    const requestOptions = {
      host: '127.0.0.1',
      port: server.address().port,
      path: '/legacy-%ZZ-product',
      method: 'GET',
    };
    const req = http.request(requestOptions, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end();
  });

  assert.equal(status, 400);
});

test('sitemap contains only clean canonical URLs', async () => {
  const response = await request('/sitemap.xml');
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.doesNotMatch(xml, /product-category|product-tag|<loc>[^<]*\?/);
  assert.match(xml, /\/products\/black-white-hooded-leather-moto-vest/);
});
