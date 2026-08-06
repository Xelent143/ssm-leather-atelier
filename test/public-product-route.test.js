const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const { injectProductHead, publicProductForPdp, readPublicStore } = require('../server');

const vestSlugs = ['blue', 'black', 'red', 'white']
  .map((color) => `mens-${color}-swat-cowhide-leather-motorcycle-vest`);

test('merchant catalog products are projected into complete public PDP data', () => {
  const store = readPublicStore();
  for (const slug of vestSlugs) {
    const source = store.products.find((product) => product.slug === slug);
    assert.ok(source, `${slug} must exist in the merchant catalog`);
    const product = publicProductForPdp(source);
    assert.equal(product.slug, slug);
    assert.equal(product.name, source.title);
    assert.equal(product.price, 250);
    assert.equal(product.factualProjection, true);
    assert.equal(product.images.length, 8);
    assert.ok(product.images.every((image) => image.startsWith('/assets/')));
    assert.equal(product.options.find((option) => option.name === 'Size').values.length, 10);
    assert.equal(product.variants.length, 10);
    assert.ok(product.variants.every((variant) => variant.quantity === 19));
  }
});

test('product pages inject the requested public product before the route boots', () => {
  const store = readPublicStore();
  const html = '<html><head><title>Old</title><meta name="description" content="" /><link rel="canonical" href="" /><meta property="og:url" content="" /><meta property="og:type" content="website" /><meta property="og:title" content="" /><meta property="og:description" content="" /><meta property="og:image" content="" /><meta name="twitter:title" content="" /><meta name="twitter:description" content="" /><meta name="twitter:image" content="" /></head></html>';
  for (const slug of vestSlugs) {
    const source = store.products.find((product) => product.slug === slug);
    const body = injectProductHead(html, source, store, {
      headers: { host: 'motogripgear.com' },
      url: `/products/${slug}`,
    });
    const productIndex = body.indexOf('window.__SSM_INITIAL_PRODUCT__');
    const routeIndex = body.indexOf('window.__SSM_INITIAL_ROUTE__');
    assert.ok(productIndex >= 0 && routeIndex > productIndex);
    assert.match(body, new RegExp(`"slug":"${slug}"`));
    assert.match(body, new RegExp(source.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

for (const relativePath of ['ssm-app.jsx', 'index.html']) {
  test(`${relativePath} resolves an injected merchant product before static products`, () => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const injected = source.indexOf('(SSM_INITIAL_PRODUCT?.slug === slug ? SSM_INITIAL_PRODUCT : null)');
    const legacy = source.indexOf('SSM_PRODUCTS.find(p => p.slug === slug)', injected);
    assert.ok(injected >= 0 && legacy > injected);
  });
}
