const assert = require('node:assert/strict');
const test = require('node:test');
const { createWebsiteWriteAdapter, websiteRevision } = require('../website-write-adapter');

test('website status changes are atomic, revision checked, identity preserving and restorable', async () => {
  let store = {
    settings: {},
    products: [{
      id: 'website-1', slug: 'disposable-product', title: 'Disposable product',
      sku: 'MG-TST-0001', status: 'active', price: 10,
    }],
  };
  const events = [];
  const adapter = createWebsiteWriteAdapter({
    readStore: () => structuredClone(store),
    readWebsiteCatalog: () => structuredClone(store),
    writeStore: (next) => { store = structuredClone(next); },
    onMutation: (event) => events.push(event),
  });
  const original = structuredClone(store.products[0]);
  const hidden = await adapter.setStatuses([{
    websiteProductId: original.id,
    currentHandle: original.slug,
    expectedWebsiteRevision: websiteRevision(original),
    status: 'hidden',
  }]);
  assert.equal(store.products[0].status, 'hidden');
  assert.equal(store.products[0].id, original.id);
  assert.equal(store.products[0].slug, original.slug);
  assert.equal(store.products[0].sku, original.sku);
  assert.equal(hidden[0].product.websiteRevision, store.products[0].websiteRevision);
  await assert.rejects(adapter.setStatuses([{
    websiteProductId: original.id,
    expectedWebsiteRevision: 'stale',
    status: 'active',
  }]), (error) => error.code === 'REVISION_CONFLICT');
  await adapter.setStatuses([{
    websiteProductId: original.id,
    expectedWebsiteRevision: store.products[0].websiteRevision,
    status: 'active',
  }]);
  assert.equal(store.products.length, 1);
  assert.equal(store.products[0].status, 'active');
  assert.deepEqual(events.map((event) => event.action), [
    'website_product_status_updated',
    'website_product_status_updated',
  ]);
});

test('status batch validates every target before writing', async () => {
  let writes = 0;
  const store = { settings: {}, products: [{ id: 'one', slug: 'one', title: 'One', price: 1, status: 'active' }] };
  const adapter = createWebsiteWriteAdapter({
    readStore: () => structuredClone(store),
    readWebsiteCatalog: () => structuredClone(store),
    writeStore: () => { writes += 1; },
  });
  await assert.rejects(adapter.setStatuses([
    { websiteProductId: 'one', status: 'hidden' },
    { websiteProductId: 'missing', status: 'hidden' },
  ]), (error) => error.code === 'NOT_FOUND');
  assert.equal(writes, 0);
});
