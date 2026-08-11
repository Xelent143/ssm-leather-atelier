const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));

const slug = 'mens-crocodile-embossed-leather-denim-motorcycle-vest';

test('approved crocodile-embossed leather and denim vest meets its publication contract', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product, 'product must exist in merchant catalog');
  assert.equal(product.status, 'active');
  assert.equal(product.brand, 'MOTOGRIP GEAR');
  assert.equal(product.category, 'Vests');
  assert.equal(product.gender, 'Men');
  assert.equal(product.price, 220);
  assert.equal(product.inventory, 209);
  assert.equal(product.madeToMeasureEnabled, true);
  assert.equal(product.madeToMeasureSurcharge, 50);
  assert.deepEqual(product.options.find((option) => option.name === 'Size').values, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL', '7XL']);
  assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
  assert.equal(product.galleryImages.length, 6);
  assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
  assert.equal(product.colorImages['Red / Black'], product.primaryImage);
  assert.match(product.productType, /Men's leather vests/);

  for (const image of [product.primaryImage, ...product.galleryImages]) {
    assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
  }

  const publicProduct = publicProductForPdp(product);
  assert.equal(publicProduct.images.length, 7);
  assert.equal(publicProduct.variants.length, 11);
  assert.ok(publicProduct.variants.every((variant) => variant.quantity === 19));
  assert.ok(publicProduct.colors.every((color) => color.image));

  const publicText = JSON.stringify(product);
  assert.doesNotMatch(publicText, /angel|angeljackets|fjackets|blingsoul|decrum/i);
});

test('approved crocodile-embossed leather and denim vest appears in men collection cards', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexSource, new RegExp(`slug: '${slug}'`));
  assert.match(indexSource, /cat: 'Vests', gender: 'Men'/);
});
