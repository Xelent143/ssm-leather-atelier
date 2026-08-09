const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const slugs = [
  'mens-black-removable-hood-lambskin-jacket',
  'mens-dark-brown-removable-hood-lambskin-bomber-jacket',
  'mens-black-grey-removable-hood-lambskin-bomber-jacket',
  'mens-cognac-brown-removable-hood-lambskin-bomber-jacket',
];

test('approved hooded lambskin jackets retain their publication contract', () => {
  const products = slugs.map((slug) => catalog.products.find((product) => product.slug === slug));
  assert.ok(products.every(Boolean));

  for (const product of products) {
    assert.equal(product.status, 'active');
    assert.equal(product.brand, 'MOTOGRIP GEAR');
    assert.equal(product.price, 220);
    assert.equal(product.madeToMeasureEnabled, true);
    assert.equal(product.madeToMeasureSurcharge, 50);
    assert.deepEqual(product.options.find((option) => option.name === 'Size').values,
      ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']);
    assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
    assert.equal(product.inventory, 171);
    assert.equal(1 + product.galleryImages.length, 7);
    assert.equal(1 + product.galleryImageAltText.length, 7);
    assert.match(product.seoTitle, /MOTOGRIP GEAR/);
    assert.match(product.seoDescription, /MOTOGRIP GEAR/);

    const publicText = JSON.stringify(product);
    assert.doesNotMatch(publicText, /angel|edinburgh|ferndale|110016|111237|110897|110015/i);
    for (const image of [product.primaryImage, ...product.galleryImages]) {
      assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
    }
  }
});

test('client hydration preserves product-specific SEO metadata', () => {
  for (const relativePath of ['ssm-app.jsx', 'index.html']) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.match(source, /title = p\.seoTitle \|\| SSM_SEO\.pdp\.title/);
    assert.match(source, /p\.seoDescription \|\| p\.story\?\.piece \|\| p\.publicDescription/);
    assert.match(source, /params\?\.product\?\.canonicalUrl/);
  }
});
