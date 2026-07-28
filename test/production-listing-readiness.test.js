const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('Product Editor exposes Quick Listing readiness without bypassing governance', () => {
  const ui = fs.readFileSync(path.join(__dirname, '..', 'product-editor-v2-ui.js'), 'utf8');
  for (const requirement of [
    'Quick listing readiness', 'Product name', 'Category', 'Price', 'Primary image', 'Product status',
    'Locked Product Identity', 'Trusted Product Release', 'Valid Knowledge Lock', 'Owner-approved revision',
  ]) assert.match(ui, new RegExp(requirement));
});

test('private draft preview is authenticated and excluded from indexing', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /admin\\\/product-preview/);
  assert.match(server, /Private draft preview/);
  assert.match(server, /noindex,nofollow,noarchive/);
  assert.match(server, /adminSecurity\.getSession/);
  assert.match(server, /productEditorV2Service\.preview/);
});

test('Owner guide follows the implemented workflow and permanent website contract', () => {
  const guide = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'create-and-publish-your-first-product.md'), 'utf8',
  );
  const sequence = [
    '## 1. Create the draft',
    '## 2. Add factual information',
    '## 3. Review website content',
    '## 4. Preview the draft',
    '## 5. Complete governance',
    '## 6. Publish',
    '## 7. Edit and republish',
    '## 8. Hide and restore',
  ];
  let last = -1;
  for (const heading of sequence) {
    const current = guide.indexOf(heading);
    assert.ok(current > last, `${heading} must be present and ordered`);
    last = current;
  }
  for (const section of [
    '1. Description', '2. Features', '3. Specifications',
    '4. Perfect For', "5. Why You'll Love It",
  ]) assert.match(guide, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('untracked Quick Listings remain sellable in both storefront sources and checkout', () => {
  const pdp = fs.readFileSync(path.join(__dirname, '..', 'ssm-pdp.jsx'), 'utf8');
  const bundledPdp = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  for (const source of [pdp, bundledPdp]) {
    assert.match(source, /p\.trackInventory === false/);
    assert.match(source, /p\.continueSellingWhenOutOfStock === true/);
  }
  assert.match(server, /product\.trackInventory !== false/);
  assert.match(server, /product\.continueSellingWhenOutOfStock !== true/);
});
