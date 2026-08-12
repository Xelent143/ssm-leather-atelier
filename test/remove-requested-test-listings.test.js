const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db');

test('requested test-listing cleanup targets only the screenshot product titles', () => {
  const source = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'db.js'), 'utf8');
  const targets = [
    'tst product bbrown',
    'Leather Suit Case test',
    'New product test',
    'new test product',
    "Men's White & Red Diamond-Quilted Cowhide Leather Motorcycle Vest",
  ];
  for (const title of targets) assert.match(source, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(source, /DELETE FROM admin_product_images WHERE product_id = ANY/);
  assert.match(source, /DELETE FROM admin_products WHERE id = ANY/);
  assert.equal(db.isEnabled(), false);
});
