const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
const activeMenProducts = catalog.products.filter((product) => product.status === 'active' && product.gender === 'Men');
const hoodedProducts = activeMenProducts.filter((product) => (product.subcategories || []).includes('Hooded Leather Jackets'));

test('men hooded leather jackets category contains only hooded leather jacket products', () => {
  assert.ok(hoodedProducts.length > 0, 'expected active men hooded leather jacket products');

  for (const product of hoodedProducts) {
    assert.equal(product.category, 'Jackets');
    assert.equal(product.gender, 'Men');
    assert.ok((product.subcategories || []).includes('Hooded Leather Jackets'));
  }

  const nonHooded = activeMenProducts.filter((product) => !(product.subcategories || []).includes('Hooded Leather Jackets'));
  assert.ok(nonHooded.length > 0, 'test should prove the hooded category excludes other men products');
});

for (const relativePath of ['index.html', 'ssm-shop.jsx', 'ssm-app.jsx', 'server.js']) {
  test(`${relativePath} supports strict men hooded leather jacket routing/filtering`, () => {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.match(source, /Hooded Leather Jackets/);

    if (['index.html', 'ssm-shop.jsx'].includes(relativePath)) {
      assert.match(source, /initialSubcategory/);
      assert.match(source, /p\.subcategories \|\| \[\]\)\.includes\(subcategory\)/);
    }

    if (relativePath !== 'ssm-shop.jsx') {
      assert.match(source, /\/men\/hooded-leather-jackets/);
      assert.match(source, /subcategory: 'Hooded Leather Jackets'/);
    }
  });
}
