const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const slugs = [
  'mens-black-leather-varsity-jacket-with-hood',
  'mens-camel-brown-leather-jacket-with-removable-hood',
  'mens-black-real-leather-bomber-jacket-with-detachable-hood',
  'mens-olive-green-real-leather-jacket-with-removable-hood',
];

test('approved next four hooded leather jackets meet their publication contract', () => {
  const products = slugs.map((slug) => catalog.products.find((product) => product.slug === slug));
  assert.ok(products.every(Boolean));

  for (const product of products) {
    assert.equal(product.status, 'active');
    assert.equal(product.brand, 'MOTOGRIP GEAR');
    assert.equal(product.price, 250);
    assert.equal(product.madeToMeasureEnabled, true);
    assert.equal(product.madeToMeasureSurcharge, 50);
    assert.equal(product.gender, 'Men');
    assert.deepEqual(product.subcategories, ['All Leather Jackets', 'Biker Jackets', 'Hooded Leather Jackets']);
    assert.deepEqual(product.options.find((option) => option.name === 'Size').values, ['XS','S','M','L','XL','XXL','3XL','4XL','5XL']);
    assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
    assert.equal(product.inventory, 171);
    assert.ok(product.galleryImages.length >= 8 && product.galleryImages.length <= 9);
    assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
    assert.match(product.seoTitle, /MOTOGRIP GEAR/);
    assert.match(product.seoDescription, /MOTOGRIP GEAR/);
    assert.equal(product.colorImages[product.colors[0]], `assets/generated/jackets/${product.slug}/03-product-front.jpg`);

    const publicText = JSON.stringify(product);
    assert.doesNotMatch(publicText, /angel|angeljackets|wayne|edinburgh|bruce|jeffery|11375|10819|11440|11567/i);
    for (const image of [product.primaryImage, ...product.galleryImages]) {
      assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
    }
  }
});

test('approved next four hooded jackets appear in men collection cards', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const slug of slugs) assert.match(indexSource, new RegExp(`slug: '${slug}'`));
});
