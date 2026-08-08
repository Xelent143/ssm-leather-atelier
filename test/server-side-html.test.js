const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-server-html-'));
process.env.ADMIN_DATA_DIR = tempDir;
process.env.ADMIN_PASSWORD = 'server-html-test-password';
process.env.NODE_ENV = 'test';

const unsafeProduct = {
  id: 'escape-test',
  slug: 'road-and-rider-jacket',
  title: 'Road & Rider <Jacket> "Special"',
  description: 'Leather & lining with a <safe> fit.',
  seoDescription: 'Leather & lining with a <safe> fit.',
  category: 'Jackets & Coats',
  gender: 'Unisex',
  price: 249.5,
  status: 'active',
  inventory: 1,
  sku: 'MG-ESCAPE-1',
  brand: 'MOTOGRIP & GEAR',
  availability: 'InStock',
  primaryImage: '/assets/generated/test/road-and-rider.webp',
  galleryImages: ['/assets/generated/test/road-and-rider-detail.webp'],
  imageAltText: 'Road & Rider "Special" jacket',
};

fs.writeFileSync(path.join(tempDir, 'admin-store.json'), `${JSON.stringify({
  settings: {
    storeName: 'MOTOGRIP & GEAR',
    tagline: 'Built for <roads> & riders.',
    currency: 'USD',
  },
  products: [unsafeProduct],
  orders: [],
  returnRequests: [],
  activity: [{ id: 'test', type: 'system', message: 'test fixture' }],
}, null, 2)}\n`);

const { server } = require('../server');

let baseUrl;

test.before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('homepage response contains escaped server-rendered catalog HTML and absolute metadata', async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<div id="root"><main data-server-rendered="homepage">/);
  assert.match(html, /<h1>MOTOGRIP &amp; GEAR<\/h1>/);
  assert.match(html, /Built for &lt;roads&gt; &amp; riders\./);
  assert.match(html, /<h2>Road &amp; Rider &lt;Jacket&gt; &quot;Special&quot;<\/h2>/);
  assert.match(html, /href="\/products\/road-and-rider-jacket"/);
  assert.match(html, /alt="Road &amp; Rider &quot;Special&quot; jacket"/);
  assert.match(html, /USD 249\.50/);
  assert.match(html, /<link rel="canonical" href="https:\/\/motogripgear\.com\/" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/motogripgear\.com\/assets\/generated\/hero-atelier-campaign\.png" \/>/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/motogripgear\.com\/assets\/generated\/hero-atelier-campaign\.png" \/>/);
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.doesNotMatch(html, /<h2>Road & Rider <Jacket>/);
});

test('product response contains escaped static details, breadcrumbs, metadata and Product JSON-LD', async () => {
  const response = await fetch(`${baseUrl}/products/${unsafeProduct.slug}`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<div id="root"><main data-server-rendered="product">/);
  assert.match(html, /<h1>Road &amp; Rider &lt;Jacket&gt; &quot;Special&quot;<\/h1>/);
  assert.match(html, /Leather &amp; lining with a &lt;safe&gt; fit\./);
  assert.match(html, /<a href="\/">Home<\/a> \/ <a href="\/shop">Jackets &amp; Coats<\/a>/);
  assert.match(html, /src="https:\/\/motogripgear\.com\/assets\/generated\/test\/road-and-rider\.webp"/);
  assert.match(html, /alt="Road &amp; Rider &quot;Special&quot; jacket"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/motogripgear\.com\/products\/road-and-rider-jacket" \/>/);
  assert.match(html, /<meta property="og:image" content="https:\/\/motogripgear\.com\/assets\/generated\/test\/road-and-rider\.webp" \/>/);
  assert.match(html, /"@type":"Product"/);
  assert.match(html, /"sku":"MG-ESCAPE-1"/);
  assert.match(html, /"price":"249\.50"/);
  assert.match(html, /"priceCurrency":"USD"/);
  assert.match(html, /"availability":"https:\/\/schema\.org\/InStock"/);
});

test('sitemap and robots use the canonical production origin', async () => {
  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapXml = await sitemap.text();
  assert.equal(sitemap.status, 200);
  assert.match(sitemapXml, /<loc>https:\/\/motogripgear\.com\/<\/loc>/);
  assert.match(sitemapXml, /<loc>https:\/\/motogripgear\.com\/products\/road-and-rider-jacket<\/loc>/);

  const robots = await fetch(`${baseUrl}/robots.txt`);
  assert.equal(robots.status, 200);
  assert.equal(
    await robots.text(),
    'User-agent: *\nAllow: /\nSitemap: https://motogripgear.com/sitemap.xml\n',
  );
});

test('www host redirects permanently to the apex domain and preserves the request target', async () => {
  const result = await new Promise((resolve, reject) => {
    const request = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path: '/products/road-and-rider-jacket?source=www',
      method: 'GET',
      headers: { Host: 'www.motogripgear.com' },
    }, (response) => {
      response.resume();
      response.on('end', () => resolve({
        status: response.statusCode,
        location: response.headers.location,
      }));
    });
    request.on('error', reject);
    request.end();
  });

  assert.equal(result.status, 301);
  assert.equal(
    result.location,
    'https://motogripgear.com/products/road-and-rider-jacket?source=www',
  );
});
