const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const { publicProductForPdp } = require(path.join(root, 'server.js'));

const expectedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
const releases = [
  {
    id: 'p71',
    slug: 'mens-tan-brown-chevron-quilted-sheepskin-leather-puffer-jacket',
    color: 'Tan Brown',
  },
  {
    id: 'p72',
    slug: 'mens-deep-green-chevron-quilted-sheepskin-leather-puffer-jacket',
    color: 'Deep Green',
  },
  {
    id: 'p73',
    slug: 'mens-black-chevron-quilted-sheepskin-leather-puffer-jacket',
    color: 'Black',
  },
];
const blockedReferenceTerms = /jacketmaker|the jacket maker|travis|gordon|angeljackets|angel jackets|fjackets|blingsoul|decrum|shopify|etsy|ebay|amazon/i;

for (const release of releases) {
  test(`${release.color} chevron leather puffer jacket meets its publication contract`, () => {
    const product = catalog.products.find((item) => item.slug === release.slug);
    assert.ok(product, 'product must exist in merchant catalog');
    assert.equal(product.id, release.id);
    assert.equal(product.status, 'active');
    assert.equal(product.brand, 'MOTOGRIP GEAR');
    assert.equal(product.category, 'Jackets');
    assert.deepEqual(product.subcategories, ['All Leather Jackets', 'Puffer Jackets', 'Winter Jackets']);
    assert.equal(product.gender, 'Men');
    assert.equal(product.price, 335);
    assert.equal(product.inventory, 171);
    assert.equal(product.madeToMeasureEnabled, true);
    assert.equal(product.madeToMeasureSurcharge, 50);
    assert.deepEqual(product.options.find((option) => option.name === 'Size').values, expectedSizes);
    assert.deepEqual(product.options.find((option) => option.name === 'Color').values, [release.color]);
    assert.deepEqual(product.colors, [release.color]);
    assert.equal(Object.values(product.stock).every((quantity) => quantity === 19), true);
    assert.equal(product.galleryImages.length, 6);
    assert.equal(product.galleryImages.length, product.galleryImageAltText.length);
    assert.match(product.galleryImages[3], /05-close-up\.png$/);
    assert.match(product.galleryImages[4], /06-infographic\.png$/);
    assert.equal(product.colorImages[release.color], product.galleryImages[1]);
    assert.match(product.productType, /Men's leather jackets > Puffer jackets/);

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
}

test('all three chevron leather puffers appear in the men puffer and winter jacket collections', () => {
  const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const release of releases) {
    assert.match(indexSource, new RegExp(`slug: '${release.slug}'`));
  }
  assert.equal((indexSource.match(/cat: 'Jackets', gender: 'Men'/g) || []).length >= 3, true);
  assert.equal((indexSource.match(/subcategories: \['All Leather Jackets', 'Puffer Jackets', 'Winter Jackets'\]/g) || []).length >= 3, true);
});
