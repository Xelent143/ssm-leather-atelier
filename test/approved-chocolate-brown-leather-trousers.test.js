const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));
const { missingSeedProducts } = require(path.join(root, 'db.js'));

const slug = 'chocolate-brown-leather-trousers';

test('chocolate brown leather trousers meet the publication contract', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product, 'product must exist in merchant catalog');
  assert.equal(product.id, 'p76');
  assert.equal(product.status, 'active');
  assert.equal(product.brand, 'MOTOGRIP GEAR');
  assert.equal(product.category, 'Pants');
  assert.equal(product.gender, 'Unisex');
  assert.equal(product.price, 249);
  assert.equal(product.inventory, 190);
  assert.equal(product.madeToMeasureEnabled, true);
  assert.equal(product.madeToMeasureSurcharge, 50);
  assert.deepEqual(product.options.map((option) => option.name), ['Size', 'Inseam']);
  assert.deepEqual(product.options[0].values, ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44']);
  assert.equal(product.options[1].values.length, 11);
  assert.ok(Object.values(product.stock).every((quantity) => quantity === 19));
  assert.equal(product.galleryImages.length, 0);
  assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
  assert.equal(product.color, 'Chocolate Brown');
  assert.equal(product.material, 'Leather');

  for (const image of [product.primaryImage, ...product.galleryImages]) {
    assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
  }

  const publicProduct = publicProductForPdp(product);
  assert.equal(publicProduct.factualProjection, true);
  assert.equal(publicProduct.images.length, 1);
  assert.equal(publicProduct.options.map((option) => option.name).join('|'), 'Color|Size|Inseam');
  assert.equal(publicProduct.variants.length, 10);
  assert.ok(publicProduct.variants.every((variant) => variant.quantity === 19));
  assert.ok(publicProduct.variants.every((variant) => variant.availableForSale));
  assert.ok(publicProduct.colors.every((color) => color.image));
  assert.equal(publicProduct.colors[0].color, '#4a2a21');

  const publicText = JSON.stringify(product);
  assert.doesNotMatch(publicText, /angel|angeljackets|fjackets|blingsoul|decrum/i);
  assert.doesNotMatch(publicText, /side-laced|laced-side|chatgpt image/i);

  assert.deepEqual(
    missingSeedProducts([product], [{ id: 'p75', slug: 'mens-waxed-brown-hooded-leather-puffer-jacket' }]).map((item) => item.slug),
    [slug],
  );
  assert.deepEqual(missingSeedProducts([product], [{ id: 'p76', slug }]), []);
});

test('chocolate brown leather trousers appear in the Pants collection cards', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexSource, new RegExp(`slug: '${slug}'`));
  assert.match(indexSource, /cat: 'Pants', gender: 'Unisex'/);
  assert.match(indexSource, /pants\/chocolate-brown-leather-trousers\/01-product-front\.jpeg/);
});
