const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function initializeStore(dataDir) {
  const result = spawnSync(process.execPath, ['-e', "require('./server')"], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, ADMIN_DATA_DIR: dataDir, ADMIN_CATALOG_BOOTSTRAP: '1' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
}

test('a pristine admin store is seeded from the verified website catalog', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-admin-bootstrap-'));
  initializeStore(dataDir);

  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'merchant-catalog.json'), 'utf8'));
  const store = JSON.parse(fs.readFileSync(path.join(dataDir, 'admin-store.json'), 'utf8'));

  assert.equal(store.products.length, catalog.products.length);
  assert.equal(store.orders.length, 0);
  assert.match(store.activity.at(-1).message, /verified website products/);

});

test('an existing non-pristine admin store is never overwritten', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-admin-preserve-'));
  const existing = {
    settings: {},
    products: [],
    orders: [{ id: 'order-preserve' }],
    returnRequests: [],
    activity: [{ id: 'activity-preserve', message: 'Existing production activity' }],
  };
  fs.writeFileSync(path.join(dataDir, 'admin-store.json'), `${JSON.stringify(existing)}\n`);

  initializeStore(dataDir);

  const store = JSON.parse(fs.readFileSync(path.join(dataDir, 'admin-store.json'), 'utf8'));
  assert.deepEqual(store.orders, existing.orders);
  assert.deepEqual(store.activity, existing.activity);
  assert.deepEqual(store.products, []);

});
