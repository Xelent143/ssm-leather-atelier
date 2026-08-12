const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));

const slug = 'mens-waxed-brown-hooded-leather-puffer-jacket';
const blockedReferenceTerms = /jacketmaker|the jacket maker|lucas|gordon|angeljackets|angel jackets|fjackets|blingsoul|decrum/i;

test('waxed brown hooded leather puffer jacket meets its publication contract', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product, 'product must exist in merchant catalog');
  assert.equal(product.id, 'p75');
  assert.equal(product.status, 'active');
  assert.equal(product.brand, 'MOTOGRIP GEAR');
  assert.equal(product.category, 'Jackets');
  assert.equal(product.gender, 'Men');
  assert.equal(product.price, 350);
  assert.equal(product.inventory, 171);
  assert.equal(product.madeToMeasureEnabled, true);
  assert.equal(product.madeToMeasureSurcharge, 50);
  assert.deepEqual(product.subcategories, ['Puffer Jackets', 'Winter Jackets']);
  assert.deepEqual(product.options.find((option) => option.name === 'Size').values, ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']);
  assert.deepEqual(product.colors, ['Waxed Brown']);
  assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
  assert.equal(product.galleryImages.length, 6);
  assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
  assert.equal(product.primaryImage, `assets/generated/jackets/${slug}/01-model-front.png`);
  assert.match(product.galleryImages.join(' '), /05-close-up\.png/);
  assert.equal(Object.keys(product.colorImages).length, 1);
  assert.equal(product.colorImages['Waxed Brown'], `assets/generated/jackets/${slug}/03-product-front.png`);
  assert.match(product.productType, /Men's leather jackets > Hooded leather puffer jackets/);
  assert.equal(product.leatherType, 'Sheepskin leather with a semi-aniline finish');
  assert.equal(product.lining, 'Polyester lining');
  assert.equal(product.closureType, 'Full front zipper');
  assert.match(product.features.join(' '), /Removable hood/);
  assert.match(product.features.join(' '), /Open-hem cuffs with hidden rib/);

  for (const image of [product.primaryImage, ...product.galleryImages, ...Object.values(product.colorImages)]) {
    assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
  }

  const publicProduct = publicProductForPdp(product);
  assert.equal(publicProduct.images.length, 7);
  assert.equal(publicProduct.variants.length, 9);
  assert.ok(publicProduct.variants.every((variant) => variant.quantity === 19));
  assert.equal(publicProduct.colors.length, 1);
  assert.ok(publicProduct.colors.every((color) => color.image));
  assert.doesNotMatch(JSON.stringify(product), blockedReferenceTerms);
});

test('waxed brown hooded leather puffer jacket appears only in requested men collections', () => {
  const product = catalog.products.find((item) => item.slug === slug);
  assert.ok(product.subcategories.includes('Puffer Jackets'));
  assert.ok(product.subcategories.includes('Winter Jackets'));
  assert.equal(product.subcategories.includes('Hooded Leather Jackets'), false);

  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(indexSource, new RegExp(`slug: '${slug}'`));
  assert.match(indexSource, /subcategories: \['Puffer Jackets', 'Winter Jackets'\]/);
  assert.match(indexSource, /price: 350/);
});
