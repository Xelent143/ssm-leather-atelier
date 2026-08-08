const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const {
  checkoutLineItems,
  homepageStaticHtml,
  injectRouteHead,
  injectRootHtml,
  productStaticHtml,
  publicProductForPdp,
  publicRoutes,
} = require('../server');

test('runtime stock creates a visible Size option when legacy options are absent', () => {
  const product = publicProductForPdp({
    id: 'runtime-vest',
    slug: 'runtime-vest',
    title: 'Runtime Vest',
    status: 'active',
    price: 190,
    stock: { XS: 19, S: 19, M: 19 },
    color: 'Black',
  });
  assert.deepEqual(product.options.find((option) => option.name === 'Size')?.values, ['XS', 'S', 'M']);
  assert.equal(product.variants.length, 3);
});

test('the PDP requires a size before Add to Bag is enabled', () => {
  for (const relativePath of ['ssm-pdp.jsx', 'index.html']) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.match(source, /const requiredOptionsSelected/);
    assert.match(source, /Select size to continue/);
    assert.match(source, /requiredOptionsSelected && selectedVariant/);
  }
});

test('checkout rejects a missing or invalid standard size', () => {
  assert.throws(() => checkoutLineItems([{ baseId: 'p13', qty: 1, fitMode: 'standard' }]), /Select a size/);
  assert.throws(() => checkoutLineItems([{ baseId: 'p13', qty: 1, fitMode: 'standard', size: 'INVALID' }]), /Select an available size/);
});

test('wholesale route is public and FAQ route injects FAQPage schema', () => {
  assert.equal(publicRoutes['/wholesale']?.view, 'consult');
  const html = '<html><head><title>Old</title><meta name="description" content="" /><meta name="robots" content="" /><link rel="canonical" href="" /><meta property="og:url" content="" /><meta property="og:type" content="website" /><meta property="og:title" content="" /><meta property="og:description" content="" /><meta property="og:image" content="" /><meta name="twitter:title" content="" /><meta name="twitter:description" content="" /><meta name="twitter:image" content="" /></head></html>';
  const body = injectRouteHead(html, publicRoutes['/faq'], {
    headers: { host: 'motogripgear.com' },
    url: '/faq',
  });
  assert.match(body, /"@type":"FAQPage"/);
});

test('storefront no longer references competitor-hosted swatches or stale category counts', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(source, /thejacketmaker\.com/i);
  assert.doesNotMatch(source, /ROAD ARMOR · 24 PIECES|LAYERING · 12 PIECES|RIDE-CUT · 16 PIECES/);
  assert.match(source, /"@type": "WebSite"/);
  assert.match(source, /react\.production\.min\.js/);
  assert.doesNotMatch(source, /react\.development\.js|react-dom\.development\.js/);
});

test('homepage and product routes expose useful server-rendered HTML before JavaScript', () => {
  const request = { headers: { host: 'motogripgear.com' } };
  const store = {
    settings: { storeName: 'MOTOGRIP GEAR', currency: 'USD' },
    products: [{
      id: 'active-one', slug: 'active-one', title: 'Active Jacket', status: 'active',
      price: 199, category: 'Jackets', image: '/active.jpg', imageAltText: 'Active jacket',
    }, {
      id: 'draft-one', slug: 'draft-one', title: 'Draft Jacket', status: 'draft',
      price: 99, image: '/draft.jpg',
    }],
  };
  const home = homepageStaticHtml(store, request);
  assert.match(home, /<h1>MOTOGRIP GEAR<\/h1>/);
  assert.match(home, /Active Jacket/);
  assert.doesNotMatch(home, /Draft Jacket/);
  const product = productStaticHtml(store.products[0], store, request);
  assert.match(product, /<h1>Active Jacket<\/h1>/);
  assert.match(product, /<img /);
  assert.match(injectRootHtml('<div id="root"></div>', product), /data-server-rendered="product"/);
});
