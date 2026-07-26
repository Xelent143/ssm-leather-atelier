const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('Product Detail exposes sequential Owner identity controls', () => {
  for (const marker of [
    'Generate identity preview',
    'Approve identity',
    'Lock identity',
    'Owner unlock',
    'Modify SKU',
    'Internal Product Code',
    'Factory Code',
  ]) assert.match(admin, new RegExp(marker));
});

test('Listing Workspace treats SKU as Product Identity managed', () => {
  assert.match(admin, /Managed by Product Identity Engine/);
  assert.match(admin, /field === 'sku' \? 'disabled'/);
  assert.match(server, /productIdentityService/);
  assert.ok(server.includes('identity(?:\\/(generate|override|approve|lock|unlock))?'));
  assert.match(server, /catalogProduct\?\.variants/);
  assert.match(server, /variant\.option === 'Size'/);
});
