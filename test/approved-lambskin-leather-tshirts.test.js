const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));

const expectedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
const releases = [
  { id: 'p68', slug: 'mens-black-lambskin-leather-t-shirt', color: 'Black' },
  { id: 'p69', slug: 'mens-orange-lambskin-leather-t-shirt', color: 'Orange' },
  { id: 'p70', slug: 'mens-white-lambskin-leather-t-shirt', color: 'White' },
];
const blockedReferenceTerms = /jacketmaker|the jacket maker|gordon|angeljackets|angel jackets|fjackets|blingsoul|decrum|amazon|etsy|ebay/i;

for (const release of releases) {
  test(`${release.color} lambskin leather T-shirt meets its publication contract`, () => {
    const product = catalog.products.find((item) => item.slug === release.slug);
    assert.ok(product, 'product must exist in merchant catalog');
    assert.equal(product.id, release.id);
    assert.equal(product.status, 'active');
    assert.equal(product.brand, 'MOTOGRIP GEAR');
    assert.equal(product.category, 'Leather Shirts');
    assert.equal(product.gender, 'Men');
    assert.equal(product.price, 220);
    assert.equal(product.inventory, 190);
    assert.equal(product.madeToMeasureEnabled, true);
    assert.equal(product.madeToMeasureSurcharge, 50);
    assert.deepEqual(product.options.find((option) => option.name === 'Size').values, expectedSizes);
    assert.deepEqual(product.options.find((option) => option.name === 'Color').values, [release.color]);
    assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
    assert.equal(product.galleryImages.length, 6);
    assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
    assert.match(product.galleryImages[3], /05-close-up\.png$/);
    assert.equal(product.colorImages[release.color], product.galleryImages[1]);
    assert.match(product.productType, /Men's leather shirts > Leather T-shirts/);

    for (const image of [product.primaryImage, ...product.galleryImages, ...Object.values(product.colorImages)]) {
      assert.equal(fs.existsSync(path.join(root, image)), true, `missing ${image}`);
    }

    const publicProduct = publicProductForPdp(product);
    assert.equal(publicProduct.images.length, 7);
    assert.equal(publicProduct.variants.length, 10);
    assert.ok(publicProduct.variants.every((variant) => variant.quantity === 19));
    assert.equal(publicProduct.colors.length, 1);
    assert.ok(publicProduct.colors.every((color) => color.image));
    assert.doesNotMatch(JSON.stringify(product), blockedReferenceTerms);
  });
}

test('all three leather T-shirts appear in the Men Leather Shirts collection', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const release of releases) {
    assert.match(indexSource, new RegExp(`slug: '${release.slug}'`));
  }
  assert.equal((indexSource.match(/cat: 'Leather Shirts', gender: 'Men'/g) || []).length >= 3, true);
});
