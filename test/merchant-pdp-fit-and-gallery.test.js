const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

for (const file of ['ssm-pdp.jsx', 'index.html']) {
  test(`${file} keeps merchant PDP galleries contained and exposes fit controls`, () => {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /className="factual-pdp-grid pdp-commerce-layout"/);
    assert.match(source, /objectFit: 'contain'/);
    assert.match(source, /title: 'Standard size'/);
    assert.match(source, /title: 'Made to measure'/);
    assert.match(source, /Customize in Fit Lab/);
    assert.match(source, /SIZE GUIDE/);
    assert.match(source, /surcharge: isMadeToMeasure \? madeToMeasureSurcharge : 0/);
  });
}

test('all newly released SWAT vests retain made-to-measure support', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'merchant-catalog.json'), 'utf8'));
  const swatIds = new Set(['p35', 'p36', 'p37', 'p38', 'p39']);
  const vests = catalog.products.filter(product => swatIds.has(product.id));
  assert.equal(vests.length, swatIds.size);
  for (const vest of vests) {
    assert.equal(vest.madeToMeasureEnabled, true, `${vest.id} should support made to measure`);
    assert.equal(vest.madeToMeasureSurcharge, 50, `${vest.id} should use the approved surcharge`);
  }
});
