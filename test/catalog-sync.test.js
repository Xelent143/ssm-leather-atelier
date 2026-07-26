const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { createCatalogSyncService } = require('../catalog-sync-service');
const { createCatalogSyncStore } = require('../catalog-sync-store');

function fixture() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motogrip-catalog-sync-'));
  const source = {
    products: [
      {
        id: 'website-1',
        slug: 'roadmaster-jacket',
        title: 'Roadmaster Jacket',
        sku: 'MG-ROADMASTER',
        brand: 'MOTOGRIP GEAR',
        productType: 'Motorcycle Jacket',
        primaryImage: 'assets/roadmaster.jpg',
        price: 299,
        inventory: 5,
        stock: { S: 2, M: 3 },
        status: 'active',
      },
      {
        id: 'website-1-duplicate',
        slug: 'roadmaster-jacket',
        title: 'Duplicate Roadmaster',
        sku: 'MG-ROADMASTER-DUPLICATE',
        inventory: 5,
        stock: { S: 2, M: 3 },
      },
      {
        id: 'website-2',
        slug: 'missing-sku-vest',
        title: 'Missing SKU Vest',
        inventory: 2,
        stock: { L: 2 },
      },
      {
        id: 'website-3',
        slug: 'inventory-mismatch',
        title: 'Inventory Mismatch Vest',
        sku: 'MG-MISMATCH',
        inventory: 9,
        stock: { XL: 2 },
      },
      {
        id: 'website-4',
        slug: 'unmatched-product',
        title: 'Unmatched Product',
        sku: 'MG-UNMATCHED',
        inventory: 0,
        stock: {},
      },
      {},
    ],
  };
  const plm = {
    legacyMappings: [{
      sourceSystem: 'admin-store',
      sourceEntityType: 'product',
      legacyId: 'website-1',
      productUuid: '4b3a47c4-b78f-4d8c-a8b4-7ee60511a815',
    }],
    productStyles: [],
    sellableItems: [],
  };
  const store = createCatalogSyncStore({ dataDir });
  let clock = '2026-07-26T12:00:00.000Z';
  const service = createCatalogSyncService({
    store,
    readWebsiteCatalog: () => source,
    readPlmStore: () => plm,
    now: () => clock,
  });
  return {
    dataDir,
    service,
    source,
    store,
    setClock(value) {
      clock = value;
    },
  };
}

test('read-only import creates stable identities and rejects duplicate website products', () => {
  const current = fixture();
  const sourceBefore = JSON.stringify(current.source);
  const first = current.service.catalog();

  assert.equal(first.productCount, 5);
  assert.equal(first.variantCount, 4);
  assert.equal(first.totalInventory, 16);
  assert.equal(new Set(first.products.map((product) => product.catalogProductId)).size, 5);
  assert.equal(first.products.find((product) => product.sku === 'MG-ROADMASTER').syncStatus, 'Synced');
  assert.equal(first.products.find((product) => product.title === 'Missing SKU Vest').syncStatus, 'Missing SKU');
  assert.equal(first.products.find((product) => product.sku === 'MG-MISMATCH').syncStatus, 'Inventory Mismatch');
  assert.equal(first.products.find((product) => product.sku === 'MG-UNMATCHED').syncStatus, 'Needs Review');
  assert.equal(first.products.find((product) => product.title === 'Import error').syncStatus, 'Import Error');
  assert.deepEqual(
    first.products.find((product) => product.sku === 'MG-ROADMASTER').availableSizes,
    ['S', 'M'],
  );
  assert.equal(JSON.stringify(current.source), sourceBefore);

  const identity = first.products[0].catalogProductId;
  current.setClock('2026-07-26T13:00:00.000Z');
  const second = current.service.sync();
  assert.equal(second.products[0].catalogProductId, identity);
  assert.equal(second.storeRevision, 2);
  assert.equal(second.lastSyncAt, '2026-07-26T13:00:00.000Z');
  assert.equal(JSON.stringify(current.source), sourceBefore);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('catalog store uses revision checks and restrictive runtime file permissions', () => {
  const current = fixture();
  current.service.sync();
  const saved = current.store.read();
  assert.equal(saved.schemaVersion, 1);
  assert.equal(saved.storeRevision, 1);
  assert.equal(fs.statSync(current.store.path).mode & 0o777, 0o600);
  assert.throws(
    () => current.store.write(saved, 0),
    /changed during synchronization/,
  );
  assert.equal(fs.readdirSync(current.dataDir).some((name) => name.endsWith('.tmp')), false);
  fs.rmSync(current.dataDir, { recursive: true, force: true });
});

test('catalog UI and API surface remain explicitly read-only for website records', () => {
  const admin = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'catalog-sync-service.js'), 'utf8');
  assert.match(admin, /Read-only connection/);
  assert.match(admin, /Sync website catalog/);
  assert.match(admin, /Product Image|catalog-thumb/);
  for (const label of [
    'SKU / identity',
    'Type',
    'Price',
    'Variants & sizes',
    'Inventory',
    'Status',
    'Last updated',
  ]) {
    assert.match(admin, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(service, /Inventory Mismatch/);
  assert.match(server, /pathname === '\/api\/admin\/catalog'/);
  assert.match(server, /pathname === '\/api\/admin\/catalog\/sync'/);
  assert.match(server, /Named Owner access is required/);
  assert.doesNotMatch(server, /\/api\/admin\/catalog\/publish/);
  assert.doesNotMatch(server, /\/api\/admin\/catalog\/products\/.*PUT/);
});
