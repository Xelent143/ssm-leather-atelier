const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));

const slug = 'mens-semi-aniline-sheepskin-leather-puffer-bomber-jacket';
const blockedReferenceTerms = /jacketmaker|the jacket maker|lucas|angeljackets|angel jackets|fjackets|blingsoul|decrum/i;

test('approved sheepskin leather puffer bomber meets its publication contract', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product, 'product must exist in merchant catalog');
  assert.equal(product.id, 'p74');
  assert.equal(product.status, 'active');
  assert.equal(product.brand, 'MOTOGRIP GEAR');
  assert.equal(product.category, 'Jackets');
  assert.equal(product.gender, 'Men');
  assert.equal(product.price, 332);
  assert.equal(product.inventory, 171);
  assert.equal(product.madeToMeasureEnabled, true);
  assert.equal(product.madeToMeasureSurcharge, 50);
  assert.deepEqual(product.subcategories, ['Puffer Jackets', 'Winter Jackets']);
  assert.deepEqual(product.options.find((option) => option.name === 'Size').values, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']);
  assert.deepEqual(product.colors, ['Brown', 'Navy Blue', 'Black', 'Forest Green']);
  assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
  assert.equal(product.galleryImages.length, 24);
  assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
  assert.equal(Object.keys(product.colorImages).length, 4);
  assert.match(product.productType, /Men's leather jackets > Puffer bomber jackets/);
  assert.match(product.galleryImages.join(' '), /brown\/06-brown-pocket-cuff-close-up\.png/);

  for (const image of [product.primaryImage, ...product.galleryImages, ...Object.values(product.colorImages)]) {
    assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
  }

  const publicProduct = publicProductForPdp(product);
  assert.equal(publicProduct.images.length, 25);
  assert.equal(publicProduct.variants.length, 36);
  assert.ok(publicProduct.variants.every((variant) => variant.quantity === 19));
  assert.equal(publicProduct.colors.length, 4);
  assert.ok(publicProduct.colors.every((color) => color.image));
  assert.doesNotMatch(JSON.stringify(product), blockedReferenceTerms);
});
test('approved puffer bomber appears only in the requested men collections', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product.subcategories.includes('Puffer Jackets'));
  assert.ok(product.subcategories.includes('Winter Jackets'));
  assert.equal(product.subcategories.includes('Hooded Leather Jackets'), false);

  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexSource, new RegExp(`slug: '${slug}'`));
  assert.match(indexSource, /subcategories: \['Puffer Jackets', 'Winter Jackets'\]/);
});
