const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const database = fs.readFileSync(path.join(root, 'db.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'admin.css'), 'utf8');

test('product creation uses a dedicated Shopify-style admin route', () => {
  assert.match(admin, /\/admin\/products\/new/);
  assert.match(admin, /\/admin\/products\/\$\{encodeURIComponent\(row\.dataset\.product\)\}/);
  assert.match(admin, /'product-editor': renderProductEditor/);
  assert.match(admin, /Essential product details stay visible/);
  assert.match(admin, /Save &amp; publish/);
  assert.match(admin, /View live product/);
  assert.match(admin, /id="sidebar-add-product"/);
  assert.match(admin, /navigateAdmin\('\/admin\/products\/new'\)/);
  assert.match(css, /\.nav-subitem/);
});

test('essential product fields are visible and advanced fields are collapsed', () => {
  for (const label of ['Title', 'Description', 'Price', 'Compare-at price', 'Quantity', 'Gender', 'Category', 'Subcategory']) {
    assert.ok(admin.includes(label), `missing ${label}`);
  }
  assert.match(admin, /<details class="card optional-section">/);
  for (const section of ['Search engine listing', 'Product content', 'Apparel and merchant details', 'Shipping and returns', 'Leather product authority', 'Made to measure and size stock']) {
    assert.ok(admin.includes(section), `missing collapsed section ${section}`);
  }
  const labels = ['Description', 'Features', 'Specifications', 'Perfect for', 'Why you’ll love it'];
  const positions = labels.map((label) => admin.indexOf(label));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('multi-image drag, drop, batch upload, remove, and ordering are wired end to end', () => {
  assert.match(admin, /id="product-images"[^>]+multiple/);
  assert.match(admin, /media-dropzone/);
  assert.match(admin, /dataTransfer\?\.files/);
  assert.match(admin, /dragstart/);
  assert.match(admin, /\/images\/order/);
  assert.match(admin, /data-remove-image/);
  assert.match(server, /products\\\/\(\[\^\/\]\+\)\\\/images\$/);
  assert.match(server, /Upload up to 10 images at a time/);
  assert.match(server, /combined image upload must be smaller than 40 MB/);
  assert.match(database, /CREATE TABLE IF NOT EXISTS admin_product_images/);
  assert.match(database, /async function saveProductImages/);
  assert.match(database, /async function reorderProductImages/);
  assert.match(database, /async function deleteProductImage/);
  assert.match(css, /\.media-dropzone/);
  assert.match(css, /\.media-grid/);
});

test('categories support database-backed subcategories', () => {
  assert.match(database, /CREATE TABLE IF NOT EXISTS admin_subcategories/);
  assert.match(database, /async function addSubcategory/);
  assert.match(database, /async function removeSubcategory/);
  assert.match(server, /categories\\\/\(\[\^\/\]\+\)\\\/subcategories/);
  assert.match(server, /admin\\\/subcategories\\\/\(\[\^\/\]\+\)/);
  assert.match(admin, /id="add-subcategory"/);
});
